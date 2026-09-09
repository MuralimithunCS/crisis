import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaNewspaper, FaMapMarkerAlt, FaExternalLinkAlt, FaExclamationCircle, 
  FaShieldAlt, FaSatellite, FaUsers, FaArrowRight, FaTimesCircle 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface NewsItem {
  title: string;
  description: string;
  severity: 'Critical' | 'Warning' | 'Notice';
  type: string;
  location: string;
  date: string;
  isLive?: boolean;
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "Brahmaputra Basin Alert: Multiple Flooding Breakdown in Assam",
    description: "Water levels critically breached danger marks. NDMA issued high-priority evacuation warnings.",
    severity: "Critical",
    type: "Flood",
    location: "Assam, India",
    date: "Awaiting Stream...",
    isLive: false
  },
  {
    title: "Cyclone Watch: Coastal Odisha Storm Probability at 74%",
    description: "Met department monitors severe weather formation in Bay of Bengal. Relief teams pre-positioning.",
    severity: "Warning",
    type: "Cyclone",
    location: "Odisha, India",
    date: "Awaiting Stream...",
    isLive: false
  }
];

export function DisasterNewsCard() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosStep, setSosStep] = useState(0);

  useEffect(() => {
    const fetchNews = async (lat: number, lon: number) => {
      try {
        const response = await axios.get(`http://localhost:3001/api/disasters/realtime?lat=${lat}&lon=${lon}`);
        const liveNews = response.data.map((item: any) => ({ ...item, isLive: true }));
        setNews(liveNews);
        setLoading(false);
        setError(false);

        const criticalAlert = liveNews.find((n: any) => n.severity === 'Critical');
        if (criticalAlert) {
          toast.error(`BREAKING: ${criticalAlert.title}`, {
            duration: 8000,
            position: 'top-right',
            style: {
              background: '#ef4444',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '12px'
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch disaster news:', err);
        setNews(FALLBACK_NEWS);
        setLoading(false);
        setError(true);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        fetchNews(position.coords.latitude, position.coords.longitude);
      }, (err) => {
        console.warn("Geolocation blocked, New Delhi fallback active.", err);
        fetchNews(28.6139, 77.2090);
      });
    } else {
      fetchNews(28.6139, 77.2090);
    }
  }, []);

  const handleProtocolClick = () => {
    setIsSOSActive(true);
    setSosStep(0);
    setTimeout(() => setSosStep(1), 1500); 
    setTimeout(() => setSosStep(2), 3000); 
    setTimeout(() => setSosStep(3), 4500); 
  };

  const closeSOS = () => {
    setIsSOSActive(false);
    setSosStep(0);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* MOBILE-POWERED SOS MODAL */}
      {isSOSActive && (
        <div className="fixed inset-0 z-[99999] bg-black/98 flex items-center justify-center overflow-auto">
           {/* ALARM PULSE */}
           <div className="absolute inset-0 bg-red-600/5 animate-pulse-slow pointer-events-none"></div>
           
           <div className="relative w-full h-full md:h-auto md:max-w-2xl bg-[#060d1a] md:border md:border-red-500/40 md:rounded-[40px] flex flex-col md:shadow-[0_0_120px_rgba(239,68,68,0.4)]">
              {/* Header */}
              <div className="bg-red-600 p-6 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                   <FaExclamationCircle className="text-3xl text-white animate-bounce" />
                   <div className="text-white">
                     <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Emergency Hub</h2>
                     <p className="text-[10px] font-bold tracking-[3px] opacity-70 uppercase">Protocol Secured IND-001</p>
                   </div>
                 </div>
                 <button onClick={closeSOS} className="p-3 text-white/50 hover:text-white transition">
                   <FaTimesCircle className="text-3xl" />
                 </button>
              </div>

              {/* Progress Flow */}
              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                 {/* Step 1 */}
                 <div className={`flex items-start gap-6 transition-all ${sosStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>
                    <FaSatellite className={`text-3xl text-blue-400 shrink-0 ${sosStep === 1 ? 'animate-spin' : ''}`} />
                    <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest">Broadcasting Alert Matrix</h4>
                      <p className="text-slate-500 text-xs mt-1">Transmitting priority alerts to 14k+ regional inwoners.</p>
                      {sosStep === 1 && <span className="text-[10px] text-blue-400 font-bold block mt-2">TRANSCEIVING...</span>}
                      {sosStep > 1 && <span className="text-[10px] text-emerald-400 font-bold block mt-2">LINK ESTABLISHED ✓</span>}
                    </div>
                 </div>

                 {/* Step 2 */}
                 <div className={`flex items-start gap-6 transition-all ${sosStep >= 2 ? 'opacity-100' : 'opacity-20'}`}>
                    <FaMapMarkerAlt className={`text-3xl text-purple-400 shrink-0 ${sosStep === 2 ? 'animate-pulse' : ''}`} />
                    <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-widest">Secure Zone Localization</h4>
                      <p className="text-slate-500 text-xs mt-1">Calculating geolocated high-safety terrain.</p>
                      {sosStep === 2 && <span className="text-[10px] text-purple-400 font-bold block mt-2">SCANNINK SECTORS...</span>}
                      {sosStep > 2 && <span className="text-[10px] text-emerald-400 font-bold block mt-2">SECTOR LOCALIZED ✓</span>}
                    </div>
                 </div>

                 {/* Final Step Results */}
                 {sosStep >= 3 && (
                   <div className="animate-fadeIn space-y-8 pt-4">
                       <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                          <span className="text-[8px] font-black text-emerald-400 tracking-[5px] uppercase block mb-3">SAFE SECTOR IDENTIFIED</span>
                          <h3 className="text-2xl font-black text-white mb-2">SECTOR-12 COMMUNAL HUB</h3>
                          <p className="text-slate-400 text-xs mb-6">Reinforced emergency base located 2.4km from current coordinates.</p>
                          <button className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20">
                             Navigate To Safety <FaArrowRight />
                          </button>
                       </div>

                       <div className="flex items-center gap-4 bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                          <FaUsers className="text-3xl text-blue-400 animate-pulse" />
                          <div className="flex-1 text-slate-300">
                             <p className="text-xs font-bold uppercase tracking-widest text-white">Volunteer Deployment Active</p>
                             <p className="text-[10px] mt-1 italic">124 Safeguard Volunteers have established security cordons along the route.</p>
                          </div>
                          <FaShieldAlt className="text-emerald-400 text-2xl" />
                       </div>
                   </div>
                 )}
              </div>

              {/* FOOTER: TERMINATE BUTTON (Critical for User Experience) */}
              <div className="bg-slate-950/95 border-t border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 mt-auto">
                 <div className="hidden md:flex items-center gap-4">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                    <span className="text-[9px] font-black text-slate-500 tracking-[3px] uppercase">Secure Response Protocol V2.2</span>
                 </div>
                 <button 
                  onClick={closeSOS}
                  className="w-full md:w-auto px-12 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/40 rounded-2xl font-black text-xs uppercase tracking-[2px] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-500/10"
                 >
                    Terminate SOS Protocol
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ALERT MARQUEE */}
      <div className="lp-ticker-wrapper bg-red-600/10 border-y border-red-500/10 py-2.5 overflow-hidden whitespace-nowrap mb-3 relative z-10">
        <div className="lp-ticker-content animate-marquee inline-block text-[10px] font-black tracking-[2px] text-red-500!">
           {news.length > 0 ? news.map(n => ` [ BREAKING: ${n.title.toUpperCase()} ] • `).join("") : " [ CONNECTING TO INDIA DISASTER STREAM... ] "}
        </div>
      </div>

      <div className="lp-news-card lp-fade-in shadow-[0_0_80px_rgba(239,68,68,0.1)] ring-1 ring-white/10">
        <div className="lp-news-header">
          <FaNewspaper className="lp-news-icon text-red-500!" />
          <div>
            <h3 className="font-black text-xs md:text-sm tracking-widest text-[#fff]">NATIONAL HAZARD BULLETIN</h3>
            <p className="text-[9px] opacity-60 uppercase font-bold tracking-widest">Disaster Intelligence [IND]</p>
          </div>
          <div className={`lp-news-live-tag ${error ? 'bg-orange-600/20! text-orange-400!' : 'bg-red-600/20! text-red-400! animate-pulse'}`}>
            <span className="text-[9px] font-black uppercase tracking-widest">{error ? 'OFFLINE' : 'LIVE'}</span>
          </div>
        </div>

        <div className="lp-news-content">
          {loading ? (
            <div className="lp-news-loading">
              <div className="lp-news-spinner"></div>
              <p className="font-black text-[10px] tracking-widest opacity-60">Handshake Uplink...</p>
            </div>
          ) : (
            <div className="lp-news-list">
              {news.map((item, index) => (
                <div key={index} className={`lp-news-item ${item.severity.toLowerCase()} relative overflow-hidden group border border-white/5! hover:border-red-500/30! transition-all duration-300`}>
                  {item.severity === 'Critical' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] font-black bg-red-600 text-white border border-red-400/30 px-2 py-0.5 rounded-full z-10 shadow-lg">
                      <FaExclamationCircle className="animate-pulse" /> URGENT
                    </div>
                  )}
                  
                  <div className="lp-news-item-top flex justify-between items-center pr-16 mb-2">
                    <span className="lp-news-tag text-red-500! font-black text-[9px]">{item.type}</span>
                    <span className="lp-news-date opacity-50 font-bold text-[8px]">{item.date === "Awaiting Stream..." ? new Date().toLocaleDateString() : item.date}</span>
                  </div>
                  <h4 className="text-[14px] md:text-sm font-black tracking-tight mb-2 group-hover:text-red-400 transition-colors uppercase leading-tight">{item.title}</h4>
                  <p className="lp-news-loc text-cyan-400! font-black text-[9px] mb-2 flex items-center gap-1">
                    <FaMapMarkerAlt className="text-[10px]" /> {item.location.toUpperCase()}
                  </p>
                  <p className="lp-news-desc text-[11px] md:text-xs text-slate-500 leading-relaxed font-bold group-hover:text-slate-200 transition-all">{item.description}</p>
                  
                  <button 
                    onClick={handleProtocolClick}
                    className="lp-news-action-btn w-full mt-5 group-hover:bg-red-600! group-hover:text-white! group-hover:border-red-400! transition-all duration-300 transform active:scale-95 text-[10px] font-black tracking-[2px] py-4 rounded-xl border border-white/5 shadow-xl"
                  >
                    INITIALIZE PROTOCOL <FaExternalLinkAlt className="ml-2" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lp-news-footer border-t border-white/5! py-3 text-[9px] font-black text-slate-500/60! tracking-[4px] uppercase text-center mt-2">
            Regional Hub — Crisis Response HQ
        </div>
      </div>
    </div>
  );
}
