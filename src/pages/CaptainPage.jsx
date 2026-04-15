// CaptainPage.jsx - Captain assignment screen
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import './CaptainPage.css';

const CaptainPage = ({ onBack }) => {
  const [teams, setTeams] = useState([]);
  const [captains, setCaptains] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Load teams on page load
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('admin_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setTeams(data || []);

      // Load existing captain names
      const captainMap = {};
      data?.forEach(team => {
        if (team.captain_name) {
          captainMap[team.id] = team.captain_name;
        }
      });
      setCaptains(captainMap);
    } catch (error) {
      console.error('Error loading teams:', error);
      alert('Failed to load teams');
    }
    setLoading(false);
  };

  const handleCaptainChange = (teamId, value) => {
    setCaptains(prev => ({
      ...prev,
      [teamId]: value
    }));
  };

  const handleSaveCaptains = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update each team with captain name
      for (const team of teams) {
        const captainName = captains[team.id] || '';
        const { error } = await supabase
          .from('teams')
          .update({ captain_name: captainName })
          .eq('id', team.id)
          .eq('admin_id', user.id);

        if (error) throw error;
      }

      alert('✅ Captains saved successfully!');
    } catch (error) {
      console.error('Error saving captains:', error);
      alert('❌ Failed to save captains: ' + error.message);
    }
    setSaving(false);
  };

  const handleShowAnnouncement = () => {
    // Check if all captains are assigned
    const missingCaptains = teams.filter(team => !captains[team.id]);
    if (missingCaptains.length > 0) {
      if (!window.confirm(`${missingCaptains.length} team(s) don't have captains assigned. Show anyway?`)) {
        return;
      }
    }
    setShowAnnouncement(true);
  };

  // Split teams into two rows for display
  const topRowTeams = teams.slice(0, 4);
  const bottomRowTeams = teams.slice(4, 8);

  if (loading) {
    return (
      <div className="captain-page">
        <div className="loading-screen">
          <h2>🏸 Loading Teams...</h2>
        </div>
      </div>
    );
  }

  // Announcement View
  if (showAnnouncement) {
    return (
      <div className="captain-page announcement-mode">
        <header className="announcement-header">
          <button className="back-btn" onClick={() => setShowAnnouncement(false)}>
            ← Back to Assignment
          </button>
          <h1>🎯 Team Captains Announcement</h1>
        </header>

        <div className="announcement-container">
          <h2 className="announcement-title">
            🏆 LBPL Season 1 • 2026 🏆
          </h2>
          <p className="announcement-subtitle">Presenting Your Team Captains</p>

          <div className="teams-announcement-grid">
            {teams.map(team => (
              <div 
                key={team.id} 
                className="announcement-card"
                style={{ 
                  background: `linear-gradient(135deg, ${team.team_color}40, ${team.team_color}20)`,
                  borderColor: team.team_color 
                }}
              >
                <div className="announcement-logo">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} />
                  ) : (
                    <span>🏸</span>
                  )}
                </div>
                <h3 className="announcement-team-name" style={{ color: team.team_color }}>
                  {team.name}
                </h3>
                <div className="announcement-captain">
                  <span className="captain-label">Captain</span>
                  <span className="captain-name">
                    {captains[team.id] || 'TBA'}
                  </span>
                </div>
                {team.motto && (
                  <p className="announcement-motto">"{team.motto}"</p>
                )}
              </div>
            ))}
          </div>

          <div className="announcement-footer">
            <p>🏸 Let the Auction Begin! 🏸</p>
          </div>
        </div>
      </div>
    );
  }

  // Assignment View
  return (
    <div className="captain-page">
      {/* Header */}
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>🎯 Captain Assignment</h1>
        <div className="header-stats">
          <span>Teams: {teams.length}</span>
        </div>
      </header>

      {/* Instructions */}
      <div className="instructions-card">
        <span className="instruction-icon">🎲</span>
        <div className="instruction-text">
          <h3>How to Assign Captains</h3>
          <p>Call captains to pick a team from the bowl. Enter their name next to the team they pick!</p>
        </div>
      </div>

      {/* Teams Grid - Top Row */}
      <div className="teams-grid top-row">
        {topRowTeams.map(team => (
          <div 
            key={team.id} 
            className="team-captain-card"
            style={{ borderColor: team.team_color }}
          >
            <div 
              className="team-color-bar" 
              style={{ backgroundColor: team.team_color }}
            ></div>
            <div className="team-card-content">
              <div className="team-logo">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} />
                ) : (
                  <span>🏸</span>
                )}
              </div>
              <h3 className="team-name" style={{ color: team.team_color }}>
                {team.name}
              </h3>
              {team.motto && <p className="team-motto">"{team.motto}"</p>}
              
              <div className="captain-input-group">
                <label>Captain Name:</label>
                <input
                  type="text"
                  placeholder="Enter captain name"
                  value={captains[team.id] || ''}
                  onChange={(e) => handleCaptainChange(team.id, e.target.value)}
                  className="captain-input"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Teams Grid - Bottom Row */}
      {bottomRowTeams.length > 0 && (
        <div className="teams-grid bottom-row">
          {bottomRowTeams.map(team => (
            <div 
              key={team.id} 
              className="team-captain-card"
              style={{ borderColor: team.team_color }}
            >
              <div 
                className="team-color-bar" 
                style={{ backgroundColor: team.team_color }}
              ></div>
              <div className="team-card-content">
                <div className="team-logo">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} />
                  ) : (
                    <span>🏸</span>
                  )}
                </div>
                <h3 className="team-name" style={{ color: team.team_color }}>
                  {team.name}
                </h3>
                {team.motto && <p className="team-motto">"{team.motto}"</p>}
                
                <div className="captain-input-group">
                  <label>Captain Name:</label>
                  <input
                    type="text"
                    placeholder="Enter captain name"
                    value={captains[team.id] || ''}
                    onChange={(e) => handleCaptainChange(team.id, e.target.value)}
                    className="captain-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {teams.length === 0 && (
        <div className="empty-state">
          <span>🏏</span>
          <h3>No Teams Registered</h3>
          <p>Please register teams first in Team Registration</p>
          <button className="go-to-teams-btn" onClick={onBack}>
            Go to Team Registration
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {teams.length > 0 && (
        <div className="action-buttons">
          <button 
            className="save-captains-btn" 
            onClick={handleSaveCaptains}
            disabled={saving}
          >
            {saving ? '💾 Saving...' : '💾 Save Captains'}
          </button>
          <button 
            className="announce-btn" 
            onClick={handleShowAnnouncement}
          >
            📢 Show Announcement
          </button>
        </div>
      )}
    </div>
  );
};

export default CaptainPage;