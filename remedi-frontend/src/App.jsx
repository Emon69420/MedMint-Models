import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Research from "./Research";

// Header Component
const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-brand">
          <span className="logo"> reMedi</span>
        </div>
        

        
        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => window.scrollTo({ top: document.getElementById('features').offsetTop, behavior: 'smooth' })}>See Features</button>
          <button className="btn-primary">Use Now</button>
        </div>
        
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
};

// Hero Section Component
const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const navigate = useNavigate();
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="hero">
      <div className="hero-bg">
        <div 
          className="hero-gradient"
          style={{
            transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`
          }}
        ></div>
      </div>
      
      <div className="container hero-content">
        <h1 className="hero-title">
          Your toolkit for<br />
          <span className="gradient-text">drug discovery automation</span>
        </h1>
        
        <p className="hero-description">
          reMedi accelerates pharmaceutical research with AI-powered<br />
          molecular analysis and interactive drug design workflows.
        </p>
        
        <div className="hero-actions" >

          <button className="btn-primary btn-large" onClick={() => navigate("/research")}>Start Researching Now</button>

          <button className="btn-ghost" onClick={() => window.scrollTo({ top: document.getElementById('features').offsetTop, behavior: 'smooth' })}>
            See Features
            <span className="arrow">↓</span>
          </button>
        </div>
      </div>
      
      <div className="hero-dashboard">
        <DashboardPreview />
      </div>
    </section>
  );
};

// Dashboard Preview Component
const DashboardPreview = () => {
  const [activePhase, setActivePhase] = useState(0);
  const [molecules, setMolecules] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhase(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newMolecules = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 300,
      y: Math.random() * 150,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 4 + 2,
      type: Math.random() > 0.5 ? 'protein' : 'compound'
    }));
    setMolecules(newMolecules);

    const animationInterval = setInterval(() => {
      setMolecules(prev => prev.map(mol => ({
        ...mol,
        x: (mol.x + mol.vx + 300) % 300,
        y: (mol.y + mol.vy + 150) % 150
      })));
    }, 50);

    return () => clearInterval(animationInterval);
  }, []);

  const phases = [
    { name: "TamGen", progress: 35, color: "#8B5CF6" },
    { name: "Fairseq", progress: 5, color: "#06B6D4" },
    { name: "chemBERTa", progress: 30, color: "#10B981" },
    { name: "DeepPurpose", progress: 30, color: "#F59E0B" }
  ];

  return (
    <div className="dashboard-preview">
      <div className="dashboard-window">
        <div className="dashboard-header">
          <div className="window-controls">
            <span className="control red"></span>
            <span className="control yellow"></span>
            <span className="control green"></span>
          </div>
        </div>
        
        <div className="dashboard-content">
          <div className="drug-discovery-container">
            <h3>Behind The Scenes</h3>
            
            <div className="molecular-canvas">
              <svg viewBox="0 0 300 150" className="molecules-svg">
                <defs>
                  <radialGradient id="proteinGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
                  </radialGradient>
                  <radialGradient id="compoundGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
                  </radialGradient>
                </defs>
                
                {molecules.map(mol => (
                  <g key={mol.id}>
                    <circle
                      cx={mol.x}
                      cy={mol.y}
                      r={mol.size}
                      fill={mol.type === 'protein' ? 'url(#proteinGradient)' : 'url(#compoundGradient)'}
                      className="molecule"
                    />
                    {mol.type === 'protein' && (
                      <circle
                        cx={mol.x}
                        cy={mol.y}
                        r={mol.size * 1.5}
                        fill="none"
                        stroke={mol.type === 'protein' ? '#8B5CF6' : '#06B6D4'}
                        strokeWidth="0.5"
                        strokeOpacity="0.3"
                        className="molecule-ring"
                      />
                    )}
                  </g>
                ))}
                
                {/* Connection lines between nearby molecules */}
                {molecules.map((mol1, i) => 
                  molecules.slice(i + 1).map((mol2, j) => {
                    const distance = Math.sqrt((mol1.x - mol2.x) ** 2 + (mol1.y - mol2.y) ** 2);
                    return distance < 40 ? (
                      <line
                        key={`${i}-${j}`}
                        x1={mol1.x}
                        y1={mol1.y}
                        x2={mol2.x}
                        y2={mol2.y}
                        stroke="rgba(139, 92, 246, 0.2)"
                        strokeWidth="1"
                        className="molecular-bond"
                      />
                    ) : null;
                  })
                )}
              </svg>
              
              <div className="canvas-overlay">
                <div className="discovery-metrics">
                  <div className="metric">
                    <span className="metric-value">13</span>
                    <span className="metric-label">Interaction Types</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">3.66 billion</span>
                    <span className="metric-label">Edges For Types</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pipeline-phases">
              {phases.map((phase, index) => (
                <div key={index} className={`phase-item ${index === activePhase ? 'active' : ''}`}>
                  <div className="phase-header">
                    <span className="phase-name">{phase.name}</span>
                    <span className="phase-progress">{phase.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${phase.progress}%`,
                        backgroundColor: phase.color,
                        animation: index === activePhase ? 'progressGlow 2s ease-in-out infinite alternate' : 'none'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="user-info">
            <div className="user-avatar">
              <div className="scientist-avatar">🧬</div>
            </div>
            <span className="user-name">Stanford <br></br>Biomedical <br></br>Research Dataset</span>
            <span className="user-role"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Features Section Component
const FeaturesSection = () => {
  const features = [
    {
      icon: "🧬",
      title: "Protein Structure Decoder",
      description: "Enter a PDB ID to visualize and explore the amino acid sequence of any known protein."
    },
    {
      icon: "🔬",
      title: "Drug Generation Model",
      description: "Generate compounds for proteins that are validated and docked on target protein using AutoBox before final result."
    },
    {
      icon: "💊",
      title: "Binding Affinity Prediction",
      description: "Input a drug and a target protein to predict how strongly they bind—crucial for understanding drug effectiveness."
    },
    {
      icon: "🕸️",
      title: "Natural Language Queries",
      description: `Just type your question (e.g., "Which drugs bind to protein X?"), and our system will fetch results using Perplexity Sonar API.`
    }
  ];

  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <h2>Drug Discovery Features</h2>
          <p>Everything basic thing you need to research, discover and repurpose medicinal drugs</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Stats Section Component
const StatsSection = () => {
  const [counters, setCounters] = useState([0, 0, 0, 0]);
  const targets = [120.0, 3.6, 13, 6];
  const labels = ["Compounds Trained On", "Graph Edges", "Interaction Types", "Avg Generation Time"];
  const suffixes = ["M", "B", "", "Mins"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCounters(prev => prev.map((count, index) => {
        const target = targets[index];
        const increment = target / 100;
        return count < target ? Math.min(count + increment, target) : target;
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="stats">
      <div className="container">
        <div className="stats-grid">
          {counters.map((count, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">
                {Math.floor(count)}{suffixes[index]}
              </div>
              <div className="stat-label">{labels[index]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo">reMedi</span>
            <p>Building the future of AI in Biomedical Research</p>
          </div>
          

        </div>
        
        <div className="footer-bottom">
          <p> reMedi, Built For Perplexity Hackathon</p>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
const App = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <main>
              <HeroSection />
              <FeaturesSection />
              <StatsSection />
            </main>
            <Footer />
          </>
        } />
        <Route path="/research" element={<Research />} />
      </Routes>
      
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0a0a0a;
          color: white;
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* Header Styles */
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .header.scrolled {
          background: rgba(10, 10, 10, 0.95);
          border-bottom-color: rgba(255, 255, 255, 0.2);
        }

        .header .container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .logo {
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .nav {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .nav-link:hover {
          color: white;
        }

        .nav-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .btn-primary {
          background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }

        .btn-large {
          padding: 16px 32px;
          font-size: 16px;
          border-radius: 12px;
        }

        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .arrow {
          transition: transform 0.3s ease;
        }

        .btn-ghost:hover .arrow {
          transform: translateX(4px);
        }

        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .mobile-menu-btn span {
          width: 24px;
          height: 2px;
          background: white;
          transition: all 0.3s ease;
        }

        /* Hero Styles */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 70px;
          overflow: hidden;
          margin-top: 50px;
          margin-bottom:50px;
        }

        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
        }

        .hero-gradient {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 0deg, #8B5CF6, #06B6D4, #10B981, #8B5CF6);
          opacity: 0.1;
          animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero-content {
          text-align: center;
          z-index: 2;
          max-width: 800px;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 24px;
          animation: fadeInUp 1s ease 0.2s both;
        }

        .gradient-text {
          background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 48px;
          line-height: 1.6;
          animation: fadeInUp 1s ease 0.4s both;
        }

        .hero-actions {
          display: flex;
          gap: 24px;
          justify-content: center;
          margin-bottom: 80px;
          animation: fadeInUp 1s ease 0.6s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Dashboard Preview Styles */
        .hero-dashboard {
          z-index: 2;
          animation: fadeInUp 1s ease 0.8s both;
        }

        .dashboard-preview {
          max-width: 800px;
          margin: 0 auto;
        }

        .dashboard-window {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          margin-bottom: 50px;
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .window-controls {
          display: flex;
          gap: 8px;
        }

        .control {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .control.red { background: #FF5F57; }
        .control.yellow { background: #FFBD2E; }
        .control.green { background: #28CA42; }

        .dashboard-content {
          padding: 32px;
          position: relative;
        }

        .drug-discovery-container h3 {
          font-size: 18px;
          margin-bottom: 24px;
          color: rgba(255, 255, 255, 0.9);
          text-align: left;
          padding-left: 16px;
        }

        .molecular-canvas {
          position: relative;
          height: 200px;
          margin-bottom: 24px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          overflow: hidden;
        }

        .molecules-svg {
          width: 100%;
          height: 100%;
        }

        .molecule {
          animation: float 3s ease-in-out infinite;
        }

        .molecule:nth-child(even) {
          animation-delay: -1.5s;
        }

        .molecule-ring {
          animation: pulse 2s ease-in-out infinite;
        }

        .molecular-bond {
          animation: fadeInOut 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }

        @keyframes pulse {
          0%, 100% { stroke-opacity: 0.3; transform: scale(1); }
          50% { stroke-opacity: 0.6; transform: scale(1.1); }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }

        .canvas-overlay {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .discovery-metrics {
          display: flex;
          gap: 24px;
        }

        .metric {
          text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #06B6D4;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .pipeline-phases {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .phase-item {
          opacity: 0.6;
          transition: all 0.3s ease;
        }

        .phase-item.active {
          opacity: 1;
          transform: scale(1.02);
        }

        .phase-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .phase-name {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }

        .phase-progress {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
        }

        .progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.8s ease;
        }

        @keyframes progressGlow {
          0% { box-shadow: 0 0 5px currentColor; }
          100% { box-shadow: 0 0 15px currentColor; }
        }

        .user-info {
          position: absolute;
          top: 32px;
          right: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 16px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .scientist-avatar {
          font-size: 24px;
          animation: rotate 4s linear infinite;
        }

        .user-name {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
        }

        .user-role {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Features Section */
        .features {
          padding: 120px 0;
          background: linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.02) 100%);
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .section-header p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.7);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s ease;
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 20px 40px rgba(139, 92, 246, 0.1);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 24px;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .feature-card p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        /* Stats Section */
        .stats {
          padding: 80px 0;
          background: rgba(255, 255, 255, 0.02);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 48px;
          text-align: center;
        }

        .stat-item {
          animation: fadeInUp 0.6s ease forwards;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        /* Footer */
        .footer {
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 80px 0 32px;
        }

        .footer-content {
          align-items: center;
          justify-content: center;
          margin-bottom: 48px;
          text-align: center;
        }

        .footer-brand p {
          color: rgba(255, 255, 255, 0.7);
          margin-top: 16px;
          line-height: 1.6;
          text-align: center;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .nav {
            display: none;
          }

          .nav.nav-open {
            display: flex;
            position: absolute;
            top: 70px;
            left: 0;
            right: 0;
            flex-direction: column;
            background: rgba(10, 10, 10, 0.95);
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .mobile-menu-btn {
            display: flex;
          }

          .hero-actions {
            flex-direction: column;
            align-items: center;
          }

          .hero-actions .btn-primary,
          .hero-actions .btn-ghost {
            width: 100%;
            max-width: 300px;
          }

          .dashboard-content {
            padding: 20px;
          }

          .user-info {
            position: static;
            margin-top: 20px;
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 32px;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .footer-links {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-number {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default App;