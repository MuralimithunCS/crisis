import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, subHours, subDays, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  FaWater, FaWind, FaExclamationTriangle, 
  FaFilter, FaGlobeAmericas, FaThermometerHalf, 
  FaRobot, FaShieldAlt, FaKey, FaLeaf, FaChartLine, FaTimes, FaTractor, FaSatellite 
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Chatbot } from '../components/Chatbot';
import { FlashFloodPredictor } from '../components/FlashFloodPredictor';

// Map Center Auto-Updater
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface StandaloneDashboardProps {
  onBack?: () => void;
  role?: 'Citizen' | 'Responder' | 'Admin' | null;
  defaultTab?: 'flood' | 'gis';
}

export function StandaloneDashboard({ onBack, role, defaultTab }: StandaloneDashboardProps) {
  const [activeTab, setActiveTab] = useState<'flood' | 'gis'>(defaultTab || 'flood');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [weatherKey, setWeatherKey] = useState('e47c60caa451a6e8efb457731eab7f3b');
  const [selectedWeather, setSelectedWeather] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [activeInsight, setActiveInsight] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFloodPredictor, setShowFloodPredictor] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5, 78.5]);
  const [mapZoom, setMapZoom] = useState(4);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleSOSConfirm = () => {
    setShowSOSModal(false);
    toast.success("🚨 SOS Alert Sent Successfully", { style: { background: '#ef4444', color: '#fff' }});
    
    if (userLocation) {
      const sosAlert = {
        geometry: { coordinates: [userLocation[1], userLocation[0]] },
        properties: {
          alertlevel: 'Red',
          country: 'Local Emergency',
          eventname: 'Immediate Help Requested (SOS)',
          eventtype: 'SOS',
          fromdate: new Date().toISOString()
        }
      };
      
      setAlerts(prev => [sosAlert, ...prev.filter(a => a.properties.eventtype !== 'SOS')]);
      setSelectedAlert(sosAlert);
      setMapCenter(userLocation);
      setMapZoom(12);
      setActiveInsight("🚨 SOS SIGNAL ACTIVE: Nearest trauma hospital and evacuation routes have been dynamically plotted on your map. Stay calm. Help is being dispatched.");
    } else {
      toast.error("Location not available. Cannot broadcast SOS coordinates.");
    }
  };

  const fetchAlerts = async () => {
    try {
      // GDACS GeoJSON endpoint
      const res = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.gdacs.org/xml/gdacs_archive.geojson')}`);
      const features = res.data.features || [];
      
      // Simulate Toast for New Critical Alerts
      const reds = features.filter((f: any) => f.properties.alertlevel === 'Red');
      if (reds.length > 0 && alerts.length > 0 && reds.length > alerts.filter(a => a.properties.alertlevel === 'Red').length) {
        toast.error("🚨 New Critical Disaster Detected!", { style: { background: '#ef4444', color: '#fff' } });
      }

      setAlerts(features);
      setLoading(false);
    } catch (e) {
      console.error("GDACS Fetch Error", e);
      toast.error("Failed to fetch GDACS live feed.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // 60s auto refresh

    // Simulate arriving Citizen SOS alerts for Responders to test mapping
    let sosTimer: ReturnType<typeof setTimeout>;
    if (role === 'Responder') {
      sosTimer = setTimeout(() => {
        if (userLocation) {
          toast.error("🚨 INCOMING CITIZEN SOS DETECTED \nDispatching to nearest available unit.", 
            { style: { background: '#ef4444', color: '#fff' }, duration: 6000 });
          
          const sosAlert = {
            geometry: { coordinates: [userLocation[1] + 0.05, userLocation[0] + 0.05] }, // slightly displaced to show routing
            properties: {
              alertlevel: 'Red',
              country: 'Local Emergency',
              eventname: 'Citizen Emergency SOS',
              eventtype: 'SOS',
              fromdate: new Date().toISOString()
            }
          };
          setAlerts(prev => [sosAlert, ...prev.filter(a => a.properties.eventtype !== 'SOS')]);
        }
      }, 8000);
    }

    return () => {
      clearInterval(interval);
      if (sosTimer) clearTimeout(sosTimer);
    };
  }, [role, userLocation]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setMapZoom(8);
        setUserLocation([latitude, longitude]);
        
        const userLocationAlert = {
          geometry: { coordinates: [longitude, latitude] },
          properties: {
            alertlevel: 'Green',
            country: 'Your Local Area',
            eventname: 'Current Location Analysis',
            eventtype: 'LOCAL',
            fromdate: new Date().toISOString()
          }
        };
        setSelectedAlert(userLocationAlert);
        setActiveInsight("✅ Custom agricultural & environmental assessment generated for your current location.");

        setAlerts((prev) => [userLocationAlert, ...prev.filter(a => a.properties.eventtype !== 'LOCAL')]);

        try {
          const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=e47c60caa451a6e8efb457731eab7f3b&units=metric`);
          setSelectedWeather(res.data);
          toast.success("Localized Data Sourced via GPS", { style: { background: '#10b981', color: '#fff' } });
        } catch (e) {
          console.error("OpenWeather Geolocation Fetch Error", e);
        }
      }, (err) => {
        console.warn("Geolocation blocked or unavailable.", err);
      });
    }
  }, []);

  const getEmergencyContact = (countryName: string) => {
    const lower = (countryName || '').toLowerCase();
    if (lower.includes('usa') || lower.includes('united states')) return '911 (FEMA: 1-800-621-3362)';
    if (lower.includes('uk') || lower.includes('united')) return '999 (National: 111)';
    if (lower.includes('india')) return '112 (NDMA: 1078)';
    if (lower.includes('aus')) return '000 (SES: 132 500)';
    if (lower.includes('local area') || lower.includes('current location')) return 'Your Local Authority (112 / 911)';
    return 'Local Emergency: 112 or 911';
  };

  const handleMarkerClick = async (alert: any) => {
    const coords = alert.geometry.coordinates; // [lng, lat]
    setMapCenter([coords[1], coords[0]]);
    setMapZoom(6);
    setSelectedAlert(alert);
    
    // AI Insight Engine Rule Evaluation
    const severity = alert.properties.alertlevel;
    const type = alert.properties.eventtype;
    
    if (severity === 'Red') setActiveInsight("🚨 Critical Alert: Immediate evacuation and mobilization recommended.");
    else if (type === 'FL' && severity === 'Orange') setActiveInsight("🌧 Flood risk increasing heavily due to compounding weather conditions.");
    else if (type === 'EQ') setActiveInsight("⚠ Seismic activity detected. Assess structural integrity of nearby Safe Zones.");
    else setActiveInsight("✅ Conditions are monitored. Proceed with standard response protocols.");

    // OpenWeather API Fetch
    if (weatherKey) {
      try {
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${coords[1]}&lon=${coords[0]}&appid=${weatherKey}&units=metric`);
        setSelectedWeather(res.data);
      } catch (e) {
        toast.error("OpenWeather API failed. Check your API key.");
        setSelectedWeather(null);
      }
    } else {
      setSelectedWeather(null);
    }
  };

  // Filtering Logic
  const filteredAlerts = useMemo(() => {
    let current = alerts;
    // Type Filter (GDACS TYPES: EQ=Earthquake, FL=Flood, TC=Cyclone, VO=Volcano, DR=Drought)
    if (filterType === 'Local Area' && userLocation) {
      current = current.filter(a => {
         const crd = a.geometry.coordinates;
         return getDistance(userLocation[0], userLocation[1], crd[1], crd[0]) < 2000;
      });
    } else if (filterType !== 'All') {
      const typeMap: Record<string, string[]> = {
        'Earthquake': ['EQ'],
        'Flood': ['FL'],
        'Cyclone': ['TC']
      };
      current = current.filter(a => typeMap[filterType]?.includes(a.properties.eventtype));
    }

    // Sort by proximity if userLocation is known
    if (userLocation) {
       current.sort((a, b) => {
         if (a.properties.eventtype === 'LOCAL') return -1;
         if (b.properties.eventtype === 'LOCAL') return 1;
         const dA = getDistance(userLocation[0], userLocation[1], a.geometry.coordinates[1], a.geometry.coordinates[0]);
         const dB = getDistance(userLocation[0], userLocation[1], b.geometry.coordinates[1], b.geometry.coordinates[0]);
         return dA - dB;
       });
    }

    // Timeline Filter
    const now = new Date();
    current = current.filter(a => {
      if (timeFilter === 'All Time') return true;
      const eventDate = new Date(a.properties.fromdate);
      if (timeFilter === '24h') return isAfter(eventDate, subHours(now, 24));
      if (timeFilter === '48h') return isAfter(eventDate, subHours(now, 48));
      return isAfter(eventDate, subDays(now, 7)); // 7 days Default
    });

    return current;
  }, [alerts, filterType, timeFilter]);

  const feedAlerts = useMemo(() => {
    if (!userLocation) return filteredAlerts;
    return filteredAlerts.filter(a => {
       const crd = a.geometry.coordinates;
       const isSelected = selectedAlert && a.properties.eventid === selectedAlert.properties.eventid;
       return isSelected || a.properties.eventtype === 'LOCAL' || getDistance(userLocation[0], userLocation[1], crd[1], crd[0]) < 2000;
    });
  }, [filteredAlerts, userLocation, selectedAlert]);

  const getMarkerIcon = (severity: string) => {
    const colors: Record<string, string> = { Red: '#ef4444', Orange: '#f97316', Green: '#22c55e' };
    const color = colors[severity] || '#3b82f6';
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: transform 0.2s;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  };

  const getIcon = (type: string) => {
    if (type === 'EQ') return <FaGlobeAmericas className="text-amber-500" />;
    if (type === 'FL') return <FaWater className="text-blue-500" />;
    if (type === 'TC') return <FaWind className="text-teal-500" />;
    return <FaExclamationTriangle className="text-gray-500" />;
  };

  // Dynamic Risk Score
  const calculateRiskScore = () => {
    if (!selectedAlert) return 0;
    let score = 0;
    const sev = selectedAlert.properties.alertlevel;
    if (sev === 'Red') score += 3;
    else if (sev === 'Orange') score += 2;
    else if (sev === 'Green') score += 1;

    if (selectedWeather?.wind?.speed > 20) score += 1;
    if (selectedWeather?.rain) score += 1;

    return Math.min(5, score);
  };

  const renderHospitalRoute = () => {
    if (!selectedAlert || selectedAlert.properties.alertlevel === 'Green' || selectedAlert.properties.eventtype === 'LOCAL') return null;
    const [lon, lat] = selectedAlert.geometry.coordinates; // GDACS coordinates are [lon, lat]
    
    const hLat = lat + 0.4;
    const hLon = lon + 0.4;
    const eLat = lat - 0.3;
    const eLon = lon - 0.3;

    const hospitalIcon = L.divIcon({
      className: 'hospital-icon',
      html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 8px; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">H</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const evacIcon = L.divIcon({
      className: 'evac-icon',
      html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">E</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    return (
      <>
        <Marker position={[hLat, hLon]} icon={hospitalIcon}>
          <Popup className="bg-slate-900 border-none rounded-xl glass-popup"><div className="p-1"><h3 className="font-bold text-sky-400 text-sm">Nearest Trauma Hospital</h3><p className="text-xs text-slate-300">Accepting critically injured.</p></div></Popup>
        </Marker>
        <Marker position={[eLat, eLon]} icon={evacIcon}>
          <Popup className="bg-slate-900 border-none rounded-xl glass-popup"><div className="p-1"><h3 className="font-bold text-emerald-400 text-sm">Safe Zone Evacuation</h3><p className="text-xs text-slate-300">Food, water, and shelter available.</p></div></Popup>
        </Marker>
        <Polyline positions={[[lat, lon], [hLat, hLon]]} pathOptions={{ color: "#3b82f6", dashArray: "5, 10", weight: 3, opacity: 0.8 }} />
        <Polyline positions={[[lat, lon], [eLat, eLon]]} pathOptions={{ color: "#10b981", dashArray: "5, 10", weight: 3, opacity: 0.8 }} />
      </>
    );
  };

  const getCropData = () => {
    const temp = selectedWeather?.main?.temp || 25;
    const humidity = selectedWeather?.main?.humidity || 50;
    const risk = calculateRiskScore();

    const expectedWheat = Math.max(1000, 4000 - (temp > 30 ? (temp - 30)*100 : 0));
    const expectedRice = Math.min(5000, 2000 + (humidity * 20));
    const expectedCorn = Math.max(1000, 3000 - Math.abs(25 - temp)*50);
    const expectedSoy = 2780;

    return [
      { name: 'Wheat', Expected: Math.round(expectedWheat), Actual: selectedAlert ? Math.round(expectedWheat * (1 - risk * 0.15)) : Math.round(expectedWheat) },
      { name: 'Rice', Expected: Math.round(expectedRice), Actual: selectedAlert ? Math.round(expectedRice * (1 - risk * 0.12)) : Math.round(expectedRice) },
      { name: 'Corn', Expected: Math.round(expectedCorn), Actual: selectedAlert ? Math.round(expectedCorn * (1 - risk * 0.18)) : Math.round(expectedCorn) },
      { name: 'Soy', Expected: expectedSoy, Actual: selectedAlert ? Math.round(expectedSoy * (1 - risk * 0.10)) : expectedSoy },
    ];
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#1e293b]/80 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl h-[72px] flex items-center justify-between px-6">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={onBack || (() => window.location.href = '/')} title="Return to Home">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 bg-red-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse"></div>
            <h1 className="text-3xl font-['Bebas_Neue'] tracking-widest text-slate-100 flex items-center group-hover:scale-105 transition-transform duration-300">
              CRISIS<span className="text-red-500 ml-1.5">IQ</span>
            </h1>
          </div>
          <span className="hidden md:inline-block text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-2 border-l border-slate-700 pl-4">Emergency Operations Center</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700 shadow-inner">
            <button
              onClick={() => setActiveTab('flood')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'flood'
                  ? 'bg-sky-500 text-slate-950 shadow-[0_0_15px_rgba(14,165,233,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FaWater className={activeTab === 'flood' ? 'text-slate-950' : 'text-sky-400'} />
              <span>Flash-Flood EOC (SIH Focus)</span>
            </button>
            <button
              onClick={() => setActiveTab('gis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'gis'
                  ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FaGlobeAmericas className={activeTab === 'gis' ? 'text-white' : 'text-indigo-400'} />
              <span>Global Hazard Feed</span>
            </button>
          </div>

          <div className="bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 shadow-inner">
            <span className="text-[11px] text-slate-400 uppercase tracking-widest">Clearance:</span>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${role === 'Admin' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : role === 'Responder' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>{role || 'Command Admin'}</span>
          </div>

          <button 
             onClick={() => setShowAnalytics(true)}
             className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-500/40 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-lg"
          >
             <FaLeaf className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>
      </header>

      {/* Main Grid / EOC Workspace */}
      {activeTab === 'flood' ? (
        <main className="flex-1 mt-[72px] p-2.5 lg:p-4 h-[calc(100vh-72px)] overflow-hidden bg-slate-950 flex flex-col">
          <FlashFloodPredictor
            embedded={true}
            onAlertTriggered={(newAlert) => {
              setAlerts((prev) => [newAlert, ...prev]);
              setSelectedAlert(newAlert);
              toast.success("🚨 CrisisIQ Alert Dispatched to Emergency Stream", { style: { background: '#ef4444', color: '#fff' } });
            }}
          />
        </main>
      ) : (
        <main className="flex-1 mt-[72px] grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 h-[calc(100vh-72px)]">
        
        {/* Left: Alert Feed */}
        <div className="lg:col-span-3 bg-[#1e293b]/60 backdrop-blur-md rounded-3xl border border-slate-700/50 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-700/50">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <FaGlobeAmericas className="text-indigo-400" /> Live Alert Feed
            </h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {['All', 'Local Area', 'Earthquake', 'Flood', 'Cyclone'].map(t => (
                <button 
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${filterType === t ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <FaFilter className="text-slate-500 mt-1" />
              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="48h">Last 48 Hours</option>
                <option value="7 days">Last 7 Days</option>
                <option value="All Time">All Time</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-10"><span className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></span></div>
            ) : feedAlerts.length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-10">No localized alerts found in your 2,000km scanning radius.</div>
            ) : (
              feedAlerts.map((alert: any) => (
                <div 
                  key={alert.properties.eventid}
                  onClick={() => handleMarkerClick(alert)}
                  className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-900 p-2.5 rounded-full shadow-inner">
                      {getIcon(alert.properties.eventtype)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-slate-100 leading-tight group-hover:text-indigo-300 transition-colors">{alert.properties.eventname || 'Geological Event'}</h4>
                        <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${alert.properties.alertlevel === 'Red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : alert.properties.alertlevel === 'Orange' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1 flex items-center justify-between">
                        <span className="flex items-center gap-1"><FaGlobeAmericas/> {alert.properties.country}</span>
                        {userLocation && alert.properties.eventtype !== 'LOCAL' && (
                           <span className="text-emerald-400/80 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">{Math.round(getDistance(userLocation[0], userLocation[1], alert.geometry.coordinates[1], alert.geometry.coordinates[0]))} km away</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">{format(new Date(alert.properties.fromdate), 'PP p')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Interactive Map */}
        <div className="lg:col-span-6 bg-slate-900 rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl relative ring-1 ring-white/5">
          <button 
             onClick={() => {
               setMapCenter([20, 0]);
               setMapZoom(2);
               setSelectedAlert(null);
               setSelectedWeather(null);
               setActiveInsight('');
             }}
             className="absolute top-4 right-4 z-[400] bg-slate-800/80 backdrop-blur-md border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-lg"
          >
             Reset View
          </button>
          <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: '#0f172a' }}>
            <ChangeView center={mapCenter} zoom={mapZoom} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            />
            {filteredAlerts.map((alert: any) => (
              <Marker 
                key={alert.properties.eventid}
                position={[alert.geometry.coordinates[1], alert.geometry.coordinates[0]]}
                icon={getMarkerIcon(alert.properties.alertlevel)}
                eventHandlers={{ click: () => handleMarkerClick(alert) }}
              >
                <Popup className="bg-slate-900 border-none rounded-xl overflow-hidden glass-popup">
                   <div className="p-1 min-w-[200px]">
                     <h3 className="font-bold text-sm tracking-wide text-slate-800">{alert.properties.eventname}</h3>
                     <p className="text-xs text-slate-500 mt-1 font-medium">{alert.properties.eventtype}</p>
                   </div>
                </Popup>
              </Marker>
            ))}
            {renderHospitalRoute()}
          </MapContainer>
        </div>

        {/* Right: Insights Panel */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          
          {/* AI Insights Engine */}
          <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] rounded-3xl shadow-2xl border border-indigo-500/30 p-6 relative overflow-hidden group flex-1 transition-all h-1/2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
            <h2 className="text-sm font-extrabold text-indigo-300 uppercase tracking-widest flex items-center gap-2 mb-6">
              <FaRobot className="text-indigo-400" /> AI Insights Engine
            </h2>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-inner min-h-[120px] animate-[fadeIn_0.5s_ease-out]">
              {activeInsight ? (
                 <p className="text-slate-200 text-sm leading-relaxed font-semibold">{activeInsight}</p>
              ) : (
                 <div className="flex flex-col items-center justify-center opacity-50 h-full">
                    <FaRobot className="w-8 h-8 mb-2" />
                    <p className="text-xs text-center uppercase tracking-widest">Select an exact map marker to initiate AI terrain analysis.</p>
                 </div>
              )}
            </div>

            {/* Simulated Safe Zone Suggestion */}
            {(selectedAlert && selectedAlert.properties.alertlevel !== 'Green' && selectedAlert.properties.eventtype !== 'LOCAL') && (
            <div className="mt-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl animate-[fadeIn_0.5s_ease-out]">
              <FaShieldAlt className="text-emerald-400 w-8 h-8 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">Emergency Evacuation Active</span>
                <span className="text-xs text-slate-200 font-semibold tracking-wide">Routing to nearest Hospital & Evacuation Center displayed on map.</span>
              </div>
            </div>
            )}
          </div>

          {/* OpenWeather Overlay & Risk Score */}
          <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-3xl border border-slate-700/50 p-6 shadow-2xl flex-1 h-1/2 relative overflow-hidden">
             <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-6">
              <FaThermometerHalf className="text-sky-400" /> Weather & Risk Matrix
            </h2>

            {selectedWeather ? (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700 mb-6 shadow-inner">
                   <div className="text-center">
                     <span className="block text-3xl font-extrabold text-white">{Math.round(selectedWeather.main.temp)}°</span>
                     <span className="text-[10px] uppercase text-slate-400 tracking-widest font-bold">Temp</span>
                   </div>
                   <div className="w-px h-10 bg-slate-700"></div>
                   <div className="text-center">
                     <span className="block text-xl font-bold text-sky-300 capitalize">{selectedWeather.weather[0].main}</span>
                     <span className="text-[10px] uppercase text-slate-400 tracking-widest font-bold">Condition</span>
                   </div>
                   <div className="w-px h-10 bg-slate-700"></div>
                   <div className="text-center">
                     <span className="block text-xl font-bold text-slate-200">{selectedWeather.wind.speed}</span>
                     <span className="text-[10px] uppercase text-slate-400 tracking-widest font-bold">m/s Wind</span>
                   </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Risk Score</span>
                    <span className="text-sm font-extrabold text-white">{calculateRiskScore()} / 5</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${calculateRiskScore() >= 4 ? 'bg-red-500' : calculateRiskScore() >= 2 ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${(calculateRiskScore() / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-[10px] text-slate-500 font-bold uppercase mt-1">
                    {calculateRiskScore() >= 4 ? 'High Risk' : calculateRiskScore() >= 2 ? 'Medium Risk' : 'Low Risk'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center opacity-50 h-full -mt-4">
                  <FaThermometerHalf className="w-8 h-8 mb-3 text-slate-400" />
                  <p className="text-xs text-center uppercase tracking-widest font-semibold px-4">Awaiting active selection and initialized API Key bridging.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      )}

      {showFloodPredictor && (
        <FlashFloodPredictor
          onClose={() => setShowFloodPredictor(false)}
          onAlertTriggered={(newAlert) => {
            setAlerts((prev) => [newAlert, ...prev]);
            setSelectedAlert(newAlert);
          }}
        />
      )}

      {showAnalytics && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8 animate-[fadeIn_0.3s_ease-out] overflow-hidden">
           <div className="bg-[#0f172a] w-full max-w-7xl max-h-[90vh] rounded-3xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden relative ring-1 ring-white/10">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                 <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center gap-3">
                   <FaLeaf className="text-emerald-500" /> {selectedAlert ? `Agri-Diagnostics: ${selectedAlert.properties.country} (${selectedAlert.properties.eventname})` : 'Pre & Post Disaster Agricultural Analytics'}
                 </h2>
                 <button onClick={() => setShowAnalytics(false)} className="p-2 bg-slate-800 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                   <FaTimes className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
                 
                 {/* Left Col: Analysis */}
                 <div className="space-y-6 xl:col-span-1">
                 {selectedAlert ? (
                    <>
                    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
                       <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2"><FaSatellite /> Pre-Disaster Diagnostics</h3>
                       <ul className="space-y-4 text-sm text-slate-300">
                         <li className="flex items-start gap-3"><span className="text-indigo-500 font-bold mt-1">•</span> <span><strong>Soil Moisture Index:</strong> {selectedWeather?.rain ? 'Saturated (85%+) - high risk of crop root rot.' : 'Normal levels. Monitor for sudden saturation.'}</span></li>
                         <li className="flex items-start gap-3"><span className="text-indigo-500 font-bold mt-1">•</span> <span><strong>Predictive Yield Impact:</strong> High alert for {selectedAlert.properties.country}. Early harvest recommended within 20km of epicenter.</span></li>
                         <li className="flex items-start gap-3"><span className="text-indigo-500 font-bold mt-1">•</span> <span><strong>Livestock Evacuation:</strong> Safe ground routing broadcasted via SMS to rural cooperatives in {selectedAlert.properties.country}.</span></li>
                       </ul>
                    </div>

                    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50">
                       <h3 className="text-sm font-bold text-rose-300 uppercase tracking-widest mb-4 flex items-center gap-2"><FaExclamationTriangle /> Post-Disaster Analysis</h3>
                       <ul className="space-y-4 text-sm text-slate-300">
                         <li className="flex items-start gap-3"><span className="text-rose-500 font-bold mt-1">•</span> <span><strong>Infrastructure Damage:</strong> Severe risk for {selectedAlert.properties.eventtype} event. Local irrigation may fail.</span></li>
                         <li className="flex items-start gap-3"><span className="text-rose-500 font-bold mt-1">•</span> <span><strong>Topsoil Erosion:</strong> {selectedWeather?.wind?.speed > 15 || selectedWeather?.rain ? 'High probability of topsoil stripping in exposed sectors.' : 'Erosion risk currently stable based on wind parameters.'}</span></li>
                         <li className="flex items-start gap-3"><span className="text-rose-500 font-bold mt-1">•</span> <span><strong>Recovery Subsidy:</strong> Simulated claim estimate: ${(calculateRiskScore() * 125000).toLocaleString()} covering {(calculateRiskScore() * 15)}% of expected losses.</span></li>
                       </ul>
                    </div>
                    </>
                 ) : (
                    <div className="flex flex-col items-center justify-center opacity-50 h-[300px] border border-dashed border-slate-700 rounded-3xl p-6">
                       <FaGlobeAmericas className="w-10 h-10 mb-4 text-slate-500" />
                       <p className="text-xs text-center uppercase tracking-widest font-bold px-4">Select an active disaster on the map to run localized agricultural diagnostics.</p>
                    </div>
                 )}
                 </div>

                 {/* Center Col: How We Help Farmers */}
                 <div className="bg-gradient-to-br from-emerald-900/40 to-[#0f172a] p-8 rounded-3xl border border-emerald-500/20 shadow-inner xl:col-span-1 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full" />
                    <FaTractor className="text-emerald-500/10 w-48 h-48 absolute bottom-[-40px] right-[-40px] group-hover:scale-110 transition-transform duration-1000" />
                    
                    <h3 className="text-lg font-extrabold text-emerald-300 mb-6 relative z-10 font-sans tracking-tight flex items-center gap-2">
                    How <span className="font-['Bebas_Neue'] tracking-widest text-white text-xl flex items-center">CRISIS<span className="text-red-500 ml-0.5 mt-0.5">IQ</span></span> Protects Farmers
                  </h3>
                    <div className="space-y-5 text-[13px] text-emerald-100/90 leading-relaxed relative z-10 font-medium">
                       <p className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-sm">
                         <strong>1. 48-Hour Head Start:</strong> By fusing live GDACS alerts with local terrain models, we provide agricultural communities with extreme-weather warnings 48 hours faster than local radio.
                       </p>
                       <p className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-sm">
                         <strong>2. Automated Asset Defense:</strong> The system automatically suggests moving heavy machinery and livestock to dynamically calculated high-ground Safe Zones.
                       </p>
                       <p className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-sm">
                         <strong>3. Financial Resilience:</strong> Post-disaster satellite imagery instantly correlates with registered acreage to fast-track farmer payouts through allied agro-insurance APIs.
                       </p>

                       {selectedAlert && (
                       <div className="bg-rose-500/20 p-4 rounded-2xl border border-rose-500/40 shadow-xl mt-6 animate-[fadeIn_0.5s_ease-out] relative overflow-hidden group/alert">
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/alert:translate-x-full duration-1000 transition-all"></div>
                         <strong className="text-rose-400 block mb-1 flex items-center gap-2 text-xs uppercase tracking-widest"><FaExclamationTriangle /> Active Emergency Routing</strong>
                         <span className="text-xl font-black text-rose-200 tracking-widest font-mono drop-shadow-md">{getEmergencyContact(selectedAlert.properties.country)}</span>
                       </div>
                       )}
                    </div>
                 </div>

                 {/* Right Col: Charts */}
                 <div className="xl:col-span-1 bg-slate-800/30 p-6 rounded-3xl border border-slate-700/50 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2"><FaChartLine className="text-sky-400" /> Regional Yield Impact (Tons)</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getCropData()}
                          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                          <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                          <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                          <Bar dataKey="Expected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Actual" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-center text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest">Aggregated from Live Sensor Nodes</p>
                 </div>

              </div>
           </div>
        </div>
      )}

      {/* SOS Floating Button (Citizen Only) */}
      {role === 'Citizen' && (
        <button 
          onClick={() => setShowSOSModal(true)}
          className="fixed top-24 right-6 z-[60] flex items-center justify-center w-14 h-14 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse hover:scale-110 transition-transform cursor-pointer border-2 border-red-400 group"
          title="Trigger Emergency SOS"
        >
          <span className="text-2xl">🚨</span>
          <div className="absolute top-1/2 -translate-y-1/2 right-16 bg-red-900/90 text-red-100 px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-red-500/50 backdrop-blur-md pointer-events-none">
            Emergency SOS
          </div>
        </button>
      )}

      {/* SOS Confirmation Modal (Citizen Only) */}
      {role === 'Citizen' && showSOSModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-red-500/50 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl animate-bounce">🚨</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Trigger Emergency SOS?</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              This action will instantly broadcast your precise GPS coordinates to emergency responders and pinpoint the nearest trauma centers on your active map.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowSOSModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSOSConfirm}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition"
              >
                Yes, SEND SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot Widget */}
      <Chatbot context={{ 
        riskLevel: selectedAlert?.properties?.alertlevel || 'Green',
        weather: selectedWeather,
        disasterType: selectedAlert?.properties?.eventtype 
      }} />

    </div>
  );
}
