import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { StandaloneDashboard } from './pages/StandaloneDashboard';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ResponderDashboard } from './pages/ResponderDashboard';
import { FlashFloodPredictor } from './components/FlashFloodPredictor';
import { useAuthStore } from './stores/authStore';
import './index.css';

export type UserRole = 'Citizen' | 'Responder' | 'Admin' | null;

const ProtectedResponderRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'responder' && user.role !== 'admin') {
    return <Navigate to="/citizen-dashboard" replace />;
  }

  return <>{children}</>;
};

const ProtectedCitizenRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  useEffect(() => {
    // Backend connection check can be added here if needed in the future
  }, []);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<StandaloneDashboard role="Admin" defaultTab="flood" />} />
        <Route path="/eoc" element={<StandaloneDashboard role="Admin" defaultTab="flood" />} />
        <Route path="/flood" element={<FlashFloodPredictor onClose={() => window.location.href = '/dashboard'} />} />
        <Route path="/flash-flood" element={<FlashFloodPredictor onClose={() => window.location.href = '/dashboard'} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/citizen-dashboard" 
          element={
            <ProtectedCitizenRoute>
              <StandaloneDashboard role="Citizen" />
            </ProtectedCitizenRoute>
          } 
        />
        <Route 
          path="/responder-dashboard" 
          element={
            <ProtectedResponderRoute>
              <ResponderDashboard />
            </ProtectedResponderRoute>
          } 
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
