import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TelemetryEvent } from './RealTimeTelemetryFeed';
import { CLIENT_DEMO_LOCATIONS } from '../services/api';
import { FaMountain, FaExternalLinkAlt, FaWater } from 'react-icons/fa';

// Map Auto-Updater to pan/zoom to selected event
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

interface HomeIncidentMapProps {
  events: TelemetryEvent[];
  selectedEvent: TelemetryEvent | null;
  onSelectEvent?: (event: TelemetryEvent) => void;
  onOpenCatchmentPredictor?: () => void;
}

// Custom Leaflet DivIcon for Indian Mountain Catchments
const createCatchmentIcon = (riskFreq: number) => {
  const color = riskFreq > 8 ? '#ef4444' : riskFreq > 7 ? '#f97316' : '#0ea5e9';
  return L.divIcon({
    className: 'custom-catchment-icon',
    html: `
      <div style="
        background-color: ${color}; 
        width: 24px; 
        height: 24px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 0 15px ${color}; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 900;
      ">
        ▲
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

export function HomeIncidentMap({ 
  events, 
  selectedEvent, 
  onSelectEvent,
  onOpenCatchmentPredictor 
}: HomeIncidentMapProps) {
  // Default center on India / Himalayan & Western Ghats hazard corridor
  const defaultCenter: [number, number] = [23.5, 78.5];
  const defaultZoom = 4;

  const currentCenter: [number, number] = selectedEvent 
    ? selectedEvent.coordinates 
    : defaultCenter;
  const currentZoom = selectedEvent ? 7 : defaultZoom;

  return (
    <div className="h-[520px] w-full bg-[#060b18] rounded-3xl border border-slate-700/60 overflow-hidden shadow-2xl relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        attributionControl={false}
      >
        <MapController center={currentCenter} zoom={currentZoom} />
        
        {/* Professional Dark Matter Basemap */}
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* 1. Plot Real USGS & CrisisIQ Live Events */}
        {events.map((ev) => {
          const isSelected = selectedEvent?.id === ev.id;
          const mag = ev.magnitude ?? 3.0;
          const radius = Math.min(Math.max(mag * 3.5, 8), 24);
          const color = ev.severity === 'Critical' 
            ? '#ef4444' 
            : ev.severity === 'Warning' 
            ? '#f97316' 
            : '#38bdf8';

          return (
            <CircleMarker
              key={ev.id}
              center={ev.coordinates}
              radius={isSelected ? radius + 5 : radius}
              pathOptions={{
                color: isSelected ? '#ffffff' : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.65,
                weight: isSelected ? 3 : 1.5
              }}
              eventHandlers={{
                click: () => onSelectEvent && onSelectEvent(ev)
              }}
            >
              <Popup className="custom-dark-popup">
                <div className="p-2 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400 uppercase text-[10px] tracking-wider">{ev.source} INCIDENT STREAM</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {ev.magnitude ? `M ${ev.magnitude.toFixed(1)}` : ev.type}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-white text-sm leading-snug">{ev.place}</h4>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Coord: {ev.coordinates[0].toFixed(3)}°, {ev.coordinates[1].toFixed(3)}°
                  </div>
                  {ev.depthKm !== undefined && (
                    <div className="text-[11px] text-slate-400">Depth: {ev.depthKm} km</div>
                  )}
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 underline font-bold"
                    >
                      USGS Earthquake Page <FaExternalLinkAlt className="text-[9px]" />
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* 2. Plot Real Pre-Configured Monitored Mountain Catchments */}
        {CLIENT_DEMO_LOCATIONS.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.coordinates[1], loc.coordinates[0]]}
            icon={createCatchmentIcon(loc.historical_flood_frequency)}
          >
            <Popup>
              <div className="p-2 bg-slate-900 text-slate-200 rounded-xl text-xs space-y-2 min-w-[220px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <FaMountain /> Catchment Node
                  </span>
                  <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {loc.state}
                  </span>
                </div>
                <h4 className="font-black text-white text-sm">{loc.name}</h4>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300 pt-1 border-t border-slate-800">
                  <div>Elevation: <strong className="text-white">{loc.elevation_m} m</strong></div>
                  <div>Slope: <strong className="text-amber-300">{loc.slope_deg}°</strong></div>
                  <div>Basin Area: <strong className="text-white">{loc.catchment_area_sqkm} km²</strong></div>
                  <div>Flood Risk: <strong className="text-rose-400">{loc.historical_flood_frequency}/10</strong></div>
                </div>
                {onOpenCatchmentPredictor && (
                  <button
                    onClick={onOpenCatchmentPredictor}
                    className="w-full mt-2 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                  >
                    <FaWater /> Run Catchment AI
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-xl text-xs space-y-1.5">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-800 pb-1">
          Geospatial Map Layers
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
          <span>Major USGS Seismic (M 6.0+)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div>
          <span>Moderate Seismic (M 4.5+)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"></div>
          <span>Minor USGS Seismic Activity</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <div className="w-3 h-3 rounded-full bg-blue-600 border border-white"></div>
          <span>▲ Monitored Hilly Catchment</span>
        </div>
      </div>

      {/* Map Top Status */}
      <div className="absolute top-4 right-4 z-[500] bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg text-[10px] font-mono text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>CartoDB Dark Matter · Live USGS Feed</span>
      </div>
    </div>
  );
}
