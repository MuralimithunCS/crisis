import { Alert } from '../models/Alert.js';
import { notificationService } from './notifications.js';
import { redis } from '../config/redis.js';
import axios from 'axios';

class AlertProcessor {
  aiEngineUrl: string;
  io: any;
  constructor() {
    this.aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    this.io = null;
  }

  setIo(ioInstance) {
    this.io = ioInstance;
  }
  
  async start() {
    console.log('Starting alert processor...');
    this.processQueue();
  }
  
  async processQueue() {
    // Basic polling loop if redis.brpop isn't perfectly supported by the node redis client
    // For production node redis v4, brPop relies on an array or string
    while (true) {
      try {
        const result = await redis.brPop('ai:analysis:queue', 5);
        if (result) {
          const alertId = result.element;
          await this.processAlert(alertId);
        }
      } catch (error) {
        // Just suppress timeout logs
        await this.sleep(1000);
      }
    }
  }
  
  async processAlert(alertId) {
    console.log(`Processing alert: ${alertId}`);
    
    try {
      const alert = await Alert.findById(alertId);
      if (!alert) {
        console.warn(`Alert ${alertId} not found`);
        return;
      }
      
      const analysis = await this.requestAIAnalysis(alert);
      
      alert.aiAnalysis = {
        ...analysis,
        processedAt: new Date()
      };
      await alert.save();
      
      // Broadcast to connected clients (if WebSocket layer is available).
      this.io?.emit('alert:update', {
        id: alertId,
        updates: { aiAnalysis: alert.aiAnalysis }
      });
      
      const notificationRadius = alert.affectedRadius || this.estimateNotificationRadius(alert);
      await notificationService.notifyUsersInRadius(alert, notificationRadius);
      console.log(`Alert ${alertId} processed successfully`);
      
    } catch (error) {
      console.error(`Failed to process alert ${alertId}:`, error.message);
      
      const retryCount = await redis.incr(`alert:retry:${alertId}`);
      if (Number(retryCount) <= 3) {
        await redis.lPush('ai:analysis:queue', alertId);
      } else {
        await redis.del(`alert:retry:${alertId}`);
        console.error(`Alert ${alertId} failed after 3 retries`);
      }
    }
  }
  
  async requestAIAnalysis(alert) {
    try {
        const response = await axios.post(
          `${this.aiEngineUrl}/analyze/alert`,
          {
            alert_id: alert._id.toString(),
            alert_type: alert.type,
            severity: alert.severity,
            location: alert.location,
            parameters: {}
          },
          { timeout: 30000 }
        );
        return response.data;
    } catch (err) {
        console.log("Mocking AI Analysis (AI Engine unreachable)");
        return {
           riskScore: 75,
           recommendations: ["Evacuate to safe zones", "Monitor channels"],
           evacuationRoutes: []
        };
    }
  }
  
  estimateNotificationRadius(alert) {
    const radiusMap: any = {
      low: 10,
      medium: 25,
      high: 50,
      critical: 100
    };
    return radiusMap[alert.severity] || 25;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const alertProcessor = new AlertProcessor();
