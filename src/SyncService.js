// SyncService.js
// This is a modular realtime communication layer.
// Currently uses BroadcastChannel for cross-tab testing (Driver <-> Observer on same device/browser).
// To connect to a real backend, implement WebSocket, Supabase Realtime, or Firebase here.

export class SyncService {
  constructor(sessionId, role) {
    this.sessionId = sessionId;
    this.role = role; // 'driver' or 'observer'
    
    // In a real app, use environment variables to configure WebSocket/backend URLs
    // const backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    this.channel = new BroadcastChannel(`tracking_session_${sessionId}`);
    this.listeners = [];
    
    this.channel.onmessage = (event) => {
      if (event.data && this.listeners) {
        this.listeners.forEach(listener => listener(event.data));
      }
    };
  }

  // Driver sends updates
  sendUpdate(data) {
    if (this.role === 'driver') {
      this.channel.postMessage({
        type: 'update',
        timestamp: Date.now(),
        data
      });
    }
  }
  
  // Driver signals session start
  startSession(initialData) {
    if (this.role === 'driver') {
      this.channel.postMessage({
        type: 'start',
        timestamp: Date.now(),
        data: initialData
      });
    }
  }

  // Driver signals session end
  endSession() {
    if (this.role === 'driver') {
      this.channel.postMessage({
        type: 'end',
        timestamp: Date.now()
      });
    }
  }

  // Observer listens for updates
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    this.channel.close();
    this.listeners = [];
  }
}
