// LandingPage.jsx - Complete landing page with navigation
import React, { useState, useEffect } from 'react';
import HeroSection from '../components/landing/HeroSection';
import LoginSection from '../components/landing/LoginSection';
import DashboardPage from './DashboardPage';
import TeamPage from './TeamPage';
import { signIn, signUp, getCurrentUser } from '../services/authService';
import PlayerPage from './PlayerPage';
import AuctionSetupPage from './AuctionSetupPage';
import CaptainPage from './CaptainPage';
import LiveAuctionPage from './LiveAuctionPage';
import ReportsPage from './ReportsPage';
import './LandingPage.css';

const LandingPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [checkingSession, setCheckingSession] = useState(true); // NEW: loading check

  // NEW: Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const result = await getCurrentUser();
      if (result.success && result.user) {
        setUsername(result.user?.email || '');
        setIsLoggedIn(true);
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const handleLogin = async (userEmail, password, isRegister) => {
    let result;
    
    if (isRegister) {
      result = await signUp(userEmail, password, userEmail.split('@')[0]);
    } else {
      result = await signIn(userEmail, password);
    }

    if (result.success) {
      setUsername(userEmail);
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
    } else {
      alert('❌ ' + (isRegister ? 'Registration' : 'Login') + ' failed: ' + result.error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setCurrentPage('dashboard');
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  // NEW: Show loading while checking session
  if (checkingSession) {
    return (
      <div className="landing-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0e1a' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', color: '#ffd700' }}>🏸 LBPL</h1>
            <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show landing page if not logged in
  if (!isLoggedIn) {
    return (
      <div className="landing-page">
        <HeroSection />
        <LoginSection onLogin={handleLogin} />
        <footer className="landing-footer">
          <div className="footer-content">
            <h3>🏸 How the Auction Works</h3>
            <div className="footer-grid">
              <div className="footer-item">
                <span className="footer-icon">💰</span>
                <p>Each team gets ₹1,00,000 budget</p>
              </div>
              <div className="footer-item">
                <span className="footer-icon">👥</span>
                <p>Minimum 6 players per team</p>
              </div>
              <div className="footer-item">
                <span className="footer-icon">🔨</span>
                <p>Bidding increments as per category</p>
              </div>
              <div className="footer-item">
                <span className="footer-icon">🏆</span>
                <p>Build your dream team!</p>
              </div>
            </div>
            <p className="footer-credit">© 2026 Lourdes Badminton Premier League - Season 1</p>
          </div>
        </footer>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'teams':
        return <TeamPage onBack={handleBackToDashboard} />;
      case 'players':
        return <PlayerPage onBack={handleBackToDashboard} />;
      case 'auction-setup':
        return <AuctionSetupPage onBack={handleBackToDashboard} />;
      case 'captains':
        return <CaptainPage onBack={handleBackToDashboard} />;
      case 'live-auction':
        return <LiveAuctionPage onBack={handleBackToDashboard} />;
      case 'reports':
        return <ReportsPage onBack={handleBackToDashboard} />;
      case 'dashboard':
      default:
        return (
          <DashboardPage 
            username={username} 
            onLogout={handleLogout}
            onNavigate={handleNavigation}
          />
        );
    }
  };

  return renderPage();
};

export default LandingPage;
