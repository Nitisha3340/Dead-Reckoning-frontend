import { useNavigate } from 'react-router-dom';
import { Activity, Smartphone, MapPin } from 'lucide-react';
import OrbitImages from './OrbitImages';
import Radar from './Radar';
import CardSwap, { Card } from './CardSwap';
import SplitText from './SplitText';
import './index.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      
      {/* --- HERO SECTION --- */}
      <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Dynamic Animated Background - Always Visible */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <div className="animated-bg" style={{ position: 'absolute', inset: 0 }}></div>
        <div className="hero-grid"></div>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, var(--bg-dark) 80%)' }}></div>
      </div>

      {/* Intro Animation Overlay */}
      <div className="intro-overlay" style={{ background: 'transparent' }}>
        
        {/* Pulsing ring behind phone */}
        <div className="intro-pulse-ring" style={{ position: 'absolute', top: '85%', left: '50%', transform: 'translate(-50%, -50%)' }}></div>
        
        <div className="intro-phone">
          <Smartphone size={56} color="var(--accent-cyan)" fill="rgba(6, 182, 212, 0.2)" strokeWidth={1.5} />
        </div>
        
        <svg className="intro-svg-container" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {/* Techy city-block path */}
          <path 
            className="intro-path" 
            d="M 500 850 L 500 700 L 300 700 L 300 500 L 700 500 L 700 250 L 500 250 L 500 150" 
          />
        </svg>

        {/* Pins at exact intersections */}
        <div className="intro-pin intro-pin-1" style={{ top: '50%', left: '30%' }}>
          <div className="intro-pulse-ring-small"></div>
          <MapPin size={36} color="var(--status-danger)" fill="rgba(239, 68, 68, 0.2)" strokeWidth={1.5} />
        </div>
        <div className="intro-pin intro-pin-2" style={{ top: '25%', left: '70%' }}>
          <div className="intro-pulse-ring-small"></div>
          <MapPin size={36} color="var(--status-danger)" fill="rgba(239, 68, 68, 0.2)" strokeWidth={1.5} />
        </div>
      </div>

      <div className="hero-content-delayed" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Navigation Bar */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', paddingTop: '1.5rem' }}>
        <div className="premium-glass fade-in" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '0.75rem 1.5rem', borderRadius: '1rem', background: 'rgba(17, 24, 39, 0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 256 256" fill="var(--accent-cyan)">
              <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z" opacity="0.8" />
              <path d="M 256 128 L 128 128 L 0 0 L 128 0 Z" />
            </svg>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>NAVIQ</span>
          </div>
          
          {/* Hide on very small screens, normally handled by media queries. Inline here for demo */}
          <div style={{ display: 'flex', gap: '1.5rem' }} className="nav-links">
            <a href="#features" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Features</a>
            <a href="#tech" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Tech Specs</a>
            <a href="/login" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Observer Portal</a>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <main style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '0 1rem', textAlign: 'center' }}>

        {/* Heading */}
        <h1 className="slide-up" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: '0.95', letterSpacing: '-0.02em', color: 'white', maxWidth: '1000px', margin: '0' }}>
          Navigate flawlessly <br/>
          <span style={{ fontStyle: 'italic', color: 'var(--accent-cyan)' }}>even when GPS fails.</span>
        </h1>

        {/* Subtitle */}
        <p className="slide-up" style={{ marginTop: '1.5rem', maxWidth: '700px', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.7)', animationDelay: '0.1s' }}>
          Deploy AI-powered dead reckoning to 10x your tracking reliability. Seamlessly fuse smartphone IMU data with kinematic constraints to guarantee position accuracy in tunnels and urban canyons.
        </p>

        {/* CTA Button */}
        <div className="slide-up" style={{ marginTop: '2rem', animationDelay: '0.2s' }}>
          <button 
            onClick={() => navigate('/login')} 
            className="btn-glow" 
            style={{ padding: '1rem 2.5rem', fontSize: '1rem', borderRadius: '1rem', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)' }}
          >
            Access Dashboard <Activity size={18} />
          </button>
        </div>

      </main>
      </div> {/* End hero-content-delayed */}
      </div> {/* End Hero Wrapper */}

      {/* --- FEATURES SECTION --- */}
      <section id="features" style={{ padding: '8rem 2rem', background: 'var(--bg-panel)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
          <div style={{ flex: '1 1 400px', paddingRight: '2rem' }}>
            <h2 className="glow-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1rem' }}>System Capabilities</h2>
            <p className="text-muted" style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Built for the hardest SIH challenges, NAVIQ operates where traditional systems fail. Our core technologies seamlessly adapt to maintain high-accuracy positioning.
            </p>
          </div>
          
          <div style={{ flex: '1 1 500px', height: '500px', position: 'relative', perspective: '1000px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CardSwap cardDistance={35} verticalDistance={40} delay={4000} width={340} height={380} skewAmount={4}>
              <Card customClass="premium-glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.2)' }}>
                  <Smartphone size={32} color="var(--accent-blue)" />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: 'white' }}>Edge AI Engine</h3>
                <p className="text-muted" style={{ lineHeight: '1.6' }}>Runs lightweight LSTM models directly on your smartphone to infer location using only the built-in accelerometer and gyroscope when GPS is lost.</p>
              </Card>

              <Card customClass="premium-glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.2)' }}>
                  <Activity size={32} color="var(--accent-cyan)" />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: 'white' }}>Smart Calibration</h3>
                <p className="text-muted" style={{ lineHeight: '1.6' }}>Align your phone instantly before driving using an intuitive, gamified graphic interface that perfectly syncs your device with the vehicle's heading.</p>
              </Card>
              
              <Card customClass="premium-glass" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.2)' }}>
                  <MapPin size={32} color="var(--status-danger)" />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: 'white' }}>Live Fleet Sync</h3>
                <p className="text-muted" style={{ lineHeight: '1.6' }}>The mobile app acts as an edge node, instantly beaming your AI-estimated trajectory back to the Central Observer dashboard for live monitoring.</p>
              </Card>
            </CardSwap>
          </div>
        </div>
      </section>

      {/* Orbit Section */}
      <section id="tech" style={{ position: 'relative', zIndex: 10, padding: '4rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Tech Grid Background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)', backgroundSize: '50px 50px', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, var(--bg-dark) 70%)', zIndex: 1 }} />
        
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1200px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem' }}>
          
          {/* Left Text Box */}
          <div style={{ flex: '1 1 400px', paddingRight: '2rem' }}>
            <SplitText
              text="Powered by Advanced Tech"
              className="glow-text"
              delay={50}
              duration={0.6}
              textAlign="left"
              from={{ opacity: 0, y: 30, rotationX: -90 }}
              to={{ opacity: 1, y: 0, rotationX: 0 }}
            />
            <p className="text-muted slide-up" style={{ marginTop: '1.5rem', fontSize: '1.2rem', lineHeight: '1.6', animationDelay: '1s' }}>
              Our AI Core runs entirely in the browser using Edge inference. We utilize a combination of Python models exported to ONNX, paired with real-time React visualization.
            </p>
          </div>

          {/* Right Orbit */}
          <div style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center', marginTop: '-60px', marginBottom: '-100px' }}>
            <OrbitImages
              images={[
                "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
                "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
                "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
                "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg",
                "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg"
              ]}
              shape="ellipse"
              radiusX={280}
              radiusY={100}
              rotation={-15}
              duration={40}
              itemSize={50}
              responsive={true}
              showPath={true}
              pathColor="rgba(6, 182, 212, 0.2)"
              pathWidth={2}
              centerContent={
                <div style={{
                  width: '120px', 
                  height: '120px', 
                  background: 'radial-gradient(circle, rgba(6,182,212,0.9) 0%, rgba(6,182,212,0.1) 70%, transparent 100%)', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 60px rgba(6,182,212,0.6)',
                  border: '1px solid rgba(6, 182, 212, 0.4)'
                }}>
                  <span className="mono" style={{ color: 'white', fontWeight: 'bold', letterSpacing: '2px', fontSize: '1rem', textShadow: '0 0 10px rgba(255,255,255,0.8)' }}>AI CORE</span>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* Radar Section */}
      <section id="monitoring" style={{ position: 'relative', zIndex: 10, padding: '6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Real-Time Scanning</h3>
        <p className="text-muted" style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem' }}>
          Our AI continuously sweeps the environment, actively fusing IMU data to maintain a lock on your position when GNSS goes dark.
        </p>
        
        <div className="premium-glass" style={{ width: '90%', maxWidth: '800px', height: '400px', position: 'relative', borderRadius: '24px', overflow: 'hidden', padding: '1rem' }}>
          <Radar
            speed={1.0}
            scale={0.5}
            ringCount={10}
            spokeCount={10}
            ringThickness={0.05}
            spokeThickness={0.01}
            sweepSpeed={1.0}
            sweepWidth={2.0}
            sweepLobes={1}
            color="#06b6d4" // Set to our cyan accent color instead of purple
            backgroundColor="#000000"
            falloff={2.0}
            brightness={1.0}
            enableMouseInteraction={true}
            mouseInfluence={0.1}
          />
        </div>
      </section>

    </div>
  );
}
