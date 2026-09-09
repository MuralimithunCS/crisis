// We'll mock the actual third-party services to prevent errors during local dev while showing structure
import { User } from '../models/User.js';

class NotificationService {
  async notifyUsersInRadius(alert, radiusKm = 50) {
    // Find users within the affected radius
    const users = await User.find({
      'profile.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: alert.location.coordinates
          },
          $maxDistance: radiusKm * 1000 // meters
        }
      }
    });
    
    console.log(`Found ${users.length} users to notify for alert ${alert._id}`);
    
    // Send notifications based on user preferences
    const results = await Promise.allSettled(
      users.map(user => this.notifyUser(user, alert))
    );
    
    return {
      total: users.length,
      succeeded: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  }
  
  async notifyUser(user, alert) {
    const notifications = [];
    
    if (user.preferences?.notifications?.push && user.fcmTokens?.length) {
      notifications.push(this.sendPushNotification(user, alert));
    }
    
    if (user.preferences?.notifications?.sms && user.profile?.phone) {
      notifications.push(this.sendSMS(user, alert));
    }
    
    if (user.preferences?.notifications?.email) {
      notifications.push(this.sendEmail(user, alert));
    }
    
    await Promise.allSettled(notifications);
  }
  
  async sendPushNotification(user, alert) {
    console.log(`Mock: Push notification sent to user ${user._id}`);
    return Promise.resolve({ success: true, failureCount: 0 });
  }
  
  async sendSMS(user, alert) {
    const message = `⚠️ CRISIS ALERT: ${this.getAlertTitle(alert)}\n\n${this.getAlertBody(alert)}\n\nStay safe. Reply STOP to unsubscribe.`;
    console.log(`Mock: SMS sent to ${user.profile.phone}`);
    return Promise.resolve(true);
  }
  
  async sendEmail(user, alert) {
    const html = this.generateAlertEmailHTML(user, alert);
    console.log(`Mock: Email sent to ${user.email}`);
    return Promise.resolve(true);
  }
  
  getAlertTitle(alert) {
    const typeEmoji: any = {
      earthquake: '🌍',
      flood: '🌊',
      fire: '🔥',
      cyclone: '🌀',
      tsunami: '🌊'
    };
    
    return `${typeEmoji[alert.type] || '⚠️'} ${alert.title}`;
  }
  
  getAlertBody(alert) {
    let body = alert.description || '';
    
    if (alert.aiAnalysis?.recommendations?.length) {
      body += `\n\nRecommended action: ${alert.aiAnalysis.recommendations[0]}`;
    }
    
    return body;
  }
  
  generateAlertEmailHTML(user, alert) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; }
          .content { padding: 20px; }
          .severity { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          .recommendations { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .action-btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">${this.getAlertTitle(alert)}</h1>
          <span class="severity">${alert.severity.toUpperCase()}</span>
        </div>
        <div class="content">
          <p>Dear ${user.profile?.name || 'Resident'},</p>
          <p>${alert.description || 'A disaster alert has been issued for your area.'}</p>
          
          ${alert.location?.region ? `<p><strong>Location:</strong> ${alert.location.region}</p>` : ''}
          
          ${alert.aiAnalysis?.recommendations?.length ? `
            <div class="recommendations">
              <h3>Recommended Actions:</h3>
              <ul>
                ${alert.aiAnalysis.recommendations.map((r: any) => `<li>${r}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <a href="${process.env.FRONTEND_URL}/alerts/${alert._id}" class="action-btn">
            View Full Details
          </a>
        </div>
      </body>
      </html>
    `;
  }
  
  getSeverityColor(severity) {
    const colors: any = {
      low: '#22c55e',
      medium: '#eab308',
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[severity] || '#6b7280';
  }
}

export const notificationService = new NotificationService();
