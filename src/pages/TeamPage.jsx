// TeamPage.jsx - Team registration with CRUD operations
import React, { useState, useEffect } from 'react';
import { getTeams, createTeam, updateTeam, deleteTeam, saveAllTeams } from '../services/teamService';
import './TeamPage.css';

const TeamPage = ({ onBack }) => {
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    motto: '',
    color: '#667eea',
    logo: null
  });

  // Load teams from database on page load
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    const result = await getTeams();
    if (result.success && result.data) {
      const formattedTeams = result.data.map(team => ({
        id: team.id,
        name: team.name,
        motto: team.motto || '',
        color: team.team_color || '#667eea',
        logo: team.logo_url || null
      }));
      setTeams(formattedTeams);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Team name is required!');
      return;
    }

    setLoading(true);

    if (editingTeam !== null) {
      // Update existing team
      const result = await updateTeam(formData.id, formData);
      if (result.success) {
        alert('✅ Team updated successfully!');
        await loadTeams();
      } else {
        alert('❌ Failed to update team: ' + result.error);
      }
    } else {
      // Add new team
      const result = await createTeam(formData);
      if (result.success) {
        alert('✅ Team added successfully!');
        await loadTeams();
      } else {
        alert('❌ Failed to add team: ' + result.error);
      }
    }

    // Reset form
    setFormData({ id: null, name: '', motto: '', color: '#667eea', logo: null });
    setShowForm(false);
    setEditingTeam(null);
    setLoading(false);
  };

  const handleEdit = (index) => {
    const team = teams[index];
    setFormData({
      id: team.id,
      name: team.name,
      motto: team.motto,
      color: team.color,
      logo: team.logo
    });
    setEditingTeam(index);
    setShowForm(true);
  };

  const handleDelete = async (index) => {
    const team = teams[index];
    if (window.confirm(`Delete "${team.name}"?`)) {
      setLoading(true);
      const result = await deleteTeam(team.id);
      if (result.success) {
        alert('✅ Team deleted successfully!');
        await loadTeams();
      } else {
        alert('❌ Failed to delete team: ' + result.error);
      }
      setLoading(false);
    }
  };

  const handleSaveToDB = async () => {
    if (teams.length === 0) {
      alert('No teams to save!');
      return;
    }
    
    setLoading(true);
    const result = await saveAllTeams(teams);
    if (result.success) {
      alert(`✅ ${teams.length} teams saved to database!`);
    } else {
      alert('❌ Failed to save teams: ' + result.error);
    }
    setLoading(false);
  };

  if (loading && teams.length === 0) {
    return (
      <div className="team-page">
        <div className="loading-screen">
          <h2>🏸 Loading Teams...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="team-page">
      {/* Header */}
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>🏸 Team Registration</h1>
        <div className="team-stats">
          <span>Total Teams: {teams.length}/8</span>
        </div>
      </header>

      {/* Add Team Button */}
      {!showForm && (
        <button className="add-team-btn" onClick={() => setShowForm(true)}>
          + Add New Team
        </button>
      )}

      {/* Team Form */}
      {showForm && (
        <div className="team-form-container">
          <h2>{editingTeam !== null ? 'Edit Team' : 'Add New Team'}</h2>
          <form onSubmit={handleSubmit} className="team-form">
            <div className="form-group">
              <label>Team Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Smash Masters"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Team Logo</label>
              <div className="logo-upload">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo Preview" className="logo-preview" />
                ) : (
                  <div className="logo-placeholder">🏸</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  id="logo-input"
                  disabled={loading}
                />
                <label htmlFor="logo-input" className="upload-label">
                  Choose Logo
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Team Motto</label>
              <input
                type="text"
                name="motto"
                value={formData.motto}
                onChange={handleInputChange}
                placeholder="e.g., Smash to Victory!"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Team Color</label>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Saving...' : (editingTeam !== null ? 'Update Team' : 'Add Team')}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingTeam(null);
                  setFormData({ id: null, name: '', motto: '', color: '#667eea', logo: null });
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams Table */}
      {teams.length > 0 && (
        <div className="teams-table-container">
          <h2>Registered Teams</h2>
          <table className="teams-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Team Name</th>
                <th>Motto</th>
                <th>Color</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={team.id}>
                  <td>
                    <div className="table-logo">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} />
                      ) : (
                        <span>🏸</span>
                      )}
                    </div>
                  </td>
                  <td>{team.name}</td>
                  <td>{team.motto || '-'}</td>
                  <td>
                    <div
                      className="color-preview"
                      style={{ backgroundColor: team.color }}
                    ></div>
                    {team.color}
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(index)}
                      disabled={loading}
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(index)}
                      disabled={loading}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Cards Preview */}
      {teams.length > 0 && (
        <div className="team-cards-preview">
          <h2>Team Cards Preview</h2>
          <div className="cards-grid">
            {teams.map((team) => (
              <div
                key={team.id}
                className="team-card"
                style={{ backgroundColor: team.color }}
              >
                <div className="card-logo">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} />
                  ) : (
                    <span>🏸</span>
                  )}
                </div>
                <h3 className="card-team-name">{team.name}</h3>
                {team.motto && <p className="card-motto">{team.motto}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      {teams.length > 0 && (
        <button className="save-db-btn" onClick={handleSaveToDB} disabled={loading}>
          {loading ? '💾 Saving...' : '💾 Save to Database'}
        </button>
      )}

      {/* Empty State */}
      {teams.length === 0 && !showForm && (
        <div className="empty-state">
          <span>🏸</span>
          <h3>No Teams Registered Yet</h3>
          <p>Click "Add New Team" to get started!</p>
        </div>
      )}
    </div>
  );
};

export default TeamPage;