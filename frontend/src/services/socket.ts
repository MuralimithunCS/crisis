import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect() {
    const token = useAuthStore.getState().accessToken;
    
    if (!token) {
      console.warn('No auth token available for socket connection');
      return;
    }
    
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000
    });
    
    this.setupListeners();
  }
  
  private setupListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      
      const user = useAuthStore.getState().user;
      if (user?.profile?.location?.coordinates) {
        this.subscribeToLocation(user.profile.location.coordinates);
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    this.socket.on('alert:new', (alert) => {
      console.log('New alert received:', alert);
      useAlertStore.getState().addAlert(alert);
      this.showNotification(alert);
    });
    
    this.socket.on('alert:update', (data) => {
      useAlertStore.getState().updateAlert(data.id, data.updates);
    });
    
    this.socket.on('alert:critical', (alert) => {
      useAlertStore.getState().addAlert(alert);
      this.showCriticalNotification(alert);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });
  }
  
  subscribeToLocation(coordinates: [number, number]) {
    if (!this.socket) return;
    const region = this.getRegionFromCoords(coordinates);
    this.socket.emit('subscribe:location', { region, coordinates });
  }
  
  private getRegionFromCoords(coords: [number, number]): string {
    return `region-${Math.floor(coords[0])}-${Math.floor(coords[1])}`;
  }
  
  private async showNotification(alert: any) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(`⚠️ ${alert.title}`, {
        body: alert.description || `${alert.type} alert - ${alert.severity}`,
        icon: '/alert-icon.png',
        tag: alert._id,
        requireInteraction: alert.severity === 'critical'
      });
    }
  }
  
  private showCriticalNotification(alert: any) {
    // Play alert sound mock
    console.log('Critical Alert Sound Triggered');
    this.showNotification(alert);
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
