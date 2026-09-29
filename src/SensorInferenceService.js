// SensorInferenceService.js
// -----------------------------------------------------------------------------
// Mobile Platform Wrapper
// Collects data from smartphone browser APIs (devicemotion, geolocation)
// and feeds it to the EdgeInferenceEngine for processing.
// -----------------------------------------------------------------------------

import { EdgeInferenceEngine } from './EdgeInferenceEngine';

export class SensorInferenceService {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.engine = new EdgeInferenceEngine({ updateRateMs: 100 }); // 10Hz
    this.isRecording = false;
    this.sessionData = [];
    this.currentSessionId = null;
  }

  startSession(sessionId, initialPosition) {
    this.currentSessionId = sessionId;
    this.isRecording = true;
    this.sessionData = [];
    this.initialPosition = initialPosition || { lat: 28.6139, lng: 77.2090 };
    if (!initialPosition) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.latitude && data.longitude) {
            this.initialPosition = { lat: data.latitude, lng: data.longitude };
          }
        }).catch(() => {});
    }
    this.gnssOffset = null; // Used to shift inaccurate indoor GPS to match manual calibration

    // Fallback to demo coordinates after 15 seconds if no GPS (e.g. on Desktop)
    this.fallbackTimer = setTimeout(() => {
      if (!this.engine.estimatedPosition) {
        console.warn("GNSS timeout: Injecting mock coordinates and simulating drive for demo.");
        let simLat = this.initialPosition.lat;
        let simLng = this.initialPosition.lng;
        
        // Simulate continuous GPS movement
        this.demoInterval = setInterval(() => {
          if (!this.isRecording) return;
          // Move roughly 15m/s at 45 degrees
          simLat += 0.00001; 
          simLng += 0.00001;
          
          // Only feed mock GNSS if we haven't manually toggled it off for the demo
          if (this.engine.gnssAvailable || this.engine.mode === 'IDLE') {
             this.handleGnssUpdate({
               coords: { latitude: simLat, longitude: simLng, speed: 15, heading: 45, accuracy: 5 },
               timestamp: Date.now()
             });
          }
        }, 1000);
      }
    }, 15000);

    // Emit initial state immediately
    this.onUpdate({ ...this.engine.getState(), timestamp: Date.now() });

    if (navigator.geolocation) {
      this.geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
           console.log("SensorInferenceService got real GNSS:", pos.coords);
           this.handleGnssUpdate(pos);
        },
        (err) => {
           console.warn("SensorInferenceService GPS error:", err.message, err.code);
           this.handleGnssError(err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    }
    
    this.handleMotion = (e) => this.processImu(e);
    window.addEventListener('devicemotion', this.handleMotion);

    // Run inference loop (10Hz Mobile Benchmark)
    this.inferenceInterval = setInterval(() => {
      if (!this.isRecording) return;
      const state = this.engine.computeNextPosition();
      if (state) {
        this.sessionData.push({
          timestamp: Date.now(),
          type: 'inference',
          ...state
        });
        this.onUpdate({ ...state, timestamp: Date.now() });
      }
    }, 100);
  }

  stopSession() {
    this.isRecording = false;
    if (this.geoWatchId) navigator.geolocation.clearWatch(this.geoWatchId);
    if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
    if (this.demoInterval) clearInterval(this.demoInterval);
    window.removeEventListener('devicemotion', this.handleMotion);
    clearInterval(this.inferenceInterval);
    return this.sessionData;
  }

  toggleGnss() {
    if (this.engine.gnssAvailable) {
      this.engine.reportGNSSLoss();
    } else {
      // Simulate GNSS recovery
      const currentPos = this.engine.estimatedPosition || this.initialPosition || { lat: 28.6139, lng: 77.2090 };
      this.engine.updateGNSS({
        ...currentPos,
        speed: this.engine.speed,
        heading: this.engine.heading
      });
    }
    this.onUpdate({ ...this.engine.getState(), timestamp: Date.now() });
  }

  handleGnssUpdate(pos) {
    // If the user manually dragged the start marker to calibrate, we need to shift all incoming 
    // inaccurate GNSS coordinates by the offset difference to maintain relative tracking accuracy.
    if (!this.gnssOffset) {
      this.gnssOffset = {
        lat: this.initialPosition.lat - pos.coords.latitude,
        lng: this.initialPosition.lng - pos.coords.longitude
      };
    }

    this.engine.updateGNSS({
      lat: pos.coords.latitude + this.gnssOffset.lat,
      lng: pos.coords.longitude + this.gnssOffset.lng,
      speed: pos.coords.speed || 0,
      heading: pos.coords.heading || 0,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp
    });
    this.onUpdate({ ...this.engine.getState(), timestamp: Date.now() });
  }

  handleGnssError(err) {
    console.warn("GNSS Error", err);
    if (this.engine.gnssAvailable && err.code === err.TIMEOUT) {
      this.engine.reportGNSSLoss();
    }
  }

  processImu(event) {
    if (!this.isRecording) return;
    const accel = event.acceleration || event.accelerationIncludingGravity || {};
    const gyro = event.rotationRate || {};
    
    // In-Vehicle Alignment & Calibration would happen here before passing to engine
    // to map smartphone frame to vehicle frame.

    this.engine.processIMU(
      { x: accel.x||0, y: accel.y||0, z: accel.z||0 },
      { x: gyro.alpha||0, y: gyro.beta||0, z: gyro.gamma||0.1 }, // demo: small gyro z to curve
      {} // mag
    );
  }
}
