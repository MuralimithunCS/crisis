import { useCallback, useState, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
  InfoWindow,
  Polyline
} from '@react-google-maps/api';
import { useAlertStore } from '../stores/alertStore';
import { MOCK_HOSPITALS, MOCK_SAFE_ZONES } from '../utils/mockInfrastructure';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629 // India center
};

const severityColors: any = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444'
};

interface MapViewProps {
  alerts: any[];
  height?: string;
  showControls?: boolean;
  onAlertClick?: (alert: any) => void;
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
}

export function MapView(props: MapViewProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
  
  if (!apiKey) {
    return (
      <div style={{ height: props.height || '400px' }} className="flex items-center justify-center bg-gray-200 rounded-lg text-center p-4">
        <p className="text-gray-600 font-medium">
          Map disabled to prevent runtime errors.<br/>
          (Configure VITE_GOOGLE_MAPS_KEY in .env)
        </p>
      </div>
    );
  }

  return <MapViewContent {...props} apiKey={apiKey} />;
}

function MapViewContent({ 
  alerts, 
  height = '400px',
  showControls = false,
  onAlertClick,
  onMapClick,
  apiKey
}: MapViewProps & { apiKey: string }) {
  const { selectAlert, selectedAlert } = useAlertStore();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places', 'geometry']
  });
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  }, []);
  
  const onLoad = useCallback((googleMap: google.maps.Map) => {
    if (alerts.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      alerts.forEach(alert => {
        bounds.extend({
          lat: alert.location.coordinates[1],
          lng: alert.location.coordinates[0]
        });
      });
      googleMap.fitBounds(bounds, 50);
    }
  }, [alerts]);
  
  const handleMarkerClick = (alert: any) => {
    selectAlert(alert);
    onAlertClick?.(alert);
  };
  
  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <p className="text-red-500">Error loading map</p>
      </div>
    );
  }
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg animate-pulse" style={{ height }}>
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }
  
  return (
    <div style={{ height }} className="rounded-lg overflow-hidden relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || defaultCenter}
        zoom={5}
        onLoad={onLoad}
        onClick={onMapClick}
        options={{
          styles: mapStyles,
          disableDefaultUI: !showControls,
          zoomControl: showControls,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: showControls
        }}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }}
            title="Your location"
          />
        )}
        
        {alerts.map(alert => (
          <div key={alert._id || alert.title}>
            <Marker
              position={{
                lat: alert.location.coordinates[1],
                lng: alert.location.coordinates[0]
              }}
              icon={{
                url: getAlertIcon(alert.type, alert.severity),
                scaledSize: new window.google.maps.Size(32, 32)
              }}
              onClick={() => handleMarkerClick(alert)}
              animation={
                alert.severity === 'critical' 
                  ? window.google.maps.Animation.BOUNCE
                  : undefined
              }
            />
            
            {alert.affectedRadius && (
              <Circle
                center={{
                  lat: alert.location.coordinates[1],
                  lng: alert.location.coordinates[0]
                }}
                radius={alert.affectedRadius * 1000}
                options={{
                  fillColor: severityColors[alert.severity] || '#666',
                  fillOpacity: 0.2,
                  strokeColor: severityColors[alert.severity] || '#666',
                  strokeOpacity: 0.8,
                  strokeWeight: 2
                }}
              />
            )}
          </div>
        ))}
        
        {selectedAlert && (
          <InfoWindow
            position={{
              lat: selectedAlert.location.coordinates[1],
              lng: selectedAlert.location.coordinates[0]
            }}
            onCloseClick={() => selectAlert(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold text-lg">{selectedAlert.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAlert.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-200`}>
                  {selectedAlert.severity?.toUpperCase() || 'UNKNOWN'}
                </span>
                <span className="text-xs text-gray-500">
                  {selectedAlert.location.region}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
        
        {MOCK_HOSPITALS.map((h) => (
          <Marker
            key={h.id}
            position={{ lat: h.lat, lng: h.lng }}
            icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/hospitals.png', scaledSize: new window.google.maps.Size(32, 32) }}
            title={`Hospital: ${h.name}`}
          />
        ))}
        {MOCK_SAFE_ZONES.map((s) => (
          <Marker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
            title={`Safe Zone: ${s.name}`}
          />
        ))}
        {selectedAlert?.aiAnalysis?.evacuationRoutes?.map((route: any, idx: number) => (
          <Polyline
            key={idx}
            path={window.google.maps.geometry.encoding.decodePath(route.polyline)}
            options={{
              strokeColor: '#22c55e',
              strokeOpacity: 0.8,
              strokeWeight: 4
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

function getAlertIcon(_type: string, severity: string): string {
  return `https://maps.google.com/mapfiles/ms/icons/${severity === 'critical' ? 'red' : 'blue'}-dot.png`;
}

const mapStyles = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
  }
];
