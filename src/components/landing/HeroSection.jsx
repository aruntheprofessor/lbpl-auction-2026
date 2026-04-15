// HeroSection.jsx - Landing page with badminton court background
import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <div className="hero-container">
      {/* Background Image Overlay */}
      <div className="overlay"></div>
      
      {/* Glass Content */}
      <div className="hero-content">
        <h1 className="glass-title">🏸 LBPL</h1>
        <h2 className="glass-subtitle">Lourdes Badminton Premier League</h2>
        <div className="season-badge">Season 1 • 2026</div>
        <p className="tagline">Where Champions Are Made</p>
      </div>
    </div>
  );
};

export default HeroSection;