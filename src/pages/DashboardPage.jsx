// DashboardPage.jsx - Admin dashboard with 6 main buttons
import React, { useState, useEffect } from 'react';
import { resetAuction, getAuctionSummary } from '../services/bidService';
import './DashboardPage.css';

const DashboardPage = ({ username, onLogout, onNavigate }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    budget: '₹1L',
    topCategory: 'A+'
  });

  // Load real stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get teams count
      const { getTeams } = await import('../services/teamService');
      const teamsResult = await getTeams();
      const teamsCount = teamsResult.success ? teamsResult.data.length : 0;

      // Get players count
      const { getPlayers } = await import('../services/playerService');
      const playersResult = await getPlayers();
      const playersCount = playersResult.success ? playersResult.data.length : 0;

      // Get budget
      const { getBudget } = await import('../services/auctionService');
      const budgetResult = await getBudget();
      const budget = budgetResult.success ? budgetResult.data.overall_budget : 100000;

      // Get top category
      const { getCategories } = await import('../services/auctionService');
      const catResult = await getCategories();
      const topCat = catResult.success && catResult.data.length > 0 
        ? catResult.data[0].category_name 
        : 'A+';

      setStats({
        teams: teamsCount,
        players: playersCount,
        budget: new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(budget).replace('₹', '₹'),
        topCategory: topCat
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleReset = async () => {
    if (showResetConfirm) {
      const confirmReset = window.confirm(
        '⚠️ FINAL WARNING!\n\n' +
        'This will reset ALL auction data:\n' +
        '✓ Team purses back to original budget\n' +
        '✓ All players marked as available\n' +
        '✓ Clear all bid history\n\n' +
        'Teams and players will NOT be deleted.\n\n' +
        'Are you ABSOLUTELY SURE?'
      );
      
      if (confirmReset) {
        setResetting(true);
        const result = await resetAuction();
        setResetting(false);
        
        if (result.success) {
          alert('✅ Auction data has been reset! Ready for fresh auction.');
          loadStats(); // Refresh stats
        } else {
          alert('❌ Failed to reset: ' + result.error);
        }
      }
      setShowResetConfirm(false);
    } else {
      const firstConfirm = window.confirm(
        '🔄 RESET AUCTION DATA?\n\n' +
        'This will:\n' +
        '✓ Reset team purses to original budget\n' +
        '✓ Mark all players as available\n' +
        '✓ Clear all bid history\n\n' +
        'Teams and players remain saved.\n\n' +
        'Click OK to proceed to final confirmation.'
      );
      
      if (firstConfirm) {
        setShowResetConfirm(true);
      }
    }
  };

  const menuButtons = [
    { id: 1, name: 'Team Registration', icon: '🏸', color: '#667eea', action: 'teams' },
    { id: 2, name: 'Player Registration', icon: '👤', color: '#f093fb', action: 'players' },
    { id: 3, name: 'Auction Setup', icon: '⚙️', color: '#4facfe', action: 'auction-setup' },
    { id: 4, name: 'Captain Assigning', icon: '🎯', color: '#43e97b', action: 'captains' },
    { id: 5, name: 'Start Auction', icon: '🎲', color: '#fa709a', action: 'start-auction' },
    { id: 6, name: 'View Reports', icon: '📊', color: '#f6d365', action: 'reports' },
  ];

  const handleMenuClick = (action) => {
    switch (action) {
      case 'teams':
        if (onNavigate) onNavigate('teams');
        break;
      case 'players':
        if (onNavigate) onNavigate('players');
        break;
      case 'auction-setup':
        if (onNavigate) onNavigate('auction-setup');
        break;
      case 'captains':
        if (onNavigate) onNavigate('captains');
        break;
      case 'start-auction':
        if (onNavigate) onNavigate('live-auction');
        break;
      case 'reports':
        if (onNavigate) onNavigate('reports');
        break;
      default:
        alert('Coming soon!');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏸 LBPL Dashboard</h1>
          <span className="season-tag">Season 1 • 2026</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {username}!</span>
          <button className="logout-btn" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {menuButtons.map((button) => (
          <div
            key={button.id}
            className="dashboard-card"
            onClick={() => handleMenuClick(button.action)}
            style={{ '--card-color': button.color }}
          >
            <span className="card-icon">{button.icon}</span>
            <h3 className="card-title">{button.name}</h3>
            <div className="card-shine"></div>
          </div>
        ))}
      </div>

      {/* Quick Stats - NOW DYNAMIC! */}
      <div className="quick-stats">
        <div className="stat-card">
          <span className="stat-icon">🏸</span>
          <div className="stat-info">
            <span className="stat-value">{stats.teams}</span>
            <span className="stat-label">Teams</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <span className="stat-value">{stats.players}</span>
            <span className="stat-label">Players</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-info">
            <span className="stat-value">{stats.budget}</span>
            <span className="stat-label">Per Team</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏸</span>
          <div className="stat-info">
            <span className="stat-value">{stats.topCategory}</span>
            <span className="stat-label">Top Category</span>
          </div>
        </div>
      </div>

      {/* Reset Button - Bottom Right Corner */}
      <button 
        className={`reset-button-fixed ${showResetConfirm ? 'confirm-mode' : ''}`}
        onClick={handleReset}
        disabled={resetting}
        title="Reset auction data (keeps teams & players)"
      >
        {resetting ? '⏳ Resetting...' : (showResetConfirm ? '⚠️ Confirm Reset?' : '🔄 Reset Auction')}
      </button>
    </div>
  );
};

export default DashboardPage;