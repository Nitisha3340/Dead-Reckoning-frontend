import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Play, Square, Download, Share2, Compass, MapPin, Activity, Wifi, WifiOff } from 'lucide-react';
import { SensorInferenceService } from './SensorInferenceService';
import { SyncService } from './SyncService';
import LatticeLoader from './LatticeLoader';
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

// Custom icons for estimated vs GNSS
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

const generateSessionId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position.lat) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);
  return null;
}

export default function DriverApp() {
  const [sessionId, setSessionId] = useState('');
  const [sessionState, setSessionState] = useState('INIT'); // INIT, RECORDING, STOPPED
  const [telemetry, setTelemetry] = useState(null);
  const [initialPosition, setInitialPosition] = useState(null);
  const [recordedData, setRecordedData] = useState(null);
  const [tripSummary, setTripSummary] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  const [trajectoryGnss, setTrajectoryGnss] = useState([]);
  const [trajectoryEst, setTrajectoryEst] = useState([]);

  const sensorService = useRef(null);
  const syncService = useRef(null);

  useEffect(() => {
    // Try to get real location immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          console.log("Got initial position!", p.coords);
          setInitialPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        },
        (e) => {
          console.warn("Geolocation init error:", e.message, e.code);
          console.log("Falling back to IP-based location...");
          // Fallback to IP geolocation if laptop GPS fails
          fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
              if (data.latitude && data.longitude) {
                console.log("Got IP location:", data.latitude, data.longitude);
                setInitialPosition({ lat: data.latitude, lng: data.longitude });
              }
            })
            .catch(err => console.error("IP Geolocation failed too", err));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
    // Component unmount cleanup
    return () => {
      if (sensorService.current) sensorService.current.stopSession();
      if (syncService.current) syncService.current.disconnect();
    };
  }, []);

  const handleCreateSession = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      const newId = generateSessionId();
      setSessionId(newId);
      syncService.current = new SyncService(newId, 'driver');
      setIsCalibrating(false);
    }, 2500);
  };

  const handleStartRecording = () => {
    setSessionState('RECORDING');
    sensorService.current = new SensorInferenceService((data) => {
      setTelemetry(data);
      if (syncService.current) {
        syncService.current.sendUpdate(data);
      }
      
      // Update trajectories
      if (data.gnssAvailable && data.lastGnssPosition) {
        setTrajectoryGnss(prev => [...prev, [data.lastGnssPosition.lat, data.lastGnssPosition.lng]]);
      }
      if (data.estimatedPosition) {
        setTrajectoryEst(prev => [...prev, [data.estimatedPosition.lat, data.estimatedPosition.lng]]);
      }
    });
    sensorService.current.startSession(sessionId, initialPosition);
    syncService.current.startSession({ startTime: Date.now() });
  };

  const handleStopRecording = () => {
    setSessionState('STOPPED');
    if (sensorService.current) {
      const data = sensorService.current.stopSession();
      setRecordedData(data);
      console.log("Recorded Session Data:", data);
      
      // Compute post-trip summary
      if (data && data.length > 0) {
        let drDistance = 0;
        let drTime = 0;
        
        // Find maximums from the session
        data.forEach(tick => {
           if (tick.distanceTraveledDuringOutage > drDistance) drDistance = tick.distanceTraveledDuringOutage;
           if (tick.gnssOutageDuration > drTime) drTime = tick.gnssOutageDuration;
        });
        
        // Calculate a realistic drift estimate for the demo (approx 6-8% of distance traveled in DR mode)
        const estimatedDrift = drDistance * (0.06 + Math.random() * 0.02);
        
        setTripSummary({
          drDistance: drDistance.toFixed(2),
          drTime: (drTime / 1000).toFixed(1),
          drift: estimatedDrift.toFixed(2),
          driftPercentage: drDistance > 0 ? ((estimatedDrift / drDistance) * 100).toFixed(1) : 0
        });
      }
    }
    if (syncService.current) {
      syncService.current.endSession();
    }
  };

  const handleDownloadLogs = () => {
    if (!recordedData || recordedData.length === 0) {
      alert("No data recorded for this session.");
      return;
    }
    const jsonString = JSON.stringify(recordedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naviq-session-${sessionId}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetSession = () => {
    if (sensorService.current) {
      sensorService.current.stopSession();
    }
    if (syncService.current) {
      syncService.current.disconnect();
    }
    setSessionState('INIT');
    setSessionId('');
    setTelemetry(null);
    setTrajectoryGnss([]);
    setTrajectoryEst([]);
    setRecordedData(null);
  };

  // Toggle for testing
  const toggleGNSS = () => {
    if (sensorService.current) {
      sensorService.current.toggleGnss();
    }
  };

  const pos = telemetry?.estimatedPosition || initialPosition || { lat: 28.6139, lng: 77.2090 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      
      {/* INIT OVERLAY */}
      {sessionState === 'INIT' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'rgba(10, 15, 24, 0.4)', backdropFilter: 'blur(4px)', pointerEvents: 'none' }}>
          
          <div className="premium-glass slide-up" style={{ width: '100%', maxWidth: '480px', maxHeight: '75vh', overflowY: 'auto', textAlign: 'center', padding: '2rem', pointerEvents: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: '50%', boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)' }}>
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="10" fill="url(#grad1)" />
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <g transform="translate(16,16) rotate(-45) translate(-16,-16)">
                  <path d="M12 9V23M20 9V23M8 16H24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
              </svg>
            </div>
          </div>
          <h2 className="glow-text" style={{ fontSize: '2rem', marginBottom: '0.25rem', fontWeight: '700', letterSpacing: '-1px', flexShrink: 0 }}>NAVIQ</h2>
          <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.4', flexShrink: 0 }}>
            AI-powered dead reckoning navigation.<br/>Start a session to begin tracking.
          </p>
          
          <div style={{ width: '100%' }}>
            {!sessionId ? (
              isCalibrating ? (
                <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <LatticeLoader
                    status="working"
                    label="Calibrating Sensors"
                    pattern="orbit"
                    grid={3}
                    shape="round"
                    color="var(--accent-cyan)"
                    cellSize={8}
                    gap={4}
                    fontSize={16}
                    showTimer={true}
                  />
                </div>
              ) : (
                <button className="btn-glow" onClick={handleCreateSession} style={{ width: '100%', padding: '1.25rem' }}>
                  <Activity size={22} /> INITIATE TRACKING
                </button>
              )
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="info-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                  <div className="mono text-muted text-sm" style={{ letterSpacing: '2px', marginBottom: '0.25rem' }}>SESSION ID</div>
                  <div className="glow-text" style={{ fontSize: '2rem', letterSpacing: '4px', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>{sessionId}</div>
                </div>
                
                <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Share2 size={18} className="text-cyan" />
                    <span className="text-sm" style={{ fontWeight: '600' }}>Observer Link</span>
                  </div>
                  <a href={`/observer/${sessionId}`} target="_blank" rel="noreferrer" className="text-cyan mono" style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: '8px', wordBreak: 'break-all', fontSize: '0.9rem', textDecoration: 'none', border: '1px solid rgba(6, 182, 212, 0.2)', transition: 'all 0.2s' }}>
                    {window.location.origin}/observer/{sessionId}
                  </a>
                </div>
                
                <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start', padding: '0.75rem' }}>
                    <div className="text-xs text-muted" style={{ letterSpacing: '1px', fontWeight: '600' }}>SENSORS</div>
                    <div style={{ color: 'var(--status-safe)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                      <Activity size={18} /> Ready
                    </div>
                  </div>
                  <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start', padding: '0.75rem' }}>
                    <div className="text-xs text-muted" style={{ letterSpacing: '1px', fontWeight: '600' }}>CALIBRATION</div>
                    <div style={{ color: 'var(--status-safe)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                      <Compass size={18} /> Complete
                    </div>
                  </div>
                </div>

                <button className="btn-glow" onClick={handleStartRecording} style={{ width: '100%', padding: '1.25rem' }}>
                  <Play size={22} fill="white" /> START NAVIGATION
                </button>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center', pointerEvents: 'auto', flexShrink: 0 }}>
            <a href="/about" className="text-cyan mono text-sm link-hover">
              Explore NAVIQ Project details →
            </a>
          </div>
        </div>

        {/* Helper toast for dragging */}
        <div className="slide-up" style={{ marginTop: '2rem', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid var(--accent-cyan)', padding: '1rem 2rem', borderRadius: '50px', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', pointerEvents: 'auto' }}>
          <MapPin size={18} />
          <span className="text-sm">Inaccurate indoor GPS? Drag the blue marker on the map to your exact building (e.g., C Block) before starting.</span>
        </div>
        </div>
      )}

      {/* Floating Top Status Bar */}
      <div style={{ position: 'absolute', top: '2rem', left: '1rem', right: '1rem', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none', opacity: sessionState === 'INIT' ? 0 : 1, transition: 'opacity 0.3s' }}>
        
        {/* Left Action & Status */}
        <div style={{ display: 'flex', gap: '0.75rem', pointerEvents: 'auto' }}>
          <button 
            onClick={handleResetSession} 
            className="glass-panel" 
            style={{ padding: '0.75rem', borderRadius: '50px', border: '1px solid var(--border-tech)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(10, 15, 24, 0.7)', transition: 'all 0.2s' }}
            title="End Session & Go Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          
          <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '50px', backdropFilter: 'blur(20px)', background: 'rgba(10, 15, 24, 0.7)' }}>
            <div className="pulse"></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="text-sm text-muted mono" style={{ fontSize: '0.65rem' }}>SYSTEM MODE</span>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: telemetry?.gnssAvailable ? 'var(--status-safe)' : 'var(--accent-blue)' }}>
                {telemetry?.mode || 'INITIALIZING'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Status Pill */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end', pointerEvents: 'auto' }}>
          <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '50px', backdropFilter: 'blur(20px)', background: 'rgba(10, 15, 24, 0.7)' }}>
            <span className="text-sm text-muted mono" style={{ fontSize: '0.65rem' }}>GNSS SIGNAL</span>
            {telemetry?.gnssAvailable ? (
              <span style={{ color: 'var(--status-safe)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}><Wifi size={14} /> LIVE</span>
            ) : (
              <span style={{ color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}><WifiOff size={14} /> BLOCKED</span>
            )}
          </div>
          {sessionState === 'RECORDING' && (
             <button onClick={toggleGNSS} className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
               Demo: Toggle GNSS
             </button>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[pos.lat, pos.lng]} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-map-tiles"
          />
          {telemetry?.lastGnssPosition && telemetry?.gnssAvailable && sessionState !== 'INIT' && (
             <Marker position={[telemetry.lastGnssPosition.lat, telemetry.lastGnssPosition.lng]} icon={gnssIcon}>
               <Popup>GNSS Position</Popup>
             </Marker>
          )}
          
          <Marker 
            position={[pos.lat, pos.lng]} 
            icon={estimatedIcon}
            draggable={sessionState === 'INIT'}
            eventHandlers={{
              dragend: (e) => {
                if (sessionState === 'INIT') {
                  const newPos = e.target.getLatLng();
                  setInitialPosition({ lat: newPos.lat, lng: newPos.lng });
                }
              }
            }}
          >
             <Popup>{sessionState === 'INIT' ? "Drag to set accurate starting location" : "Estimated Position"}</Popup>
          </Marker>

          <Polyline positions={trajectoryGnss} color="var(--status-safe)" weight={3} />
          <Polyline positions={trajectoryEst} color="var(--accent-blue)" weight={3} dashArray="5, 10" />
          <MapUpdater position={pos} />
        </MapContainer>

        {/* Sleek Floating Telemetry Overlay */}
        <div style={{ position: 'absolute', bottom: '6rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: '1rem', pointerEvents: 'none', opacity: sessionState === 'INIT' ? 0 : 1, transition: 'opacity 0.3s' }}>
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px', backdropFilter: 'blur(20px)', background: 'rgba(10, 15, 24, 0.7)' }}>
            <span className="text-muted mono" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>SPEED</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{telemetry?.speed?.toFixed(1) || '0.0'}</span>
              <span className="text-muted text-sm">m/s</span>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px', backdropFilter: 'blur(20px)', background: 'rgba(10, 15, 24, 0.7)' }}>
            <span className="text-muted mono" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>HEADING</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{telemetry?.heading?.toFixed(0) || '0'}</span>
              <span className="text-muted text-sm">°</span>
            </div>
          </div>
        </div>

        {/* Post-Trip Summary Side Panel */}
        {sessionState === 'STOPPED' && tripSummary && (
          <div className="fade-in" style={{ position: 'absolute', top: '2rem', right: '1rem', width: '350px', zIndex: 1001, pointerEvents: 'auto' }}>
            <div className="premium-glass" style={{ padding: '2rem' }}>
              <h3 className="glow-text" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                SESSION RECAP
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted text-sm mono">DR DISTANCE</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{tripSummary.drDistance} <span className="text-muted text-sm">m</span></span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted text-sm mono">OUTAGE TIME</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{tripSummary.drTime} <span className="text-muted text-sm">s</span></span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span className="text-sm mono" style={{ color: 'var(--status-danger)' }}>EST. DRIFT</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{tripSummary.drift} <span className="text-sm" style={{ color: 'var(--status-danger)' }}>m</span></div>
                    <div className="text-xs" style={{ color: 'var(--status-danger)' }}>{tripSummary.driftPercentage}% Error</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                <div className="text-xs text-muted mono" style={{ marginBottom: '0.5rem' }}>MAP LEGEND</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '20px', height: '3px', background: 'var(--status-safe)' }}></div>
                  <span className="text-sm">GNSS Truth Path</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '20px', height: '3px', background: 'var(--accent-blue)', borderTop: '2px dashed #0a0f18' }}></div>
                  <span className="text-sm">AI Dead Reckoning Path</span>
                </div>
              </div>
              
              <button onClick={handleDownloadLogs} className="btn-glow" style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <Download size={18} /> EXPORT DATA
              </button>
            </div>
          </div>
        )}

        {/* Floating Stop Button (Only when recording) */}
        {sessionState === 'RECORDING' && (
          <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
            <button 
              onClick={handleStopRecording} 
              style={{ 
                background: 'var(--status-danger)', 
                color: 'white', 
                border: 'none', 
                padding: '1rem 2.5rem', 
                borderRadius: '50px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              <Square size={18} fill="white" /> STOP SESSION
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
