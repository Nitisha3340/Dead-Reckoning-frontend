import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import DriverApp from './DriverApp';
import ObserverDashboard from './ObserverDashboard';
import LoginPage from './LoginPage';
import './index.css';
import 'leaflet/dist/leaflet.css';

function App() {
  // Initialize state from localStorage so it persists after refresh
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('naviq_auth') === 'true'
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('naviq_auth', 'true');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/" element={isAuthenticated ? <DriverApp /> : <Navigate to="/login" />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/observer/:sessionId" element={<ObserverDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
