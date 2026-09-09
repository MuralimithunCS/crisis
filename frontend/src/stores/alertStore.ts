import { create } from 'zustand';

interface Alert {
  _id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  location: {
    coordinates: [number, number];
    region?: string;
  };
  status: 'active' | 'monitoring' | 'resolved';
  aiAnalysis?: {
    riskScore: number;
    recommendations: string[];
    evacuationRoutes: any[];
  };
  createdAt: string;
}

interface AlertState {
  alerts: Alert[];
  activeAlerts: Alert[];
  selectedAlert: Alert | null;
  filters: {
    type: string | null;
    severity: string | null;
    status: string | null;
  };
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  selectAlert: (alert: Alert | null) => void;
  setFilters: (filters: Partial<AlertState['filters']>) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  activeAlerts: [],
  selectedAlert: null,
  filters: {
    type: null,
    severity: null,
    status: null
  },
  
  setAlerts: (alerts) => set({
    alerts,
    activeAlerts: alerts.filter(a => a.status === 'active')
  }),
  
  addAlert: (alert) => set((state) => {
    const exists = state.alerts.find(a => a._id === alert._id);
    if (exists) return state;
    
    const newAlerts = [alert, ...state.alerts];
    return {
      alerts: newAlerts,
      activeAlerts: newAlerts.filter(a => a.status === 'active')
    };
  }),
  
  updateAlert: (id, updates) => set((state) => ({
    alerts: state.alerts.map(a => 
      a._id === id ? { ...a, ...updates } : a
    ),
    selectedAlert: state.selectedAlert?._id === id 
      ? { ...state.selectedAlert, ...updates }
      : state.selectedAlert
  })),
  
  selectAlert: (alert) => set({ selectedAlert: alert }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  }))
}));
