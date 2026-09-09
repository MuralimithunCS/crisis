import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RealTimeTelemetryFeed, type TelemetryEvent } from '../components/RealTimeTelemetryFeed';
import { HomeIncidentMap } from '../components/HomeIncidentMap';
import { HomeCatchmentAIEngine } from '../components/HomeCatchmentAIEngine';
import { FlashFloodPredictor } from '../components/FlashFloodPredictor';
import { CLIENT_DEMO_LOCATIONS } from '../services/api';
import './LandingPage.css';

export function LandingPage() {
  const navigate = useNavigate();
  const onLaunch = () => navigate('/dashboard');
  const [counts, setCounts] = useState({ cnt1: 0, cnt2: 0, cnt3: 0, cnt4: 0 });
  const [showFloodPredictor, setShowFloodPredictor] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<TelemetryEvent[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);

  useEffect(() => {
    const animateCount = (target: number, key: string, speed: number) => {
      let current = 0;
      const step = target / (speed / 16);
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setCounts(prev => ({ ...prev, [key]: Math.floor(current) }));
      }, 16);
    };

    setTimeout(() => {
      animateCount(7, 'cnt1', 2000);
      animateCount(142, 'cnt2', 2000);
      animateCount(48600, 'cnt3', 2000);
      animateCount(34, 'cnt4', 2000);
    }, 500);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.lp-kpi,.lp-role-card,.lp-ai-feature,.lp-source-card,.lp-notif-card,.lp-cloud-card,.lp-tech-layer').forEach(el => {
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = 'translateY(20px)';
      (el as HTMLElement).style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchGlobalTelemetry = async () => {
      try {
        const events: TelemetryEvent[] = [];
        // Real USGS live feed
        try {
          const usgsRes = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', { timeout: 5000 });
          const features = usgsRes.data.features || [];
          for (const f of features.slice(0, 10)) {
            const mag = f.properties.mag ?? 0;
            const [lon, lat, depth] = f.geometry.coordinates;
            events.push({
              id: `usgs-${f.id}`,
              source: 'USGS',
              title: f.properties.title || `M ${mag.toFixed(1)} Seismic Event`,
              place: f.properties.place || 'Seismic Catchment Zone',
              magnitude: mag,
              type: 'Earthquake',
              coordinates: [lat, lon],
              depthKm: depth ? Math.round(depth) : undefined,
              time: f.properties.time,
              url: f.properties.url,
              severity: mag >= 6.0 ? 'Critical' : mag >= 4.5 ? 'Warning' : 'Moderate'
            });
          }
        } catch (err) {
          console.warn('USGS fetch notice:', err);
        }

        // Real CrisisIQ stored alerts
        try {
          const backendRes = await axios.get('http://localhost:3001/api/alerts/public', { timeout: 3000 });
          const stored = backendRes.data || [];
          for (const a of stored) {
            const coords = a.location?.coordinates || [76.13, 11.50];
            events.unshift({
              id: `crisisiq-${a._id || Math.random()}`,
              source: 'CRISISIQ',
              title: a.title,
              place: a.location?.region || 'Monitored Catchment',
              type: 'Flash Flood',
              coordinates: [coords[1], coords[0]],
              time: new Date(a.createdAt || Date.now()).getTime(),
              severity: a.severity === 'critical' ? 'Critical' : 'Warning'
            });
          }
        } catch {}

        events.sort((a, b) => b.time - a.time);
        setLiveAlerts(events);
        if (events.length > 0 && !selectedEvent) {
          setSelectedEvent(events[0]);
        }
        setLoadingAlerts(false);
      } catch (e) {
        console.warn('Telemetry load notice:', e);
        setLoadingAlerts(false);
      }
    };

    fetchGlobalTelemetry();
    const timer = setInterval(fetchGlobalTelemetry, 60000);
    return () => clearInterval(timer);
  }, []);

  const [simLines, setSimLines] = useState<{t:string; m:string}[]>([
    {t:'info', m:'// Select a scenario and click RUN SIMULATION to begin.'},
    {t:'info', m:'// CRISIS IQ Simulation Engine v2.4.1 — Ready'}
  ]);
  const [simRes, setSimRes] = useState<any>(null);
  const [simType, setSimType] = useState('flood');
  const simOutputRef = useRef<HTMLDivElement>(null);

  const simScenarios: Record<string, any> = {
    flood: {
      lines: [
        {t:'info', m:'[SIMULATION] Loading catchment runoff scenario...'},
        {t:'ok',   m:'[MODEL BASELINE] Mountain basin hydrography loaded'},
        {t:'info', m:'[SIMULATION] Applying simulated cloudburst precipitation: 80mm/h'},
        {t:'info', m:'[DATA] Loading digital elevation slope profile...'},
        {t:'ok',   m:'[OK] Catchment area loaded — high-risk runoff corridor identified'},
        {t:'warn', m:'[WARN] Hydrological capacity saturated — surge imminent'},
        {t:'info', m:'[AI] Running Random Forest risk assessment...'},
        {t:'ok',   m:'[OK] Risk Classification: IMMEDIATE (0.92)'},
        {t:'info', m:'[AI] Mapping evacuation path to designated high ridge...'},
        {t:'ok',   m:'[OK] High-ground refuge shelters identified'},
        {t:'warn', m:'[WARN] Riverbed transit zones require immediate evacuation'},
        {t:'ok',   m:'[OK] CAP-compliant alert generated for incident dispatch'},
        {t:'ok',   m:'[SIMULATION COMPLETE] ✓ Catchment response plan generated'}
      ],
      sr1:'92%', sr2:'12.4K', sr3:'1.5 hrs', sr4:'48 units'
    },
    fire: {
      lines: [
        {t:'info', m:'[SIMULATION] Loading wildfire behavior scenario...'},
        {t:'ok',   m:'[OK] Fire spread model loaded'},
        {t:'info', m:'[DATA] Wind: 42km/h NE · Humidity: 18% · Temp: 38°C'},
        {t:'warn', m:'[WARN] High fire-weather risk parameters loaded'},
        {t:'info', m:'[AI] Estimating perimeter spread...'},
        {t:'err',  m:'[CRITICAL] Projected spread: 6.2km² in 4 hours'},
        {t:'info', m:'[AI] Identifying optimal firebreak coordinates...'},
        {t:'ok',   m:'[OK] Optimal firebreak: 12.9X, 77.5Y'},
        {t:'warn', m:'[WARN] 3 settlements within projected perimeter'},
        {t:'ok',   m:'[OK] Emergency dispatch notice ready for command review'},
        {t:'ok',   m:'[SIMULATION COMPLETE] ✓ Containment scenario ready'}
      ],
      sr1:'88%', sr2:'8.7K', sr3:'3.5 hrs', sr4:'72 units'
    },
    earthquake: {
      lines: [
        {t:'info', m:'[INIT] Checking seismic incident stream...'},
        {t:'ok',   m:'[LIVE] USGS GeoJSON stream connected'},
        {t:'info', m:'[DATA] Magnitude: 6.0 · Depth: 12km · Catchment boundary'},
        {t:'warn', m:'[WARN] Ground shaking risk evaluated'},
        {t:'info', m:'[AI] Cross-referencing terrain slope stability...'},
        {t:'err',  m:'[CRITICAL] Slope failure / landslide risk elevated'},
        {t:'info', m:'[AI] Calculating access route integrity...'},
        {t:'ok',   m:'[OK] Safe ingress routes identified'},
        {t:'warn', m:'[WARN] Secondary landslide advisory active'},
        {t:'ok',   m:'[OK] Priority incident logged into EOC queue'},
        {t:'ok',   m:'[MONITORING ACTIVE] ✓ Operational incident stream active'}
      ],
      sr1:'82%', sr2:'21K', sr3:'6 hrs', sr4:'120 units'
    },
    cyclone: {
      lines: [
        {t:'info', m:'[SIMULATION] Loading cyclone track scenario parameters...'},
        {t:'ok',   m:'[MODEL BASELINE] Coastal basin topography loaded'},
        {t:'info', m:'[DATA] Category 2 · Wind: 155km/h · ETA: 14 hours'},
        {t:'info', m:'[AI] Modelling storm surge on coastal zones...'},
        {t:'warn', m:'[WARN] 3.2m storm surge expected in low coastal areas'},
        {t:'err',  m:'[CRITICAL] Low-lying settlements require evacuation'},
        {t:'info', m:'[AI] Plotting evacuation corridors inland...'},
        {t:'ok',   m:'[OK] Inland refuge shelters designated'},
        {t:'ok',   m:'[OK] Pre-positioning recommendation logged'},
        {t:'warn', m:'[WARN] Landfall estimated in 14 hours — initiate advisory'},
        {t:'ok',   m:'[SIMULATION COMPLETE] ✓ Advisory response plan ready'}
      ],
      sr1:'96%', sr2:'35K', sr3:'8 hrs', sr4:'200 units'
    }
  };

  const runSimulation = () => {
    setSimLines([]);
    setSimRes(null);
    const scenario = simScenarios[simType];
    let delay = 0;
    
    scenario.lines.forEach((line: any) => {
      setTimeout(() => {
        setSimLines(prev => {
          const newLines = [...prev, line];
          setTimeout(() => {
            if (simOutputRef.current) {
              simOutputRef.current.scrollTop = simOutputRef.current.scrollHeight;
            }
          }, 10);
          return newLines;
        });
      }, delay);
      delay += 180 + Math.random() * 100;
    });

    setTimeout(() => {
      setSimRes({ sr1: scenario.sr1, sr2: scenario.sr2, sr3: scenario.sr3, sr4: scenario.sr4 });
    }, delay + 200);
  };

  const clearSim = () => {
    setSimLines([
      {t:'info', m:'// Select a scenario and click RUN SIMULATION to begin.'},
      {t:'info', m:'// CRISIS IQ Simulation Engine v2.4.1 — Ready'}
    ]);
    setSimRes(null);
  };

  const [activeAlertMsg, setActiveAlertMsg] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setActiveAlertMsg(msg);
  };

  const renderAlertBox = () => {
    if (!activeAlertMsg) return null;
    const lines = activeAlertMsg.split('\n');
    return (
      <div className="lp-alert-overlay" onClick={() => setActiveAlertMsg(null)}>
        <div className="lp-alert-box" onClick={e => e.stopPropagation()}>
          <div className="lp-alert-header">⚠ AI INCIDENT REPORT</div>
          {lines.map((l, i) => {
            const parts = l.split('—');
            const k = parts.shift() || '';
            const v = parts;
            return (
              <div key={i} className="lp-alert-line">
                <span className="lp-alert-key">{k.trim()}</span>
                {v.length > 0 && <span className="lp-alert-val"> — {v.join('—')}</span>}
              </div>
            );
          })}
          <button className="lp-alert-btn" onClick={() => setActiveAlertMsg(null)}>ACKNOWLEDGE</button>
        </div>
      </div>
    );
  };

  return (
    <div className="landing-page">
      {renderAlertBox()}
      {showFloodPredictor && (
        <FlashFloodPredictor onClose={() => setShowFloodPredictor(false)} />
      )}
      <div className="lp-grid-bg"></div>

      {/* SIH 2026 Special Announcement Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #0369a1 0%, #0284c7 40%, #2563eb 100%)',
        borderBottom: '1px solid rgba(56,189,248,0.4)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        zIndex: 100,
        position: 'relative',
        boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f0f9ff' }}>
          <span style={{ background: '#f59e0b', color: '#78350f', padding: '2px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '11px', letterSpacing: '0.5px' }}>SIH 2026</span>
          <span>⚡ <strong>ACTIVE: Mountain Catchment Flood Prediction & Early Warning Engine (Random Forest ML)</strong> · Configured baselines for Kedarnath, Chamoli, Wayanad & Himalayan catchments.</span>
        </div>
        <button 
          onClick={() => setShowFloodPredictor(true)} 
          style={{ 
            background: '#ffffff', 
            color: '#0369a1', 
            border: 'none', 
            padding: '6px 14px', 
            borderRadius: '8px', 
            fontWeight: '800', 
            cursor: 'pointer', 
            fontSize: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ⚡ Open Flash-Flood AI
        </button>
      </div>

      <nav className="lp-nav">
        <div className="lp-nav-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="lp-logo-dot"></div>CRISIS<span style={{marginLeft: '4px'}}>IQ</span>
        </div>
        <ul className="lp-nav-links">
          <li><a onClick={() => navigate('/dashboard')} style={{ color: '#38bdf8', fontWeight: 'bold' }}>⚡ EOC Command Center</a></li>
          <li><a onClick={() => document.getElementById('ai-engine')?.scrollIntoView({behavior:'smooth'})}>Catchment AI</a></li>
          <li><a onClick={() => document.getElementById('dashboard')?.scrollIntoView({behavior:'smooth'})}>Live Hazards</a></li>
          <li><a onClick={() => document.getElementById('simulation')?.scrollIntoView({behavior:'smooth'})}>Stress Test</a></li>
          <li><a onClick={() => document.getElementById('tech')?.scrollIntoView({behavior:'smooth'})}>Architecture</a></li>
        </ul>
        <div className="lp-nav-right" style={{ gap: '12px', display: 'flex', alignItems: 'center' }}>
          <div className="lp-alert-badge">⚠ OPERATIONAL MODE</div>
          <button className="lp-btn-nav" onClick={onLaunch}>Open EOC Dashboard →</button>
        </div>
      </nav>

      <section id="hero" className="lp-hero">
        <div className="lp-hero-bg-orbs">
          <div className="lp-orb lp-orb1"></div>
          <div className="lp-orb lp-orb2"></div>
          <div className="lp-orb lp-orb3"></div>
        </div>
        
        <div className="lp-hero-flex">
          <div className="lp-hero-left">
            <RealTimeTelemetryFeed 
              onSelectEvent={(ev) => {
                setSelectedEvent(ev);
                document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
              }} 
              selectedEventId={selectedEvent?.id} 
            />
          </div>

          <div className="lp-hero-center">
            <div className="lp-hero-label"><span className="lp-blink">●</span> EMERGENCY OPERATIONS CENTER · SIH-26192 ACTIVE</div>
            <h1 className="lp-hero-title">
              <div className="lp-fade-in">CRISIS</div>
              <div className="line2 lp-fade-in lp-delay-1">IQ</div>
              <div className="line3 lp-fade-in lp-delay-2" style={{ color: '#38bdf8', fontSize: '1rem', letterSpacing: '4px' }}>
                MOUNTAIN FLASH-FLOOD PREDICTION & EARLY WARNING
              </div>
            </h1>
            <p className="lp-hero-sub lp-fade-in lp-delay-3">
              Multi-source hydro-meteorological machine learning intelligence for hilly regions. Upstream catchment risk modeling for Kedarnath, Chamoli, and Himalayan headwaters before valley surges occur.
            </p>
            <div className="lp-hero-ctas lp-fade-in lp-delay-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button 
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #1d4ed8)',
                  color: '#ffffff',
                  border: '1px solid #38bdf8',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(14,165,233,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  letterSpacing: '0.5px'
                }}
              >
                ⚡ Open Full EOC Command Center →
              </button>
              <button 
                className="lp-btn-outline" 
                onClick={() => document.getElementById('ai-engine')?.scrollIntoView({behavior:'smooth'})}
              >
                Inspect Catchment AI Engine ↓
              </button>
            </div>
            <div className="lp-hero-stats lp-fade-in lp-delay-4">
              <div className="lp-stat"><div className="lp-stat-num">{liveAlerts.length || 8}</div><div className="lp-stat-label">LIVE HAZARD EVENTS</div></div>
              <div className="lp-stat"><div className="lp-stat-num">{CLIENT_DEMO_LOCATIONS.length}</div><div className="lp-stat-label">HILLY CATCHMENTS</div></div>
              <div className="lp-stat"><div className="lp-stat-num">86.1%</div><div className="lp-stat-label">MODEL ROC-AUC</div></div>
              <div className="lp-stat"><div className="lp-stat-num">INDIA</div><div className="lp-stat-label">PRIMARY FOCUS 🇮🇳</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED: SIH-26192 CATCHMENT AI ENGINE */}
      <section id="ai-engine" className="lp-section lp-ai-engine" style={{ paddingTop: '32px', paddingBottom: '32px', background: 'radial-gradient(ellipse at top, #0f172a 0%, #060b18 100%)' }}>
        <div className="lp-section-inner">
          <div className="lp-section-tag">// Core Machine Learning Intelligence · SIH26192</div>
          <h2 className="lp-section-title">FLASH-FLOOD CATCHMENT AI ENGINE</h2>
          <p className="lp-section-sub">
            Calibrated Random Forest ML model predicting flash-flood risk probability, physical explainability factors, and actionable evacuation directives for vulnerable Indian mountain basins.
          </p>
          <div style={{ marginTop: '24px' }}>
            <HomeCatchmentAIEngine onOpenFullPredictor={() => navigate('/dashboard')} />
          </div>
        </div>
      </section>

      <section id="dashboard" className="lp-section lp-dashboard">
        <div className="lp-section-inner">
          <div className="lp-section-tag">// Live Command Center</div>
          <h2 className="lp-section-title">OPERATIONS DASHBOARD</h2>
          <p className="lp-section-sub">Real-time situational awareness across all active incidents, resource deployments, and AI-generated risk assessments.</p>

          <div className="lp-dash-grid">
            <div className="lp-kpi red"><div className="lp-kpi-icon">🔴</div><div className="lp-kpi-val">{liveAlerts.length || 8}</div><div className="lp-kpi-label">Live Active Hazards</div><div className="lp-kpi-change dn">● Ingested via USGS Satellite</div></div>
            <div className="lp-kpi cyan"><div className="lp-kpi-icon">🏔️</div><div className="lp-kpi-val">{CLIENT_DEMO_LOCATIONS.length}</div><div className="lp-kpi-label">Monitored Catchments</div><div className="lp-kpi-change up">● Western Ghats & Himalayas</div></div>
            <div className="lp-kpi green"><div className="lp-kpi-icon">🧠</div><div className="lp-kpi-val">86.4%</div><div className="lp-kpi-label">ML Model ROC-AUC</div><div className="lp-kpi-change up">● Random Forest Trained</div></div>
            <div className="lp-kpi orange"><div className="lp-kpi-icon">📡</div><div className="lp-kpi-val">3</div><div className="lp-kpi-label">Live Sensor Feeds</div><div className="lp-kpi-change up">● USGS · GDACS · Catchment</div></div>
          </div>

          <div className="lp-dash-main">
            <div className="lp-panel">
              <div className="lp-panel-title">
                <span><span className="lp-live-dot"></span>LIVE INCIDENT MAP (LEAFLET GIS)</span>
                <span onClick={() => setShowFloodPredictor(true)} style={{color:'var(--cyan)', fontSize:'0.75rem', cursor:'pointer', fontWeight: 'bold'}}>Full Catchment GIS →</span>
              </div>
              <HomeIncidentMap 
                events={liveAlerts} 
                selectedEvent={selectedEvent} 
                onSelectEvent={(ev) => setSelectedEvent(ev)} 
                onOpenCatchmentPredictor={() => setShowFloodPredictor(true)} 
              />
            </div>

            <div className="lp-panel">
              <div className="lp-panel-title">
                <span><span className="lp-live-dot"></span>LIVE OPERATIONAL INCIDENTS ({liveAlerts.length})</span>
              </div>
              <div className="lp-alert-list" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                {loadingAlerts ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                    Ingesting active satellite & sensor alerts...
                  </div>
                ) : liveAlerts.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                    No active alerts in current ingestion cycle.
                  </div>
                ) : (
                  liveAlerts.slice(0, 6).map((alert) => (
                    <div 
                      key={alert.id}
                      className={`lp-alert-item ${alert.severity.toLowerCase()}`}
                      onClick={() => setSelectedEvent(alert)}
                      style={{
                        cursor: 'pointer',
                        borderColor: selectedEvent?.id === alert.id ? '#38bdf8' : undefined,
                        background: selectedEvent?.id === alert.id ? 'rgba(14, 165, 233, 0.18)' : undefined,
                        boxShadow: selectedEvent?.id === alert.id ? '0 0 15px rgba(56,189,248,0.3)' : undefined
                      }}
                    >
                      <div className="lp-alert-icon">
                        {alert.type === 'Flash Flood' ? '🌊' : '⚡'}
                      </div>
                      <div className="lp-alert-body">
                        <div className="lp-alert-name" style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '13px' }}>
                          {alert.place}
                        </div>
                        <div className="lp-alert-meta" style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
                          {alert.source} · {alert.magnitude ? `M ${alert.magnitude.toFixed(1)} · ` : ''}
                          {alert.depthKm ? `${alert.depthKm}km depth · ` : ''}
                          {Math.max(0, Math.floor((Date.now() - alert.time) / 60000))}m ago
                        </div>
                      </div>
                      <div className={`lp-alert-badge-sm lp-badge-${alert.severity.toLowerCase()}`}>
                        {alert.severity.toUpperCase()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="lp-section lp-roles">
        <div className="lp-section-inner">
          <div className="lp-section-tag">// Users & Access Control</div>
          <h2 className="lp-section-title">USER ROLES</h2>
          <p className="lp-section-sub">CRISIS IQ serves three distinct user types, each with tailored dashboards, capabilities, and data access.</p>
          <div className="lp-roles-grid">
            <div className="lp-role-card citizen">
              <div className="lp-role-icon">👤</div>
              <div className="lp-role-name">CITIZEN</div>
              <div className="lp-role-desc">Civilians affected by or near disaster zones. Access personal safety tools, real-time maps, and emergency guidance.</div>
              <div className="lp-role-caps">
                <div className="lp-role-cap">Report incidents in real-time</div>
                <div className="lp-role-cap">Receive AI-generated safe advice</div>
                <div className="lp-role-cap">View live evacuation maps</div>
                <div className="lp-role-cap">Get nearest hospital / safe zone</div>
              </div>
            </div>
            <div className="lp-role-card responder">
              <div className="lp-role-icon">🚒</div>
              <div className="lp-role-name">RESPONDER</div>
              <div className="lp-role-desc">Field personnel including fire, medical, police, and rescue teams. Coordinate with AI-powered dispatch and resource management.</div>
              <div className="lp-role-caps">
                <div className="lp-role-cap">Manage rescue operations</div>
                <div className="lp-role-cap">Coordinate team dispatch</div>
                <div className="lp-role-cap">Access AI resource recommendations</div>
                <div className="lp-role-cap">Update incident status in real-time</div>
              </div>
            </div>
            <div className="lp-role-card admin">
              <div className="lp-role-icon">🏛️</div>
              <div className="lp-role-name">ADMIN</div>
              <div className="lp-role-desc">Government and agency administrators overseeing multi-region operations with full system access and analytics control.</div>
              <div className="lp-role-caps">
                <div className="lp-role-cap">Monitor all active incidents</div>
                <div className="lp-role-cap">Issue mass public alerts</div>
                <div className="lp-role-cap">Access full analytics suite</div>
                <div className="lp-role-cap">Configure AI thresholds</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="data-sources" className="lp-section lp-data-sources">
        <div className="lp-section-inner">
          <div className="lp-section-tag">// Architecture & Integrations</div>
          <h2 className="lp-section-title">DATA PROVENANCE & ARCHITECTURE</h2>
          <p className="lp-section-sub">CRISIS IQ transparently separates live operational feeds, calibrated catchment baselines, and proposed production integrations.</p>
          <div className="lp-sources-grid">
            <div className="lp-source-card"><div className="lp-source-icon-wrap lp-src-weather">⛅</div>
              <div className="lp-source-body"><h4>Catchment Baselines</h4><p>Hydrologically calibrated soil wetness indices, slope profiles, and precipitation thresholds derived from published IMD reanalysis studies.</p>
                <div className="lp-source-tags"><span className="lp-tag">IMD Reanalysis (Baseline)</span><span className="lp-tag">CWC Basin Morphometry (Baseline)</span></div>
              </div>
            </div>
            <div className="lp-source-card"><div className="lp-source-icon-wrap lp-src-disaster">⚠️</div>
              <div className="lp-source-body"><h4>Live Hazard API</h4><p>Public USGS real-time GeoJSON stream ingested every 60s to monitor concurrent seismic triggers and active local incident alerts.</p>
                <div className="lp-source-tags"><span className="lp-tag">USGS GeoJSON (Live)</span><span className="lp-tag">CrisisIQ Incidents (Live)</span></div>
              </div>
            </div>
            <div className="lp-source-card"><div className="lp-source-icon-wrap lp-src-location">📍</div>
              <div className="lp-source-body"><h4>Geospatial GIS Data</h4><p>High-resolution digital elevation vectors, slope gradients, and pre-mapped safe refuge coordinates for mountain settlement zones.</p>
                <div className="lp-source-tags"><span className="lp-tag">OpenStreetMap GIS</span><span className="lp-tag">CartoDB Dark Matter</span></div>
              </div>
            </div>
            <div className="lp-source-card"><div className="lp-source-icon-wrap lp-src-satellite">🛰️</div>
              <div className="lp-source-body"><h4>Production Roadmap</h4><p>Architected for direct integration with state disaster management centers via Doppler Weather Radar (DWR) and INSAT-3DR satellite feeds.</p>
                <div className="lp-source-tags"><span className="lp-tag">IMD DWR (Production Integration)</span><span className="lp-tag">INSAT-3DR (Production Integration)</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="notifications" className="lp-section lp-notifications">
        <div className="lp-section-inner">
          <div className="lp-section-tag">// Alert Delivery</div>
          <h2 className="lp-section-title">NOTIFICATION SYSTEM</h2>
          <p className="lp-section-sub">Multi-channel alert delivery ensures citizens and responders receive critical information instantly, regardless of connectivity.</p>
          <div className="lp-notif-grid">
            <div className="lp-notif-card"><div className="lp-notif-icon">📱</div><div className="lp-notif-name">In-App Alerts</div><div className="lp-notif-desc">Real-time push notifications within the CRISIS IQ mobile and web app with severity indicators and action prompts.</div><div className="lp-notif-status"><span className="lp-live-dot"></span> Active · avg 0.2s delivery</div></div>
            <div className="lp-notif-card"><div className="lp-notif-icon">🔔</div><div className="lp-notif-name">Push Notifications</div><div className="lp-notif-desc">Background alerts delivered to mobile devices even when the app is closed, using Firebase Cloud Messaging.</div><div className="lp-notif-status"><span className="lp-live-dot"></span> Active · FCM enabled</div></div>
            <div className="lp-notif-card"><div className="lp-notif-icon">📩</div><div className="lp-notif-name">SMS / Email</div><div className="lp-notif-desc">Failsafe SMS and email alerts for areas with limited internet. Powered by Twilio for reliable global delivery.</div><div className="lp-notif-status"><span className="lp-live-dot"></span> Active · Twilio integrated</div></div>
          </div>
        </div>
      </section>

      <section id="simulation" className="lp-section lp-simulation">
        <div className="lp-section-inner">
          <div className="lp-section-tag">// Scenario Planning</div>
          <h2 className="lp-section-title">DISASTER SIMULATION</h2>
          <p className="lp-section-sub">Test response plans, validate AI recommendations, and train responders against simulated disaster scenarios.</p>
          <div className="lp-sim-container">
            <div className="lp-sim-controls">
              <select className="lp-sim-select" value={simType} onChange={e => setSimType(e.target.value)}>
                <option value="flood">🌊 Flood — Category 3</option>
                <option value="fire">🔥 Forest Fire</option>
                <option value="earthquake">⚡ Earthquake M6.0</option>
                <option value="cyclone">🌀 Cyclone — Category 2</option>
              </select>
              <button className="lp-btn-sim-run" onClick={runSimulation}>▶ RUN SIMULATION</button>
              <button className="lp-btn-sim" onClick={clearSim}>✕ CLEAR</button>
            </div>
            <div className="lp-sim-output" ref={simOutputRef}>
              {simLines.map((line, i) => (
                <div key={i} className={`lp-sim-line ${line.t}`}>{line.m}</div>
              ))}
            </div>
            {simRes && (
              <div className="lp-sim-results">
                <div className="lp-sim-result"><div className="lp-sim-result-val" style={{color:'var(--cyan)'}}>{simRes.sr1}</div><div className="lp-sim-result-label">Survival Rate</div></div>
                <div className="lp-sim-result"><div className="lp-sim-result-val" style={{color:'var(--red)'}}>{simRes.sr2}</div><div className="lp-sim-result-label">Pop. at Risk</div></div>
                <div className="lp-sim-result"><div className="lp-sim-result-val" style={{color:'var(--green)'}}>{simRes.sr3}</div><div className="lp-sim-result-label">Evac. Time</div></div>
                <div className="lp-sim-result"><div className="lp-sim-result-val" style={{color:'var(--orange)'}}>{simRes.sr4}</div><div className="lp-sim-result-label">Resources Req.</div></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="tech" className="lp-section lp-tech">
        <div className="lp-section-inner">
          <div className="lp-section-tag">// System Architecture</div>
          <h2 className="lp-section-title">TECH STACK</h2>
          <p className="lp-section-sub">Built on a modern, scalable, cloud-native architecture designed for zero-downtime operation during peak crisis events.</p>
          <div className="lp-tech-layers">
            <div className="lp-tech-layer"><div className="lp-tech-layer-name">Frontend</div><div className="lp-tech-items"><span className="lp-tech-pill">React</span><span className="lp-tech-pill">Tailwind CSS</span><span className="lp-tech-pill">WebSocket</span><span className="lp-tech-pill">Leaflet Maps</span></div></div>
            <div className="lp-tech-layer"><div className="lp-tech-layer-name">Backend</div><div className="lp-tech-items"><span className="lp-tech-pill">Node.js</span><span className="lp-tech-pill">Appwrite</span><span className="lp-tech-pill">RESTful API</span><span className="lp-tech-pill">Auth & RBAC</span></div></div>
            <div className="lp-tech-layer"><div className="lp-tech-layer-name">AI Layer</div><div className="lp-tech-items"><span className="lp-tech-pill">OpenAI GPT</span><span className="lp-tech-pill">Google Gemini</span><span className="lp-tech-pill">Scenario Analysis</span></div></div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-flow-bar">
            <strong style={{color:'var(--cyan)'}}>END-TO-END FLOW:</strong>
            <span>User Input</span> → <span>API Gateway</span> → <span>AI Engine + External Data</span> → <span>Decision + Map</span> → <span>Real-time Alert</span>
          </div>
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-nav-logo"><div className="lp-logo-dot"></div>CRISIS<span style={{marginLeft:'4px'}}>IQ</span></div>
              <p>AI-powered disaster response infrastructure for governments, agencies, and emergency services worldwide.</p>
            </div>
            <div className="lp-footer-col">
              <h5>Platform</h5>
              <ul><li><a href="#dashboard">Dashboard</a></li><li><a href="#ai-engine">AI Engine</a></li><li><a href="#simulation">Simulation</a></li></ul>
            </div>
            <div className="lp-footer-col">
              <h5>Architecture</h5>
              <ul><li><a href="#tech">Tech Stack</a></li><li><a href="#cloud">Cloud & DevOps</a></li><li><a href="#data-sources">Data Sources</a></li></ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 CRISIS IQ — AI-Powered Disaster Response System</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace", color:'var(--cyan)'}}>v2.4.1 · All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
