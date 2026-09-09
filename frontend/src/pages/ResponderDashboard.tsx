import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { 
  FaUserShield, FaMapMarkedAlt, FaListUl, FaAmbulance, 
  FaComments, FaChartPie, FaCheckCircle, FaTimesCircle, FaLocationArrow, FaArrowLeft
} from 'react-icons/fa';
import { useAuthStore } from '../stores/authStore';
import { FlashFloodPredictor } from '../components/FlashFloodPredictor';

// Map Auto-Updater
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const RESPONDER_AVATAR = "https://ui-avatars.com/api/?name=RS&background=b91c1c&color=fff";

const initialIncidents = [
  { id: 'inc-1', title: 'Category 3 Flood - Sector 4', location: [20.0, 0.0], severity: 'High', status: 'Pending', time: '10:42 AM', type: 'FL' },
  { id: 'inc-2', title: 'Structure Fire - Warehouse', location: [20.1, 0.1], severity: 'Medium', status: 'Assigned', time: '11:05 AM', type: 'FI' },
  { id: 'inc-3', title: 'Traffic Collision on I-95', location: [19.9, -0.1], severity: 'Low', status: 'En Route', time: '11:30 AM', type: 'AC' }
];

export function ResponderDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  
  const [activeTab, setActiveTab] = useState('Map');
  const [incidents, setIncidents] = useState(initialIncidents);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(10);
  const [showFloodPredictor, setShowFloodPredictor] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const updateIncidentStatus = (id: string, newStatus: string) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc));
    toast.success(`Incident status updated to ${newStatus}`, { style: { background: '#10b981', color: '#fff' }});
  };

  const getMarkerIcon = (severity: string) => {
    const colors: Record<string, string> = { High: '#ef4444', Medium: '#f97316', Low: '#eab308' };
    const color = colors[severity] || '#3b82f6';
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {showFloodPredictor && (
        <FlashFloodPredictor onClose={() => setShowFloodPredictor(false)} />
      )}
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse"></div>
          <h1 className="text-3xl font-['Bebas_Neue'] tracking-widest text-slate-100 flex items-center">
            CRISIS<span className="text-red-500 ml-1">IQ</span>
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {['Map', 'Incidents', 'Resources', 'Comms', 'Analytics'].map((tab) => {
            const icons: any = { Map: FaMapMarkedAlt, Incidents: FaListUl, Resources: FaAmbulance, Comms: FaComments, Analytics: FaChartPie };
            const Icon = icons[tab];
            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === tab ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <Icon className="text-lg" />
                <span className="font-bold tracking-wide text-sm">{tab}</span>
              </button>
            )
          })}

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setShowFloodPredictor(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-xl transition font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.2)]"
            >
              <span>⚡ Flash Flood AI</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition text-slate-400 font-bold text-sm">
             <FaArrowLeft /> Exit System
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-8 z-40 shadow-sm shrink-0">
           <div className="flex flex-col">
             <h2 className="text-xl font-black uppercase tracking-widest text-white">{activeTab} Dashboard</h2>
             <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Secure Responder Network</span>
           </div>

           <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFloodPredictor(true)}
                className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition"
              >
                ⚡ Flash-Flood AI
              </button>

              {/* RESPONDER BADGE */}
              <div className="bg-red-600 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400">
                <FaUserShield className="text-white text-sm" />
                <span className="text-white text-xs font-black tracking-widest uppercase mt-[2px]">Responder Level</span>
              </div>
              
              <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
                <img src={RESPONDER_AVATAR} alt="Responder" className="w-10 h-10 rounded-full border-2 border-slate-700" />
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-slate-200 capitalize">{user?.profile?.name || 'Dispatcher Unit'}</span>
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {user?.id?.substring(0,8) || 'UNIT-01X'}</span>
                </div>
              </div>
           </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           
           {/* Analytics Row - Available everywhere */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 shrink-0">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col shadow-lg">
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Active Cases</span>
                 <span className="text-3xl font-black text-rose-500">{incidents.length}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col shadow-lg">
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Resolved Today</span>
                 <span className="text-3xl font-black text-emerald-500">14</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col shadow-lg">
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Avg Response Time</span>
                 <span className="text-3xl font-black text-sky-500">4m 12s</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col shadow-lg">
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Unassigned</span>
                 <span className="text-3xl font-black text-amber-500">{incidents.filter(i => i.status === 'Pending').length}</span>
              </div>
           </div>

           {/* Tab Views */}
           {activeTab === 'Map' && (
              <div className="h-[600px] w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl ring-1 ring-white/5 relative z-10">
                <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%', background: '#020617' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <ChangeView center={mapCenter} zoom={mapZoom} />
                  {incidents.map(inc => (
                    <Marker key={inc.id} position={inc.location as [number, number]} icon={getMarkerIcon(inc.severity)}>
                      <Popup className="bg-slate-900 border-none rounded-xl">
                        <div className="p-2 min-w-[200px]">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{inc.time}</span>
                           <h3 className="font-bold text-slate-800 text-sm mt-1">{inc.title}</h3>
                           <div className="mt-3 flex flex-col gap-2">
                              <span className="text-xs font-bold px-2 py-1 bg-slate-200 rounded text-center">{inc.status}</span>
                              {inc.status !== 'Resolved' && (
                                <button onClick={() => updateIncidentStatus(inc.id, 'En Route')} className="text-xs bg-blue-500 text-white py-1.5 rounded font-bold shadow-md">Deploy En Route</button>
                              )}
                           </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
           )}

           {activeTab === 'Incidents' && (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative z-10">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-white px-2 uppercase tracking-widest">Priority Incident Queue</h3>
                 </div>
                 <div className="space-y-4">
                    {/* Sort high severity first */}
                    {[...incidents].sort((a, b) => (a.severity === 'High' ? -1 : 1)).map(inc => (
                       <div key={inc.id} className="flex flex-col xl:flex-row xl:items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
                          <div className="flex items-center gap-4 mb-4 xl:mb-0">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${inc.severity==='High'?'bg-red-500/20 text-red-500':inc.severity==='Medium'?'bg-orange-500/20 text-orange-500':'bg-yellow-500/20 text-yellow-500'}`}>
                                <FaLocationArrow className="text-xl" />
                             </div>
                             <div>
                                <h4 className="text-md font-bold text-white tracking-wide">{inc.title}</h4>
                                <div className="flex gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                                  <span>{inc.time}</span>
                                  <span>&middot;</span>
                                  <span className={inc.severity==='High'?'text-red-400':inc.severity==='Medium'?'text-orange-400':'text-yellow-400'}>{inc.severity} Priority</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                             {/* Actions Status Builder */}
                             {inc.status === 'Pending' ? (
                                <>
                                  <button onClick={() => updateIncidentStatus(inc.id, 'Assigned')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition">
                                    <FaCheckCircle /> Accept Mission
                                  </button>
                                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest transition">
                                    <FaTimesCircle /> Reject
                                  </button>
                                </>
                             ) : inc.status === 'Assigned' ? (
                                <button onClick={() => updateIncidentStatus(inc.id, 'En Route')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 transition hover:bg-blue-400">
                                  Deploy En Route
                                </button>
                             ) : inc.status === 'En Route' ? (
                                <button onClick={() => updateIncidentStatus(inc.id, 'On Scene')} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-400">
                                  Mark On Scene
                                </button>
                             ) : inc.status === 'On Scene' ? (
                                <button onClick={() => updateIncidentStatus(inc.id, 'Resolved')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                                  Mark Resolved
                                </button>
                             ) : (
                                <span className="px-4 py-2 border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 rounded-xl text-xs font-bold uppercase tracking-widest">
                                  Resolved
                                </span>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {activeTab === 'Resources' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                 {/* Dummy resources visualization */}
                 {['Ambulance Network', 'Fire Response', 'Police / tactical'].map(resource => (
                    <div key={resource} className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col items-center justify-center h-48 shadow-lg">
                      <FaAmbulance className="text-4xl text-slate-600 mb-4" />
                      <h4 className="text-lg font-bold text-white mb-2">{resource}</h4>
                      <span className="text-slate-400 text-sm font-semibold inline-block px-3 py-1 bg-slate-800 rounded-lg">All Units Deployed</span>
                    </div>
                 ))}
              </div>
           )}

           {activeTab === 'Comms' && (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 min-h-[400px] flex flex-col relative z-10 shadow-lg">
                 <div className="p-6 border-b border-slate-800">
                    <h3 className="font-black text-white uppercase tracking-widest">Central Command Comm-Link</h3>
                 </div>
                 <div className="flex-1 p-6 flex items-center justify-center">
                    <span className="text-slate-600 text-sm uppercase font-bold tracking-widest text-center flex flex-col items-center gap-4">
                      <FaComments className="text-4xl text-slate-700" />
                      Frequency Idle / Listening for Command Center Dispatches
                    </span>
                 </div>
              </div>
           )}

           {activeTab === 'Analytics' && (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 min-h-[400px] flex items-center justify-center relative z-10 shadow-lg p-6">
                <span className="text-slate-600 text-sm uppercase font-bold tracking-widest flex flex-col items-center gap-4">
                  <FaChartPie className="text-4xl text-slate-700" />
                  Detailed metrics rendering in background / Awaiting Data Lake Sync
                </span>
              </div>
           )}

        </main>
      </div>
    </div>
  );
}
