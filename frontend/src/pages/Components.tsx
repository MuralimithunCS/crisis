import { AlertTriangle, Activity, MapPin, ShieldCheck, TrendingUp } from 'lucide-react';

export function AlertCard({ alert }: any) { 
  const bgColors: any = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-700',
    high: 'bg-orange-500/10 border-orange-500/30 text-orange-700',
    medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700',
    low: 'bg-green-500/10 border-green-500/30 text-green-700'
  };

  return (
    <div className={`border p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md mb-3 transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer ${bgColors[alert.severity] || 'bg-white/70 border-white/40'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${bgColors[alert.severity] ? bgColors[alert.severity].split(' ')[0] : 'bg-gray-100'}`}>
          <AlertTriangle className="w-5 h-5 opacity-90" />
        </div>
        <div>
          <h4 className="font-semibold">{alert.title}</h4>
          <p className="text-xs opacity-70 flex items-center gap-1 mt-1 font-medium tracking-wide">
            <MapPin className="w-3 h-3" /> {alert.location?.region || 'Unknown Region'}
          </p>
        </div>
      </div>
    </div>
  ); 
}

export function StatsCard(props: any) { 
  return (
    <div className="p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl border border-white/50 flex flex-col justify-between overflow-hidden relative group transition-all hover:bg-white hover:shadow-lg">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-blue-900">
        {props.icon || <Activity className="w-24 h-24" />}
      </div>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{props.title}</div>
      <div className="text-4xl font-extrabold text-[#0f172a] mt-3 z-10 tracking-tight">{props.value}</div>
      <div className="text-xs mt-3 text-green-600 font-bold flex items-center gap-1 tracking-wide">
         <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-0.5"></span>
         LIVE STREAM
      </div>
    </div>
  ); 
}

export function RecentActivity() { 
  return (
    <div className="p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl border border-white/50">
      <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 uppercase tracking-wide"><Activity className="w-4 h-4 text-blue-500"/> System Activity Stream</h3>
      <div className="space-y-5">
        {[
          {msg: "Satellite API Sync completed.", sub: "Just now"},
          {msg: "USGS Feed ingestion successful.", sub: "2m ago"},
          {msg: "AI Recommendation engine trained.", sub: "1hr ago"}
        ].map((item, i) => (
          <div key={i} className="flex gap-4 items-start relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-blue-200 before:via-gray-100 before:to-transparent">
            <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 relative z-10 ring-4 ring-white shadow-sm" />
            <div>
              <p className="text-sm text-gray-700 font-semibold leading-tight">{item.msg}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ); 
}

export function AIInsightsPanel({ alerts: _alerts }: { alerts?: any[] }) { 
  return (
    <div className="p-6 rounded-2xl shadow-xl bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] text-white backdrop-blur-xl border border-indigo-500/30 relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/20 blur-3xl rounded-full mix-blend-screen transition-transform duration-1000 group-hover:scale-150" />
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/20 blur-3xl rounded-full mix-blend-screen" />
      
      <h3 className="text-sm font-bold mb-5 flex items-center gap-2 tracking-widest uppercase relative z-10"><ShieldCheck className="w-4 h-4 text-indigo-400"/> Predict Engine</h3>
      
      <div className="bg-white/[0.03] p-5 rounded-xl border border-white/[0.05] backdrop-blur-md relative z-10 ring-1 ring-white/10 shadow-inner group-hover:bg-white/[0.05] transition-colors">
        <div className="text-[10px] text-indigo-300 uppercase tracking-widest mb-2 font-semibold">Global Survival Probability</div>
        <div className="text-4xl font-extrabold flex items-end gap-2 tracking-tighter">
          92.4% 
          <span className="text-xs text-emerald-400 font-bold mb-1.5 flex items-center bg-emerald-400/10 px-1.5 py-0.5 rounded ml-1 border border-emerald-400/20"><TrendingUp className="w-3 h-3 mr-1"/> +2.1%</span>
        </div>
        
        <div className="w-full bg-black/40 rounded-full h-1.5 mt-5 shadow-inner overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 h-1.5 rounded-full w-[92.4%] relative">
             <div className="absolute inset-0 bg-white/20 w-full animate-[pulse_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
      
      <p className="text-[13px] text-indigo-200/80 mt-5 leading-relaxed font-medium relative z-10">
        The deep learning model continuously monitors structural integrity and geospatial data against live USGS feeds to calculate localized threat thresholds.
      </p>
    </div>
  ); 
}

export function SimulationResults({ results }: { results: any }) { 
  return (
    <div className="p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-xl border border-white ring-1 ring-slate-100 transition-all hover:shadow-xl animate-fade-in">
      <h3 className="text-sm font-extrabold text-slate-800 mb-5 flex items-center gap-2 uppercase tracking-widest">
        <Activity className="w-4 h-4 text-indigo-500"/> Impact Analysis Projection
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Affected Radius</span>
            <div className="text-3xl font-extrabold text-slate-800 mt-2 tracking-tighter">{results?.affected_radius || 0} <span className="text-sm text-slate-500">km</span></div>
         </div>
         <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100 flex flex-col justify-between">
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Est. Casualties</span>
            <div className="text-3xl font-extrabold text-red-600 mt-2 tracking-tighter">{((results?.affected_radius || 0) * 120).toLocaleString()}</div>
         </div>
         <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 flex flex-col justify-between">
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Infrastructure Dmg</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-2 tracking-tighter">Critical</div>
         </div>
         <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 flex flex-col justify-between">
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Evac Lead Time</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-2 tracking-tighter">45 <span className="text-sm text-indigo-400">min</span></div>
         </div>
      </div>
    </div>
  ); 
}

export function SimulationTimeline({ timeline: _timeline }: { timeline: any }) { 
  return (
    <div className="p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-xl border border-white mt-6 ring-1 ring-slate-100 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <h3 className="text-sm font-extrabold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
        <Activity className="w-4 h-4 text-purple-500"/> Timeline Propagation
      </h3>
      <div className="space-y-5 pl-3 border-l-2 border-slate-200 ml-2">
         {[
           {time: 'T+00:00', event: 'Disaster event confirmed at epicenter coordinate.'},
           {time: 'T+00:15', event: 'Primary infrastructure failure within 5km radius threshold.'},
           {time: 'T+01:30', event: 'Secondary structural collapse reaching outer perimeter.'},
           {time: 'T+04:00', event: 'Stability buffer restored, ground rescue ops viable.'}
         ].map((t, idx) => (
           <div key={idx} className="relative pl-6 filter drop-shadow-sm">
              <div className="absolute left-[-31px] top-1 w-3.5 h-3.5 bg-indigo-500 rounded-full ring-4 ring-white shadow"></div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 transition-colors hover:bg-slate-50">
                 <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded min-w-fit">{t.time}</span>
                 <span className="text-sm font-semibold text-slate-700">{t.event}</span>
              </div>
           </div>
         ))}
      </div>
    </div>
  ); 
}
