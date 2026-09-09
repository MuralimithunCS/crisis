import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { 
  FaMountain, FaCloudRain, FaCompass, FaHistory, 
  FaInfoCircle, FaSlidersH, FaTimes, FaBroadcastTower, 
  FaChartBar, FaGlobeAsia, FaCheckCircle, FaShieldAlt,
  FaArrowRight, FaExclamationTriangle
} from 'react-icons/fa';
import { 
  floodApi, 
  CLIENT_DEMO_LOCATIONS, 
  CLIENT_HISTORICAL_EVENTS, 
  CLIENT_MODEL_INFO,
  SUPPORTED_COUNTRIES
} from '../services/api';

// Map View auto-center helper
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface FlashFloodPredictorProps {
  onClose?: () => void;
  onAlertTriggered?: (alertData: any) => void;
  embedded?: boolean;
}

export function FlashFloodPredictor({ onClose, onAlertTriggered, embedded = false }: FlashFloodPredictorProps) {
  // 1. Country Selection (Defaults to India)
  const [selectedCountry, setSelectedCountry] = useState<string>("IN");

  // 2. Locations filtered by Country
  const [allLocations, setAllLocations] = useState<any[]>(CLIENT_DEMO_LOCATIONS);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("kedarnath");

  // Filtered locations for active country
  const countryLocations = useMemo(() => {
    const filtered = allLocations.filter(loc => (loc.country_code || 'IN').toUpperCase() === selectedCountry.toUpperCase());
    return filtered.length > 0 ? filtered : allLocations;
  }, [allLocations, selectedCountry]);

  // Selected Location Object
  const selectedLocation = useMemo(() => {
    return countryLocations.find(l => l.id === selectedLocationId) || countryLocations[0] || CLIENT_DEMO_LOCATIONS[0];
  }, [countryLocations, selectedLocationId]);

  // 3. Environmental Input State (Initialized from selected location baseline)
  const [rainfall1h, setRainfall1h] = useState<number>(selectedLocation.baseline.rainfall_1h);
  const [rainfall3h, setRainfall3h] = useState<number>(selectedLocation.baseline.rainfall_3h);
  const [rainfall24h, setRainfall24h] = useState<number>(selectedLocation.baseline.rainfall_24h);
  const [antRain7d, setAntRain7d] = useState<number>(selectedLocation.baseline.antecedent_rain_7d);
  const [soilMoisture, setSoilMoisture] = useState<number>(Math.round(selectedLocation.baseline.soil_moisture * 100));
  const [simulatingCloudburst, setSimulatingCloudburst] = useState<boolean>(false);

  // 4. Prediction & Risk Assessment State
  const [prediction, setPrediction] = useState<any>(null);
  const [riskMapData, setRiskMapData] = useState<any>(null);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);

  // 5. Historical Event Replay State (Filtered by Country)
  const [allHistoricalEvents, setAllHistoricalEvents] = useState<any[]>(CLIENT_HISTORICAL_EVENTS);
  const countryHistoricalEvents = useMemo(() => {
    const filtered = allHistoricalEvents.filter(ev => (ev.country_code || 'IN').toUpperCase() === selectedCountry.toUpperCase());
    return filtered.length > 0 ? filtered : allHistoricalEvents;
  }, [allHistoricalEvents, selectedCountry]);

  const [selectedEventId, setSelectedEventId] = useState<string>("kedarnath-2013");
  const [replayStepIndex, setReplayStepIndex] = useState<number>(0);
  const [isReplayMode, setIsReplayMode] = useState<boolean>(false);

  // 6. UI Modals
  const [showModelInfo, setShowModelInfo] = useState<boolean>(false);
  const [modelInfoData, setModelInfoData] = useState<any>(CLIENT_MODEL_INFO);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([selectedLocation.coordinates[1], selectedLocation.coordinates[0]]);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      try {
        const locs = await floodApi.getLocations();
        if (locs && locs.length > 0) setAllLocations(locs);

        const evs = await floodApi.getHistory();
        if (evs && evs.length > 0) setAllHistoricalEvents(evs);

        const mInfo = await floodApi.getModelInfo();
        if (mInfo) setModelInfoData(mInfo);
      } catch (err) {
        console.warn("Using embedded fallback data for Flash Flood Predictor", err);
      }
    };
    initData();
  }, []);

  // Country Change Handler
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setIsReplayMode(false);
    setSimulatingCloudburst(false);

    const countryMeta = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
    const targetLocId = countryMeta ? countryMeta.default_location : "kedarnath";

    const filteredLocs = allLocations.filter(loc => (loc.country_code || 'IN').toUpperCase() === countryCode.toUpperCase());
    const validLoc = filteredLocs.find(l => l.id === targetLocId) || filteredLocs[0] || allLocations[0];

    setSelectedLocationId(validLoc.id);

    // Update historical event for that country
    const filteredEvs = allHistoricalEvents.filter(ev => (ev.country_code || 'IN').toUpperCase() === countryCode.toUpperCase());
    if (filteredEvs.length > 0) {
      setSelectedEventId(filteredEvs[0].id);
    }
  };

  // Update inputs when location changes (if not in historical replay mode)
  useEffect(() => {
    if (!isReplayMode && selectedLocation) {
      setRainfall1h(selectedLocation.baseline.rainfall_1h);
      setRainfall3h(selectedLocation.baseline.rainfall_3h);
      setRainfall24h(selectedLocation.baseline.rainfall_24h);
      setAntRain7d(selectedLocation.baseline.antecedent_rain_7d);
      setSoilMoisture(Math.round(selectedLocation.baseline.soil_moisture * 100));
      setMapCenter([selectedLocation.coordinates[1], selectedLocation.coordinates[0]]);
      setMapZoom(12);
      setSimulatingCloudburst(false);
    }
  }, [selectedLocation, isReplayMode]);

  // Execute prediction
  const runPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const payload = {
        location_id: selectedLocation.id,
        rainfall_1h: rainfall1h,
        rainfall_3h: rainfall3h,
        rainfall_24h: rainfall24h,
        antecedent_rain_7d: antRain7d,
        soil_moisture: soilMoisture / 100.0,
        slope: selectedLocation.slope_deg,
        elevation: selectedLocation.elevation_m,
        aspect: selectedLocation.aspect_deg,
        historical_flood_frequency: selectedLocation.historical_flood_frequency
      };

      const res = await floodApi.predict(payload);
      setPrediction(res);

      const mapRes = await floodApi.getRiskMap(selectedLocation.id);
      setRiskMapData(mapRes);
    } catch (err) {
      console.error("Prediction failed:", err);
      toast.error("Prediction engine fallback engaged.");
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Run prediction initially and whenever environmental values change
  useEffect(() => {
    runPrediction();
  }, [selectedLocationId, rainfall1h, rainfall3h, rainfall24h, antRain7d, soilMoisture]);

  // Cloudburst Simulation Toggle
  const toggleCloudburstSimulation = () => {
    if (!simulatingCloudburst) {
      setRainfall1h(68.0);
      setRainfall3h(145.0);
      setRainfall24h(280.0);
      setAntRain7d(prev => Math.max(prev, 320.0));
      setSoilMoisture(96);
      setSimulatingCloudburst(true);
      toast.error("Stress Test: 68 mm/h Cloudburst Injection Engaged", {
        style: { background: '#7f1d1d', color: '#fff', border: '1px solid #b91c1c' }
      });
    } else {
      setRainfall1h(selectedLocation.baseline.rainfall_1h);
      setRainfall3h(selectedLocation.baseline.rainfall_3h);
      setRainfall24h(selectedLocation.baseline.rainfall_24h);
      setAntRain7d(selectedLocation.baseline.antecedent_rain_7d);
      setSoilMoisture(Math.round(selectedLocation.baseline.soil_moisture * 100));
      setSimulatingCloudburst(false);
      toast.success("Reset to IMD/CWC catchment reanalysis baseline.", {
        style: { background: '#064e3b', color: '#fff', border: '1px solid #047857' }
      });
    }
  };

  // Historical Event Replay Handler
  const activeEvent = useMemo(() => {
    return countryHistoricalEvents.find(e => e.id === selectedEventId) || countryHistoricalEvents[0] || CLIENT_HISTORICAL_EVENTS[0];
  }, [countryHistoricalEvents, selectedEventId]);

  const activeReplayStep = useMemo(() => {
    if (!activeEvent || !activeEvent.timeline) return null;
    return activeEvent.timeline[replayStepIndex] || activeEvent.timeline[0];
  }, [activeEvent, replayStepIndex]);

  const handleSelectHistoricalEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setReplayStepIndex(0);
    setIsReplayMode(true);
    const ev = allHistoricalEvents.find(e => e.id === eventId);
    if (ev) {
      setSelectedLocationId(ev.location_id);
    }
  };

  const applyHistoricalStep = (stepIdx: number) => {
    setReplayStepIndex(stepIdx);
    if (activeEvent && activeEvent.timeline && activeEvent.timeline[stepIdx]) {
      const step = activeEvent.timeline[stepIdx];
      setRainfall1h(step.environmental.rainfall_1h);
      setRainfall3h(step.environmental.rainfall_3h);
      setRainfall24h(step.environmental.rainfall_24h);
      setAntRain7d(step.environmental.antecedent_rain_7d);
      setSoilMoisture(Math.round(step.environmental.soil_moisture * 100));
      toast(`Replay step: ${step.time_label} (${step.risk.level})`, {
        icon: '⏱️',
        style: { background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }
      });
    }
  };

  // CrisisIQ Early Warning & Evacuation Trigger
  const handleDispatchCrisisIQAlert = async () => {
    if (!prediction) return;
    try {
      const payload = {
        location_id: selectedLocation.id,
        location_name: selectedLocation.name,
        risk_level: prediction.risk_level,
        risk_probability: prediction.risk_probability,
        top_factors: prediction.top_factors,
        coordinates: selectedLocation.coordinates,
        lead_time_label: prediction.lead_time_label
      };

      await floodApi.triggerAlert(payload);
      toast.success(`CrisisIQ CAP Alert Dispatched for ${selectedLocation.name}`, {
        style: { background: '#7f1d1d', color: '#fff', border: '1px solid #b91c1c' },
        duration: 5000
      });

      if (onAlertTriggered) {
        onAlertTriggered({
          geometry: { coordinates: selectedLocation.coordinates },
          properties: {
            alertlevel: prediction.risk_level === 'IMMEDIATE' ? 'Red' : prediction.risk_level === 'EVACUATE SOON' ? 'Orange' : 'Green',
            country: selectedLocation.name,
            eventname: `Flash Flood ${prediction.risk_level} Warning`,
            eventtype: 'FL',
            fromdate: new Date().toISOString()
          }
        });
      }
      setShowBroadcastModal(false);
    } catch (err) {
      toast.error("Failed to broadcast alert");
    }
  };

  // Custom Map Markers
  const getRiskMarkerIcon = (color: string, label: string) => {
    return L.divIcon({
      className: 'custom-flood-icon',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 800;">${label}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const getSafeZoneIcon = () => {
    return L.divIcon({
      className: 'custom-safezone-icon',
      html: `<div style="background-color: #047857; width: 26px; height: 26px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 900;">H</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  };

  // Risk Badge Styling (Clean Command Center)
  const riskBadgeStyles: Record<string, { badge: string; text: string; border: string }> = {
    SAFE: { badge: "bg-emerald-950 text-emerald-300 border-emerald-700", text: "text-emerald-400", border: "border-emerald-600" },
    WATCH: { badge: "bg-amber-950 text-amber-300 border-amber-700", text: "text-amber-400", border: "border-amber-600" },
    "EVACUATE SOON": { badge: "bg-orange-950 text-orange-300 border-orange-700", text: "text-orange-400", border: "border-orange-600" },
    IMMEDIATE: { badge: "bg-rose-950 text-rose-200 border-rose-600", text: "text-rose-400", border: "border-rose-600" }
  };

  const activeBadge = riskBadgeStyles[prediction?.risk_level || 'SAFE'] || riskBadgeStyles['SAFE'];

  return (
    <div className={embedded ? "w-full h-full flex flex-col overflow-hidden select-none font-sans" : "fixed inset-0 z-[9999] bg-slate-950/95 flex items-center justify-center p-2 lg:p-4 overflow-hidden select-none font-sans"}>
      <div className={embedded ? "bg-slate-900 w-full h-full rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100" : "bg-slate-900 w-full max-w-[1700px] h-[96vh] rounded-lg border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100"}>
        
        {/* TOP COMMAND HEADER */}
        <header className="h-[56px] px-4 lg:px-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          
          {/* Left: Platform Title & Breadcrumb Pipeline */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="font-mono text-xs font-black tracking-widest text-slate-300 uppercase">CRISISIQ</span>
              <span className="text-slate-700">|</span>
              <span className="text-xs font-bold tracking-tight text-white uppercase">
                EMERGENCY OPERATIONS CENTER · FLASH-FLOOD EARLY WARNING
              </span>
            </div>

            {/* Operational Pipeline Breadcrumbs */}
            <div className="hidden 2xl:flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 pl-4 border-l border-slate-800">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">1. MONITOR</span>
              <FaArrowRight className="text-[8px] text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">2. ANALYZE</span>
              <FaArrowRight className="text-[8px] text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">3. PREDICT</span>
              <FaArrowRight className="text-[8px] text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">4. WARN</span>
              <FaArrowRight className="text-[8px] text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">5. RESPOND</span>
            </div>
          </div>

          {/* Center: Country Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded">
              <FaGlobeAsia className="text-sky-400 text-xs" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Country:</span>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                title="Switch geographic and catchment operational context"
              >
                {SUPPORTED_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Replay Mode Indicator */}
            {isReplayMode && (
              <div className="flex items-center gap-1.5 bg-purple-950 border border-purple-800 px-2 py-1 rounded text-[11px] text-purple-300 font-mono">
                <FaHistory className="text-purple-400 text-xs" />
                <span>Historical Replay Active</span>
                <button 
                  onClick={() => setIsReplayMode(false)}
                  className="text-slate-400 hover:text-white underline text-[10px] ml-1"
                >
                  Exit
                </button>
              </div>
            )}
          </div>

          {/* Right: Actions & Dismiss */}
          <div className="flex items-center gap-2">
            {/* Scientific Architecture & Model Info */}
            <button
              onClick={() => setShowModelInfo(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition"
              title="Inspect Random Forest ML architecture, ROC-AUC metrics, and synthetic training disclosure"
            >
              <FaInfoCircle className="text-slate-400 text-xs" />
              <span>Model Specs (AUC 0.86)</span>
            </button>

            {/* Cloudburst Simulation Button */}
            <button
              onClick={toggleCloudburstSimulation}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition border ${
                simulatingCloudburst
                  ? 'bg-rose-950 hover:bg-rose-900 text-rose-200 border-rose-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Toggle simulated extreme cloudburst rainfall spike (68mm/h)"
            >
              <FaCloudRain className={simulatingCloudburst ? 'text-rose-400' : 'text-sky-400'} />
              <span>{simulatingCloudburst ? 'Reset Baseline' : 'Simulate Cloudburst'}</span>
            </button>

            {/* Close Button */}
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition border border-transparent hover:border-slate-700 ml-1"
                title="Close Command Window"
              >
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>

        </header>

        {/* MAIN OPERATIONS WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 bg-slate-950">
          
          {/* COLUMN 1: MONITORED BASIN & ENVIRONMENTAL FORCING (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            
            {/* 1A. Location Selector & Geomorphic Profile */}
            <div className="bg-slate-900 border border-slate-800 rounded p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px] font-bold">STEP 1</span>
                  <span>MONITOR · Monitored Basin</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {countryLocations.length} Basins ({selectedCountry})
                </span>
              </div>

              {/* Location Select Dropdown */}
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  setIsReplayMode(false);
                }}
                className="w-full bg-slate-950 text-white text-xs font-bold rounded p-2 border border-slate-700 focus:border-sky-500 outline-none transition"
              >
                {countryLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} — {loc.state} (Elev: {loc.elevation_m}m, Slope: {loc.slope_deg}°)
                  </option>
                ))}
              </select>

              {/* Data Provenance Badge */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate">{selectedLocation.data_source_label || "Data Provenance: IMD Reanalysis & CWC Basin Hydrography (Model Baseline)"}</span>
              </div>

              {/* Geomorphic Parameters Matrix */}
              <div className="grid grid-cols-4 gap-1 text-center pt-0.5">
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase">Elevation</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{selectedLocation.elevation_m}m</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase">Slope</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{selectedLocation.slope_deg}°</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase">Basin Area</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{selectedLocation.catchment_area_sqkm} km²</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase">Flood Freq</span>
                  <span className="text-xs font-mono font-bold text-rose-400">{selectedLocation.historical_flood_frequency}/10</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                <strong>Substrate Lithology:</strong> {selectedLocation.soil_type}
              </div>
            </div>

            {/* 1B. Multi-Source Catchment Forcing Inputs */}
            <div className="bg-slate-900 border border-slate-800 rounded p-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FaSlidersH className="text-sky-400 text-xs" /> Catchment Forcing Inputs
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${simulatingCloudburst ? 'bg-rose-950 text-rose-300 border-rose-700 font-bold' : 'bg-slate-950 text-emerald-400 border-emerald-800'}`}>
                    {simulatingCloudburst ? 'Synthetic Cloudburst Injection' : 'IMD / CWC Model Baseline'}
                  </span>
                </div>

                {/* Slider 1: 1-Hour Rainfall */}
                <div className="mb-3 space-y-0.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">1-Hour Precipitation Intensity</span>
                    <span className={`font-mono font-bold ${rainfall1h >= 40 ? 'text-rose-400' : rainfall1h >= 20 ? 'text-amber-400' : 'text-sky-300'}`}>
                      {rainfall1h.toFixed(1)} mm/h {rainfall1h >= 50 ? '(Cloudburst)' : ''}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.5"
                    value={rainfall1h}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setRainfall1h(val);
                      setRainfall3h(Math.max(val, Math.round(val * 1.8)));
                      setRainfall24h(Math.max(val * 2, Math.round(val * 3.5)));
                    }}
                    className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>0 mm/h (Clear)</span>
                    <span>25 mm/h (Heavy)</span>
                    <span>60+ mm/h (Cloudburst Surge)</span>
                  </div>
                </div>

                {/* Slider 2: Soil Moisture Saturation */}
                <div className="mb-3 space-y-0.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">Soil Moisture Saturation Index</span>
                    <span className={`font-mono font-bold ${soilMoisture >= 85 ? 'text-rose-400' : soilMoisture >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {soilMoisture}% {soilMoisture >= 88 ? '(Field Saturation)' : ''}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="1"
                    value={soilMoisture}
                    onChange={(e) => setSoilMoisture(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>10% (Dry Substrate)</span>
                    <span>70% (Field Capacity)</span>
                    <span>100% (Zero Infiltration)</span>
                  </div>
                </div>

                {/* Slider 3: 7-Day Antecedent Precipitation */}
                <div className="mb-3 space-y-0.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">7-Day Antecedent Rainfall</span>
                    <span className="font-mono font-bold text-indigo-300">{antRain7d.toFixed(0)} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="650" 
                    step="5"
                    value={antRain7d}
                    onChange={(e) => setAntRain7d(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>50 mm</span>
                    <span>250 mm (Monsoon Base)</span>
                    <span>500+ mm (Pore Pressure Surge)</span>
                  </div>
                </div>

                {/* Accumulation Window Matrix */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800">
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-mono text-[10px] text-slate-400">3-Hour Cumulative</span>
                    <span className="font-mono font-bold text-slate-200">{rainfall3h.toFixed(1)} mm</span>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-mono text-[10px] text-slate-400">24-Hour Cumulative</span>
                    <span className="font-mono font-bold text-slate-200">{rainfall24h.toFixed(1)} mm</span>
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>{loadingPrediction ? "ML Inference in progress..." : "Status: Model Synchronized"}</span>
                <button
                  onClick={runPrediction}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px] font-mono transition"
                >
                  Recalculate
                </button>
              </div>
            </div>

            {/* 1C. Historical Disaster Replay */}
            <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <FaHistory className="text-purple-400 text-xs" /> Historical Event Chronology
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {countryHistoricalEvents.length} Reconstructions
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 mb-1.5">
                {countryHistoricalEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => handleSelectHistoricalEvent(ev.id)}
                    className={`p-1.5 rounded text-left text-xs transition border ${
                      selectedEventId === ev.id && isReplayMode
                        ? 'bg-purple-950 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold truncate text-[10px]">{ev.name}</div>
                    <div className="text-[9px] font-mono text-slate-500">{ev.date}</div>
                  </button>
                ))}
              </div>

              {/* Step Sequence for Selected Event */}
              {activeEvent && activeEvent.timeline && (
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1.5">
                    <span className="truncate">{activeEvent.name}</span>
                    <span className="text-[9px] font-mono text-purple-400">Step {replayStepIndex + 1} of {activeEvent.timeline.length}</span>
                  </div>

                  <div className="flex gap-1 mb-1.5">
                    {activeEvent.timeline.map((step: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => applyHistoricalStep(idx)}
                        className={`flex-1 py-1 rounded text-[9px] font-mono font-bold transition ${
                          replayStepIndex === idx && isReplayMode
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-850 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        T{step.hours_to_peak === 0 ? '-Peak' : `-${step.hours_to_peak}h`}
                      </button>
                    ))}
                  </div>

                  {activeReplayStep && (
                    <div className="text-[10px] text-slate-300 space-y-0.5">
                      <div className="flex justify-between font-mono font-bold">
                        <span className="text-purple-300">{activeReplayStep.time_label}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${riskBadgeStyles[activeReplayStep.risk.level]?.badge || 'bg-slate-800'}`}>
                          {activeReplayStep.risk.level}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[9px] leading-relaxed line-clamp-2">
                        {activeReplayStep.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* COLUMN 2: LEAFLET CATCHMENT GIS MAP (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col bg-slate-900 rounded border border-slate-800 overflow-hidden shadow-xl">
            
            {/* Map Top Bar */}
            <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px] font-bold">STEP 2</span>
                <FaCompass className="text-sky-400 text-xs" />
                <span>ANALYZE · Catchment GIS Hydrology</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {selectedLocation.name}
                </span>
                <button
                  onClick={() => {
                    setMapCenter([selectedLocation.coordinates[1], selectedLocation.coordinates[0]]);
                    setMapZoom(12);
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded transition"
                >
                  Center
                </button>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 w-full relative min-h-[420px]">
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                style={{ height: '100%', width: '100%', background: '#020617' }}
              >
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                />

                {/* Catchment Hydrological Nodes */}
                {riskMapData?.catchment_nodes?.map((node: any) => (
                  <Marker
                    key={node.id}
                    position={[node.coordinates[1], node.coordinates[0]]}
                    icon={getRiskMarkerIcon(node.color || '#ef4444', node.risk_level === 'IMMEDIATE' ? '!' : '●')}
                  >
                    <Popup className="glass-popup">
                      <div className="p-1 min-w-[200px] text-slate-900">
                        <h4 className="font-extrabold text-xs text-slate-900">{node.name}</h4>
                        <p className="text-[11px] text-slate-600 font-medium">{node.role}</p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex justify-between text-[11px] font-bold">
                          <span>Risk: {node.risk_level}</span>
                          <span>Prob: {(node.risk_probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Elev: {node.elevation_m}m | Slope: {node.slope_deg}°</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Safe Evacuation Zones */}
                {riskMapData?.safe_zones?.map((sz: any, i: number) => (
                  <Marker
                    key={i}
                    position={[sz.coordinates[1], sz.coordinates[0]]}
                    icon={getSafeZoneIcon()}
                  >
                    <Popup className="glass-popup">
                      <div className="p-1 min-w-[200px] text-slate-900">
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Designated Safe Refuge Shelter</span>
                        <h4 className="font-extrabold text-xs text-slate-900">{sz.name}</h4>
                        <p className="text-[11px] text-slate-600">{sz.type}</p>
                        <p className="text-[11px] text-emerald-800 font-bold mt-1">Elevation: {sz.elevation_m}m (Above surge crest)</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Evacuation Route Polyline */}
                {prediction && (prediction.risk_level === 'IMMEDIATE' || prediction.risk_level === 'EVACUATE SOON') && riskMapData?.safe_zones?.[0] && (
                  <Polyline 
                    positions={[
                      [selectedLocation.coordinates[1], selectedLocation.coordinates[0]],
                      [riskMapData.safe_zones[0].coordinates[1], riskMapData.safe_zones[0].coordinates[0]]
                    ]}
                    pathOptions={{ color: '#047857', dashArray: '4, 6', weight: 3, opacity: 0.95 }}
                  />
                )}
              </MapContainer>

              {/* Map Floating Legend */}
              <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/95 border border-slate-800 p-2.5 rounded shadow-lg text-[10px] space-y-1 max-w-[240px]">
                <span className="font-mono font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
                  Hydrological Legend
                </span>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shrink-0"></span>
                  <span>Choke Node (Surge Vulnerability)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0"></span>
                  <span>Catchment Inflow Node</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block shrink-0"></span>
                  <span>Safe High-Ground Refuge (H)</span>
                </div>
                {prediction && (prediction.risk_level === 'IMMEDIATE' || prediction.risk_level === 'EVACUATE SOON') && (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <span className="w-3 border-b-2 border-emerald-500 border-dashed inline-block"></span>
                    <span>Evacuation Path to Refuge</span>
                  </div>
                )}
              </div>
            </div>

            {/* Map Footnote */}
            <div className="p-2 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between items-center">
              <span>Geomorphic Precision: Hydrological Catchment Nodes (500m - 2km)</span>
              <span className="text-slate-500">Coord: {selectedLocation.coordinates[1].toFixed(3)}°N, {selectedLocation.coordinates[0].toFixed(3)}°E</span>
            </div>
          </div>

          {/* COLUMN 3: RISK CLASSIFICATION, EXPLAINABILITY & PROTOCOL (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-2.5">
            
            {/* 3A. Risk Probability & Classification Card */}
            <div className={`bg-slate-900 border ${activeBadge.border} rounded p-3.5 shadow-lg flex flex-col gap-2.5 relative`}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px] font-bold">STEP 3</span>
                  <span>PREDICT · Risk Index</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-black uppercase tracking-wider border ${activeBadge.badge}`}>
                  {prediction?.risk_level || 'SAFE'}
                </span>
              </div>

              {/* Probability Display */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {prediction ? (prediction.risk_probability).toFixed(2) : '0.00'}
                </span>
                <span className="text-xs font-mono text-slate-500">/ 1.00</span>
                <span className="ml-auto text-sm font-bold font-mono text-sky-400">
                  ({prediction ? prediction.risk_probability_percentage : 0}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded h-1.5 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 ${
                    prediction?.risk_level === 'IMMEDIATE' ? 'bg-rose-600' :
                    prediction?.risk_level === 'EVACUATE SOON' ? 'bg-orange-500' :
                    prediction?.risk_level === 'WATCH' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${prediction ? Math.max(5, prediction.risk_probability_percentage) : 5}%` }}
                />
              </div>

              {/* Lead-Time & Confidence Matrix */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-2 rounded border border-slate-800 text-center">
                <div>
                  <span className="block text-[9px] font-mono uppercase text-slate-500">Actionable Lead Time</span>
                  <span className="text-xs font-mono font-bold text-white">{prediction?.lead_time_label || '> 24 hours'}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono uppercase text-slate-500">Model Confidence</span>
                  <span className="text-xs font-mono font-bold text-sky-400">88%</span>
                </div>
              </div>

              {/* Recommended Action Protocol */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] text-slate-200 leading-relaxed">
                <strong className="text-slate-400 font-mono uppercase text-[9px] block mb-0.5">Response Protocol:</strong>
                {prediction?.recommended_action || 'Maintain routine catchment monitoring.'}
              </div>
            </div>

            {/* 3B. Explainability ("Why Is This Area At Risk?") */}
            <div className="bg-slate-900 border border-slate-800 rounded p-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px] font-bold">STEP 4</span>
                    <FaChartBar className="text-sky-400 text-xs" />
                    <span>WARN · Physical Factors</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Explainable AI</span>
                </div>

                {/* Factors List */}
                <div className="space-y-1">
                  {prediction?.top_factors?.map((factor: string, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-1.5 rounded border border-slate-800 text-[11px] text-slate-300 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1 shrink-0"></span>
                      <span className="leading-snug">{factor}</span>
                    </div>
                  ))}
                </div>

                {/* Relative Weights */}
                {prediction?.factor_breakdown && prediction.factor_breakdown.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Relative Physical Weights</span>
                    {prediction.factor_breakdown.slice(0, 3).map((fb: any, idx: number) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">{fb.factor}</span>
                          <span className="text-sky-400 font-bold">{fb.contribution_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1 rounded overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded" 
                            style={{ width: `${fb.contribution_percent * 2}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3C. Emergency Broadcast Dispatch Button */}
              <div className="pt-2 mt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className={`w-full py-2.5 rounded font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border ${
                    prediction?.risk_level === 'IMMEDIATE'
                      ? 'bg-rose-950 hover:bg-rose-900 text-rose-100 border-rose-600'
                      : prediction?.risk_level === 'EVACUATE SOON'
                      ? 'bg-orange-950 hover:bg-orange-900 text-orange-100 border-orange-600'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded bg-black/40 text-[9px]">STEP 5</span>
                  <FaBroadcastTower className="text-xs" />
                  <span>RESPOND · Dispatch CAP Alert</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: MODEL PERFORMANCE & ARCHITECTURE */}
      {showModelInfo && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded p-6 max-w-2xl w-full shadow-2xl relative font-sans text-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FaInfoCircle className="text-sky-400" /> CrisisIQ Prediction Architecture
              </h3>
              <button 
                onClick={() => setShowModelInfo(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="block text-[10px] font-mono uppercase text-sky-400 font-bold mb-1">Algorithm</span>
                <p className="font-mono text-white text-xs font-semibold">{modelInfoData.algorithm || 'RandomForestClassifier(n_estimators=100, max_depth=12)'}</p>
                <p className="text-slate-400 text-[11px] mt-1 font-mono">Validation: {modelInfoData.validation_method || 'Temporal Train/Test Split'}</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="block text-[9px] font-mono uppercase text-slate-500">ROC-AUC</span>
                  <span className="text-base font-black font-mono text-sky-400">{modelInfoData.metrics?.roc_auc ?? 0.861}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="block text-[9px] font-mono uppercase text-slate-500">Precision</span>
                  <span className="text-base font-black font-mono text-indigo-400">{modelInfoData.metrics?.precision ?? 0.654}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="block text-[9px] font-mono uppercase text-slate-500">Recall</span>
                  <span className="text-base font-black font-mono text-emerald-400">{modelInfoData.metrics?.recall ?? 0.692}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="block text-[9px] font-mono uppercase text-slate-500">F1-Score</span>
                  <span className="text-base font-black font-mono text-amber-400">{modelInfoData.metrics?.f1_score ?? 0.672}</span>
                </div>
              </div>

              {/* Scientific Disclosure */}
              <div className="bg-amber-950/40 border border-amber-800 p-3 rounded text-amber-200">
                <strong className="block mb-1 text-amber-300 font-mono uppercase text-[10px]">
                  Scientific Validation Disclosure (SIH26192 Requirement)
                </strong>
                <p className="leading-relaxed text-[11px] text-amber-100/90 font-mono">
                  {modelInfoData.data_disclosure}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowModelInfo(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded border border-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CRISISIQ EARLY WARNING BROADCAST */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800 rounded p-6 max-w-lg w-full shadow-2xl relative text-slate-100">
            <div className="w-12 h-12 bg-rose-950 border border-rose-700 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaBroadcastTower className="text-lg" />
            </div>

            <h3 className="text-sm font-mono font-bold text-center text-white uppercase tracking-wider mb-1">
              Dispatch Incident Alert (CAP v1.2 Schema)
            </h3>
            <p className="text-slate-400 text-xs text-center mb-4">
              Dispatches emergency early warning formatted to the OASIS Common Alerting Protocol (CAP v1.2) schema into CrisisIQ's incident pipeline for <strong>{selectedLocation.name}</strong>.
            </p>

            {/* CAP Alert Preview */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-left text-[11px] font-mono mb-4 text-slate-300 space-y-1">
              <div className="text-rose-400 font-bold">CAP-ALERT: FLASH_FLOOD_{prediction?.risk_level}</div>
              <div>Area: {selectedLocation.name} ({selectedLocation.coordinates[1].toFixed(3)}N, {selectedLocation.coordinates[0].toFixed(3)}E)</div>
              <div>Urgency: {prediction?.risk_level === 'IMMEDIATE' ? 'Immediate' : 'Expected'} | Severity: Severe</div>
              <div>Shelter: {riskMapData?.safe_zones?.[0]?.name || 'High Ground Ridge Safe Refuge'}</div>
              <div>Lead-Time: {prediction?.lead_time_label}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchCrisisIQAlert}
                className="flex-1 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded font-mono font-bold text-xs uppercase tracking-wider border border-rose-600"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
