import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaSatellite, FaMapMarkerAlt, FaExternalLinkAlt, 
  FaCrosshairs, FaSyncAlt
} from 'react-icons/fa';

export interface TelemetryEvent {
  id: string;
  source: 'USGS' | 'CRISISIQ' | 'GDACS';
  title: string;
  place: string;
  magnitude?: number;
  type: string;
  coordinates: [number, number]; // [lat, lon]
  depthKm?: number;
  time: number;
  url?: string;
  severity: 'Critical' | 'Warning' | 'Moderate' | 'Low';
}

interface RealTimeTelemetryFeedProps {
  onSelectEvent?: (event: TelemetryEvent) => void;
  selectedEventId?: string | null;
}

export function RealTimeTelemetryFeed({ onSelectEvent, selectedEventId }: RealTimeTelemetryFeedProps) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchRealTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const feedResults: TelemetryEvent[] = [];

      // 1. Fetch genuine real-time earthquakes from USGS API (last hour / day)
      try {
        const usgsRes = await axios.get(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
          { timeout: 5000 }
        );
        let usgsFeatures = usgsRes.data.features || [];
        
        // If hour feed has very few events, fallback to all_day feed for rich live data
        if (usgsFeatures.length < 5) {
          const dayRes = await axios.get(
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
            { timeout: 5000 }
          );
          usgsFeatures = dayRes.data.features || [];
        }

        for (const f of usgsFeatures.slice(0, 15)) {
          const mag = f.properties.mag ?? 0;
          const [lon, lat, depth] = f.geometry.coordinates;
          let severity: TelemetryEvent['severity'] = 'Low';
          if (mag >= 6.0) severity = 'Critical';
          else if (mag >= 4.5) severity = 'Warning';
          else if (mag >= 3.0) severity = 'Moderate';

          feedResults.push({
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
            severity
          });
        }
      } catch (err) {
        console.warn('USGS live stream notice:', err);
      }

      // 2. Fetch genuine stored CrisisIQ alerts from local backend
      try {
        const backendRes = await axios.get('http://localhost:3001/api/alerts/public', { timeout: 3000 });
        const localAlerts = backendRes.data || [];
        for (const a of localAlerts.slice(0, 5)) {
          const coords = a.location?.coordinates || [76.13, 11.50];
          feedResults.unshift({
            id: `crisisiq-${a._id || Math.random()}`,
            source: 'CRISISIQ',
            title: a.title || 'Flash Flood Early Warning',
            place: a.location?.region || 'Monitored Mountain Catchment',
            type: a.type === 'flood' ? 'Flash Flood' : a.type || 'Hydrology',
            coordinates: [coords[1], coords[0]],
            time: new Date(a.createdAt || Date.now()).getTime(),
            severity: a.severity === 'critical' ? 'Critical' : a.severity === 'high' ? 'Warning' : 'Moderate'
          });
        }
      } catch (err) {
        // Backend offline or empty, use verified USGS stream
      }

      // Sort by time descending (newest first)
      feedResults.sort((a, b) => b.time - a.time);

      setEvents(feedResults);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (e) {
      console.error('Failed to load real telemetry:', e);
      setLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRealTelemetry();
    const interval = setInterval(fetchRealTelemetry, 60000); // 60s live poll
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (timestamp: number) => {
    const diffMin = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60)));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const severityBadges: Record<string, string> = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/40',
    Warning: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    Moderate: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    Low: 'bg-slate-700/40 text-slate-400 border-slate-600'
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* REAL-TIME TICKER */}
      <div className="bg-sky-950/40 border-y border-sky-500/20 py-2 px-3 overflow-hidden whitespace-nowrap relative rounded-xl backdrop-blur">
        <div className="inline-block text-[11px] font-mono tracking-wider text-sky-400">
          <span className="bg-sky-500 text-slate-950 px-2 py-0.5 rounded font-black text-[9px] mr-2">LIVE STREAM</span>
          {events.length > 0 ? (
            events.slice(0, 5).map(e => `[ ${e.source}: ${e.title.toUpperCase()} — ${formatElapsed(e.time)} ]  •  `).join('')
          ) : (
            'CONNECTING TO LIVE HAZARD STREAM...'
          )}
        </div>
      </div>

      {/* FEED CARD */}
      <div className="bg-[#0b1329]/90 border border-slate-700/60 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col max-h-[580px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FaSatellite className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                Operational Hazard Feed
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Live USGS Seismic API & CrisisIQ Operational Incidents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRealTelemetry}
              disabled={isRefreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition text-xs flex items-center gap-1 border border-slate-700"
              title="Refresh operational stream"
            >
              <FaSyncAlt className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> LIVE
            </span>
          </div>
        </div>

        {/* Telemetry Stream List */}
        <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to Live USGS Feed & CrisisIQ Incident Store...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs font-mono">
              No live incidents reported in current cycle. Basin status: Nominal.
            </div>
          ) : (
            events.map((ev) => {
              const isSelected = selectedEventId === ev.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent && onSelectEvent(ev)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${severityBadges[ev.severity]}`}>
                        {ev.source} {ev.magnitude ? `M${ev.magnitude.toFixed(1)}` : ev.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatElapsed(ev.time)}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <FaCrosshairs className="text-[9px] text-sky-400" />
                      {ev.coordinates[0].toFixed(2)}°, {ev.coordinates[1].toFixed(2)}°
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">
                    {ev.place}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>
                      {ev.depthKm !== undefined ? `Depth: ${ev.depthKm} km` : `Basin: Catchment Alert Node`}
                    </span>

                    {ev.url ? (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 underline font-semibold"
                      >
                        USGS Report <FaExternalLinkAlt className="text-[8px]" />
                      </a>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Operational Incident</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>{events.length} Operational Incidents Active</span>
          <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
