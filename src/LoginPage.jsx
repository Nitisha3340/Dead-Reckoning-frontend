import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ChevronRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './index.css';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple mock authentication for prototype
    // In production, this would call your backend API
    if (username.length > 2 && password.length > 2) {
      onLogin();
      navigate('/');
    } else {
      setError('Invalid credentials. Please enter a valid ID and Key.');
    }
  };

  return (
    <div className="animated-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="premium-glass slide-up" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: '700', letterSpacing: '-1px' }}>NAVIQ</h2>
          <p className="text-muted" style={{ fontSize: '1rem' }}>Secure Driver Authentication</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && (
            <div className="fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--status-danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="text-muted text-sm mono" style={{ letterSpacing: '1px' }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="commander@agency.gov"
                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontSize: '1rem' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="text-muted text-sm mono" style={{ letterSpacing: '1px' }}>SECURE PASSWORD</label>
              <span className="text-xs" style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }}>Forgot?</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white', outline: 'none', transition: 'border-color 0.2s', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace" }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          </div>

          <button type="submit" className="btn-glow" style={{ width: '100%', padding: '1.25rem', marginTop: '1rem' }}>
            AUTHENTICATE <ChevronRight size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ margin: '0 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                console.log("Google Auth Success!", credentialResponse);
                // In production, you would send this token to your backend
                onLogin();
                navigate('/');
              }}
              onError={() => {
                console.error('Google Login Failed');
                setError('Google authentication failed. Please try again.');
              }}
              theme="filled_black"
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </div>
        </form>
      </div>
      
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p className="text-muted text-sm">Need access? Contact central command.</p>
      </div>
    </div>
  );
}
