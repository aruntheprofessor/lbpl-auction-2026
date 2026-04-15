// ReportsPage.jsx - Auction reports and statistics
import React, { useState, useEffect } from 'react';
import { getSoldPlayers } from '../services/bidService';
import { getTeams } from '../services/teamService';
import { getPlayers } from '../services/playerService';
import { getAuctionSummary } from '../services/bidService';
import { exportAuctionReport } from '../services/pdfService';
import './ReportsPage.css';

const ReportsPage = ({ onBack }) => {
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('top'); // top, teams, stats

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    
    // Load sold players
    const soldResult = await getSoldPlayers();
    if (soldResult.success) {
      setSoldPlayers(soldResult.data);
    }

    // Load teams
    const teamsResult = await getTeams();
    if (teamsResult.success) {
      setTeams(teamsResult.data);
    }

    // Load summary stats
    const statsResult = await getAuctionSummary();
    if (statsResult.success) {
      setStats(statsResult.data);
    }

    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get top 10 players
  const topPlayers = [...soldPlayers]
    .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
    .slice(0, 10);

  // Team-wise players
  const teamPlayers = teams.map(team => ({
    ...team,
    players: soldPlayers.filter(p => p.sold_to_team === team.id)
  }));

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading-screen">
          <h2>📊 Loading Reports...</h2>
        </div>
      </div>
    );
  }

  // Handle PDF Export
const handleExportPDF = async (type) => {
  const reportData = {
    soldCount: soldPlayers.length,
    totalValue: soldPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0),
    unsoldCount: stats?.unsoldCount || 0,
    avgPrice: soldPlayers.length > 0 
      ? soldPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0) / soldPlayers.length 
      : 0,
    topPlayers: soldPlayers,
    teams: teamPlayers
  };
  
  const result = await exportAuctionReport(reportData, type);
  if (result.success) {
    alert('✅ Report exported successfully!');
  } else {
    alert('❌ Export failed: ' + result.error);
  }
};
  return (
    <div className="reports-page">
      {/* Header */}
      <header className="page-header">
          <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
          <h1>📊 Auction Reports</h1>
          <div className="header-actions">
            <button className="export-btn" onClick={() => handleExportPDF('full')}>
              📄 Export Full Report
            </button>
            <button className="export-btn" onClick={() => handleExportPDF('top10')}>
              🏆 Export Top 10
            </button>
          </div>
          <div className="header-stats">
            <span>Total Sold: {soldPlayers.length}</span>
          </div>
        </header>

      {/* Tabs */}
      <div className="reports-tabs">
        <button 
          className={`tab-btn ${activeTab === 'top' ? 'active' : ''}`}
          onClick={() => setActiveTab('top')}
        >
          🏆 Top 10 Buys
        </button>
        <button 
          className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          👥 Team-wise Players
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📈 Statistics
        </button>
      </div>

      {/* Top 10 Players Tab */}
      {activeTab === 'top' && (
        <div className="top-players-section">
          <h2>🏆 Highest Sold Players</h2>
          <div className="top-players-list">
            {topPlayers.map((player, index) => (
              <div key={player.id} className="top-player-card">
                <div className="player-rank">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>
                <div className="player-photo">
                  {player.image_url ? (
                    <img src={player.image_url} alt={player.name} />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="player-info">
                  <h3>{player.name}</h3>
                  <p className="player-category">{player.category} • {player.age || 'N/A'} yrs</p>
                  <p className="player-team" style={{ color: player.teams?.team_color }}>
                    {player.teams?.name || 'Unknown'}
                  </p>
                </div>
                <div className="player-price">
                  {formatCurrency(player.sold_price)}
                </div>
              </div>
            ))}
            {topPlayers.length === 0 && (
              <p className="no-data">No players sold yet</p>
            )}
          </div>
        </div>
      )}

      {/* Team-wise Players Tab */}
      {activeTab === 'teams' && (
        <div className="team-players-section">
          <h2>👥 Team-wise Players</h2>
          <div className="team-players-grid">
            {teamPlayers.map(team => (
              <div key={team.id} className="team-report-card" style={{ borderColor: team.team_color }}>
                <div className="team-report-header" style={{ backgroundColor: team.team_color + '20' }}>
                  <div className="team-logo-small">
                    {team.logo_url ? <img src={team.logo_url} alt={team.name} /> : <span>🏸</span>}
                  </div>
                  <div className="team-info">
                    <h3 style={{ color: team.team_color }}>{team.name}</h3>
                    <p>Captain: {team.captain_name || 'TBA'}</p>
                    <p className="team-purse">Purse: {formatCurrency(team.current_purse)}</p>
                  </div>
                </div>
                <div className="team-players-gallery">
                  {team.players.length > 0 ? (
                    team.players.map(player => (
                      <div key={player.id} className="gallery-player">
                        <div className="gallery-photo">
                          {player.image_url ? (
                            <img src={player.image_url} alt={player.name} />
                          ) : (
                            <span>👤</span>
                          )}
                        </div>
                        <div className="gallery-info">
                          <p className="gallery-name">{player.name}</p>
                          <p className="gallery-price">{formatCurrency(player.sold_price)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-players">No players bought</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div className="stats-section">
          <h2>📈 Auction Statistics</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-icon">💰</span>
              <span className="stat-value">{formatCurrency(stats.totalSoldValue || 0)}</span>
              <span className="stat-label">Total Auction Value</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">👤</span>
              <span className="stat-value">{stats.soldCount || 0}</span>
              <span className="stat-label">Players Sold</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">❌</span>
              <span className="stat-value">{stats.unsoldCount || 0}</span>
              <span className="stat-label">Players Unsold</span>
            </div>
            <div className="stat-box">
              <span className="stat-icon">📊</span>
              <span className="stat-value">{formatCurrency((stats.totalSoldValue || 0) / (stats.soldCount || 1))}</span>
              <span className="stat-label">Average Player Price</span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="category-breakdown">
            <h3>Category-wise Sales</h3>
            <div className="category-stats-list">
              {Object.entries(
                soldPlayers.reduce((acc, p) => {
                  acc[p.category] = (acc[p.category] || 0) + 1;
                  return acc;
                }, {})
              ).map(([cat, count]) => (
                <div key={cat} className="category-stat-item">
                  <span className="cat-name">{cat}</span>
                  <span className="cat-count">{count} players</span>
                  <span className="cat-value">
                    {formatCurrency(soldPlayers.filter(p => p.category === cat).reduce((sum, p) => sum + (p.sold_price || 0), 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;