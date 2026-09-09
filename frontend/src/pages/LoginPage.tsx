import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaFireExtinguisher, FaArrowLeft, FaServer } from 'react-icons/fa';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../App';

export function LoginPage() {
  const navigate = useNavigate();
  const loginFn = useAuthStore(state => state.login);
  
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!selectedRole) return;
    setLoading(true);
    
    // Simulate login & set authState
    setTimeout(() => {
      loginFn({
        id: `mock_id_${selectedRole}`,
        email: `demo@${selectedRole.toLowerCase()}.crisisiq.com`,
        role: selectedRole.toLowerCase() as 'citizen' | 'responder' | 'admin',
        profile: {
          name: `${selectedRole} User`
        }
      }, 'mock_access_token', 'mock_refresh_token');
      
      if (selectedRole === 'Responder' || selectedRole === 'Admin') {
        navigate('/responder-dashboard');
      } else {
        navigate('/citizen-dashboard');
      }
    }, 800);
  };

  const onBack = () => navigate('/');

  return (
    <div className="min-h-screen bg-[#060d1a] text-slate-200 font-sans flex items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] -top-32 -left-32 animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -bottom-32 -right-32 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="z-10 bg-[#0c1829]/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl w-full max-w-4xl shadow-2xl relative">
        <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
          <FaArrowLeft /> Retract
        </button>

        <div className="text-center mb-10 pt-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"></div>
            <div className="text-5xl font-['Bebas_Neue'] tracking-widest text-slate-100 flex items-center">
              CRISIS<span className="text-red-500 ml-2">IQ</span>
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-slate-400">Secure Access Gateway</h1>
          <p className="text-slate-400 mt-2 text-sm tracking-wide">Select your authorization clearance level to proceed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* CITIZEN */}
          <div 
            onClick={() => setSelectedRole('Citizen')}
            className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center ${selectedRole === 'Citizen' ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_30px_rgba(0,212,255,0.2)] scale-105' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
          >
            <div className={`text-4xl mb-4 ${selectedRole === 'Citizen' ? 'text-cyan-400' : 'text-slate-500'}`}><FaUser /></div>
            <h3 className={`font-bold uppercase tracking-widest text-lg mb-2 ${selectedRole === 'Citizen' ? 'text-cyan-400' : 'text-slate-300'}`}>Citizen</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Public safety tools, live evacuation routes, and emergency broadcast alerts.</p>
          </div>

          {/* RESPONDER */}
          <div 
            onClick={() => setSelectedRole('Responder')}
            className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center ${selectedRole === 'Responder' ? 'bg-red-500/20 border-red-400 shadow-[0_0_30px_rgba(255,59,59,0.2)] scale-105' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
          >
            <div className={`text-4xl mb-4 ${selectedRole === 'Responder' ? 'text-red-400' : 'text-slate-500'}`}><FaFireExtinguisher /></div>
            <h3 className={`font-bold uppercase tracking-widest text-lg mb-2 ${selectedRole === 'Responder' ? 'text-red-400' : 'text-slate-300'}`}>Responder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Field dispatch coordination, hazard parameters, and critical AI diagnostics.</p>
          </div>

          {/* ADMIN */}
          <div 
            onClick={() => setSelectedRole('Admin')}
            className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center ${selectedRole === 'Admin' ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_30px_rgba(255,214,0,0.2)] scale-105' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
          >
            <div className={`text-4xl mb-4 ${selectedRole === 'Admin' ? 'text-yellow-400' : 'text-slate-500'}`}><FaServer /></div>
            <h3 className={`font-bold uppercase tracking-widest text-lg mb-2 ${selectedRole === 'Admin' ? 'text-yellow-400' : 'text-slate-300'}`}>Admin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Full system override, global metric analytics, and crisis infrastructure routing.</p>
          </div>

        </div>

        <div className="flex justify-center">
          <button 
            disabled={!selectedRole || loading}
            onClick={handleLogin}
            className={`px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 flex items-center gap-3 ${!selectedRole ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-[1.02] shadow-[0_0_20px_rgba(99,102,241,0.4)]'}`}
          >
            {loading ? (
              <><span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span> Authenticating Handshake...</>
            ) : (
              selectedRole ? `Initialize Sequence [${selectedRole}]` : 'Select Clearance Level'
            )}
          </button>
        </div>

        <div className="flex flex-col items-center justify-center mt-6 pt-6 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-2.5">Hackathon Direct Evaluation</span>
          <button 
            onClick={() => navigate('/flood')}
            className="px-6 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
          >
            ⚡ Open Flash-Flood AI Predictor (No Login Required)
          </button>
        </div>
      </div>
    </div>
  );
}
