import { AlertTriangle, Users, MapPin, Activity, ShieldAlert, Zap } from 'lucide-react';
import { useAlertStore } from '../stores/alertStore';
import { AlertCard, StatsCard, RecentActivity, AIInsightsPanel } from './Components';
import { MapView } from '../components/MapView';
import { Chatbot } from '../components/Chatbot';

export function Dashboard() {
  const { activeAlerts } = useAlertStore();

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm transition-all text-gray-800">
        <div className="max-w-[1600px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#0f172a] to-blue-900 p-2.5 rounded-xl text-white shadow-lg shadow-blue-900/20 ring-1 ring-white/20">
              <Zap className="w-5 h-5" fill="currentColor" />
            </div>
            <div>
               <h1 className="text-[19px] leading-none font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">CrisisIQ</h1>
               <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600">Disaster Intelligence Protocol</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-5 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-sm flex items-center gap-2 uppercase tracking-wide">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                 System Online
             </div>
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-100 to-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 font-extrabold text-sm ring-2 ring-white ring-offset-1">
                 HQ
             </div>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-16 px-6 max-w-[1600px] mx-auto">
        {/* Statistics Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Active Crises" value={activeAlerts.length} icon={<AlertTriangle className="w-24 h-24 stroke-1"/>} />
          <StatsCard title="Personnel Deployed" value="1,245" icon={<Users className="w-24 h-24 stroke-1"/>} />
          <StatsCard title="Safe Zones Online" value="12" icon={<MapPin className="w-24 h-24 stroke-1"/>} />
          <StatsCard title="Incoming Packets/s" value="342" icon={<Activity className="w-24 h-24 stroke-1"/>} />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area (Map) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden relative group ring-1 ring-slate-100">
              <div className="px-6 py-4 border-b border-gray-100/50 flex justify-between items-center bg-gradient-to-r from-white to-slate-50">
                <h2 className="text-sm font-extrabold text-slate-800 tracking-widest uppercase flex items-center gap-2">
                   <MapPin className="w-4 h-4 text-blue-500" /> Geospatial Intelligence
                </h2>
                <span className="text-[10px] font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-wider border border-blue-100 shadow-inner">Live Satellite View</span>
              </div>
              <div className="h-[650px] w-full relative bg-slate-100">
                <MapView alerts={activeAlerts} height="650px" showControls />
                {/* Decorative UI elements hugging the map */}
                <div className="absolute bottom-6 left-6 px-4 py-2 bg-white/90 backdrop-blur shadow-lg rounded-xl border border-white pointer-events-none">
                   <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">GPS Tracking Active</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6 flex flex-col">
            <AIInsightsPanel />
            
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white overflow-hidden flex flex-col flex-1 min-h-[400px] ring-1 ring-slate-100 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />
              <div className="px-6 py-5 border-b border-gray-100/50 bg-white/80 backdrop-blur-sm z-10 sticky top-0">
                <h2 className="text-sm font-extrabold text-slate-800 flex items-center justify-between uppercase tracking-widest">
                  Live Mission Feed
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">{activeAlerts.length} total</span>
                </h2>
              </div>
              <div className="p-5 overflow-y-auto flex-1 space-y-1 bg-slate-50/30">
                {activeAlerts.length === 0 ? (
                   <div className="text-center text-slate-400 mt-16 flex flex-col items-center">
                     <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 inner-shadow">
                        <ShieldAlert className="w-10 h-10 text-slate-300" />
                     </div>
                     <span className="font-bold text-sm text-slate-500 tracking-wide">All zones completely stable.</span>
                     <span className="text-xs mt-1 opacity-70">Awaiting external USGS seismic or basin alert triggers.</span>
                   </div>
                ) : (
                   activeAlerts.map(alert => <AlertCard key={alert._id} alert={alert} />)
                )}
              </div>
            </div>

            <RecentActivity />
          </div>
        </div>
      </main>
      
      {/* Floating AI Chatbot Widget */}
      <Chatbot />
    </div>
  );
}
