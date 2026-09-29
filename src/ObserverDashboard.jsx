import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import { SyncService } from './SyncService';
import './index.css';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const gnssIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const estimatedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position.lat) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);
  return null;
}

export default function ObserverDashboard() {
  const { sessionId } = useParams();
  const [telemetry, setTelemetry] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [timeAgo, setTimeAgo] = useState(0);
  
  const [trajectoryGnss, setTrajectoryGnss] = useState([]);
  const [trajectoryEst, setTrajectoryEst] = useState([]);

  const syncService = useRef(null);

  useEffect(() => {
    syncService.current = new SyncService(sessionId, 'observer');
    
    const unsubscribe = syncService.current.subscribe((message) => {
      if (message.type === 'start') {
        setSessionActive(true);
      } else if (message.type === 'end') {
        setSessionActive(false);
      } else if (message.type === 'update') {
        setSessionActive(true);
        setTelemetry(message.data);
        setLastUpdate(Date.now());
        
        // Update trajectories
        if (message.data.gnssAvailable && message.data.lastGnssPosition) {
          setTrajectoryGnss(prev => [...prev, [message.data.lastGnssPosition.lat, message.data.lastGnssPosition.lng]]);
        }
        if (message.data.estimatedPosition) {
          setTrajectoryEst(prev => [...prev, [message.data.estimatedPosition.lat, message.data.estimatedPosition.lng]]);
        }
      }
    });

    const interval = setInterval(() => {
      setTimeAgo(Math.floor((Date.now() - lastUpdate) / 1000));
    }, 1000);

    return () => {
      unsubscribe();
      if (syncService.current) syncService.current.disconnect();
      clearInterval(interval);
    };
  }, [sessionId, lastUpdate]);

  if (!telemetry && !sessionActive) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <Activity size={48} className="text-cyan mb-2" />
        <h2>Waiting for tracking session...</h2>
        <p className="text-muted">ID: {sessionId}</p>
        <p>The driver has not started sharing data yet, or the session has ended.</p>
      </div>
    );
  }

  const pos = telemetry?.estimatedPosition || { lat: 28.6139, lng: 77.2090 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      {/* Top Navbar */}
      <nav className="navbar" style={{ position: 'relative', borderBottom: '1px solid var(--border-tech)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="logo text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>NAVIQ</span> <span className="text-muted">|</span> <span className="text-cyan">OBSERVER</span>
          </div>
          <div className="mono text-muted text-sm">
            SESSION: <span className="text-cyan">{sessionId}</span>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Telemetry */}
        <div style={{ width: '350px', background: 'var(--bg-card)', borderRight: '1px solid var(--border-tech)', padding: '1.5rem', overflowY: 'auto' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <div className="text-sm text-muted mono mb-1">LAST UPDATE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeAgo > 5 ? 'var(--status-warning)' : 'var(--status-safe)' }}>
              <Clock size={16} /> {timeAgo} seconds ago
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div className="text-sm text-muted mono mb-1">NAVIGATION MODE</div>
            <div style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              background: 'var(--bg-base)', 
              border: `1px solid ${telemetry?.gnssAvailable ? 'var(--status-safe)' : 'var(--accent-blue)'}`,
              color: telemetry?.gnssAvailable ? 'var(--status-safe)' : 'var(--accent-blue)',
              fontWeight: 'bold'
            }}>
              {telemetry?.mode || 'UNKNOWN'}
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div className="text-sm text-muted mono mb-1">GNSS STATUS</div>
              {telemetry?.gnssAvailable ? (
                <div style={{ color: 'var(--status-safe)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wifi size={16} /> AVAILABLE</div>
              ) : (
                <div style={{ color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><WifiOff size={16} /> DENIED</div>
              )}
            </div>
            
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <div className="text-sm text-muted mono mb-1">IMU STATUS</div>
              <div style={{ color: 'var(--status-safe)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} /> ACTIVE</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div className="text-sm text-muted mono mb-1">SPEED</div>
            <div style={{ fontSize: '2rem' }}>{telemetry?.speed?.toFixed(1) || '0.0'} <span className="text-sm">m/s</span></div>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div className="text-sm text-muted mono mb-1">HEADING</div>
            <div style={{ fontSize: '2rem' }}>{telemetry?.heading?.toFixed(0) || '0'}°</div>
          </div>

          {!telemetry?.gnssAvailable && telemetry?.gnssOutageDuration > 0 && (
            <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--status-danger)' }}>
              <div className="text-sm text-muted mono mb-1">OUTAGE DURATION</div>
              <div style={{ fontSize: '1.5rem', color: 'var(--status-danger)' }}>
                {(telemetry.gnssOutageDuration / 1000).toFixed(1)}s
              </div>
            </div>
          )}

        </div>

        {/* Map Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!sessionActive && (
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <h2 className="text-muted">Session Ended</h2>
             </div>
          )}
          <MapContainer center={[pos.lat, pos.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark-map-tiles"
            />
            {telemetry?.lastGnssPosition && telemetry?.gnssAvailable && (
               <Marker position={[telemetry.lastGnssPosition.lat, telemetry.lastGnssPosition.lng]} icon={gnssIcon}>
                 <Popup>GNSS Position</Popup>
               </Marker>
            )}
            {telemetry?.estimatedPosition && (
               <Marker position={[telemetry.estimatedPosition.lat, telemetry.estimatedPosition.lng]} icon={estimatedIcon}>
                 <Popup>Estimated Position</Popup>
               </Marker>
            )}
            <Polyline positions={trajectoryGnss} color="var(--status-safe)" weight={3} />
            <Polyline positions={trajectoryEst} color="var(--accent-blue)" weight={3} dashArray="5, 10" />
            <MapUpdater position={pos} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
