// PlayerPage.jsx - Player registration with CRUD operations
import React, { useState, useEffect } from 'react';
import { getPlayers, createPlayer, updatePlayer, deletePlayer, saveAllPlayers } from '../services/playerService';
import { getCategories } from '../services/auctionService';
import './PlayerPage.css';

const PlayerPage = ({ onBack }) => {
  const [players, setPlayers] = useState([]);
  const [categories, setCategories] = useState([]); // ← FIXED: Now from database
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    age: '',
    skill: '',
    achievements: '',
    category: '',
    basePrice: '',
    image: null
  });

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

  // Load players and categories on page load
  useEffect(() => {
    loadPlayers();
    loadCategories(); // ← FIXED: Load categories from database
  }, []);

  // ← FIXED: New function to load categories from database
  const loadCategories = async () => {
    const result = await getCategories();
    if (result.success && result.data) {
      const catNames = result.data.map(cat => cat.category_name);
      setCategories(catNames);
      // Set default category to first one if available
      if (catNames.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: catNames[0] }));
      }
    }
  };

  const loadPlayers = async () => {
    setLoading(true);
    const result = await getPlayers();
    if (result.success && result.data) {
      const formattedPlayers = result.data.map(player => ({
        id: player.id,
        name: player.name,
        age: player.age,
        skill: player.skill_level,
        achievements: player.achievements || '',
        category: player.category,
        basePrice: player.base_price,
        image: player.image_url
      }));
      setPlayers(formattedPlayers);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      alert('Player name and category are required!');
      return;
    }

    setLoading(true);

    if (editingPlayer !== null) {
      const result = await updatePlayer(formData.id, formData);
      if (result.success) {
        alert('✅ Player updated successfully!');
        await loadPlayers();
      } else {
        alert('❌ Failed to update player: ' + result.error);
      }
    } else {
      const result = await createPlayer(formData);
      if (result.success) {
        alert('✅ Player added successfully!');
        await loadPlayers();
      } else {
        alert('❌ Failed to add player: ' + result.error);
      }
    }

    resetForm();
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      age: '',
      skill: '',
      achievements: '',
      category: categories.length > 0 ? categories[0] : '', // ← FIXED: Use first category from DB
      basePrice: '',
      image: null
    });
    setShowForm(false);
    setEditingPlayer(null);
  };

  const handleEdit = (index) => {
    const player = filteredAndSortedPlayers[index];
    setFormData({
      id: player.id,
      name: player.name,
      age: player.age || '',
      skill: player.skill || '',
      achievements: player.achievements || '',
      category: player.category,
      basePrice: player.basePrice || '',
      image: player.image
    });
    setEditingPlayer(players.findIndex(p => p.id === player.id));
    setShowForm(true);
  };

  const handleDelete = async (index) => {
    const player = filteredAndSortedPlayers[index];
    if (window.confirm(`Delete "${player.name}"?`)) {
      setLoading(true);
      const result = await deletePlayer(player.id);
      if (result.success) {
        alert('✅ Player deleted successfully!');
        await loadPlayers();
      } else {
        alert('❌ Failed to delete player: ' + result.error);
      }
      setLoading(false);
    }
  };

  const handleSaveToDB = async () => {
    if (players.length === 0) {
      alert('No players to save!');
      return;
    }
    
    setLoading(true);
    const result = await saveAllPlayers(players);
    if (result.success) {
      alert(`✅ ${players.length} players saved to database!`);
    } else {
      alert('❌ Failed to save players: ' + result.error);
    }
    setLoading(false);
  };

  // Filter and sort players
  const filteredAndSortedPlayers = players
    .filter(player => filterCategory === 'all' || player.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'age') return (a.age || 0) - (b.age || 0);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'basePrice') return (b.basePrice || 0) - (a.basePrice || 0);
      return 0;
    });

  // Statistics - FIXED: Use dynamic categories
  const stats = {
    total: players.length,
    byCategory: categories.length > 0 
      ? categories.reduce((acc, cat) => {
          acc[cat] = players.filter(p => p.category === cat).length;
          return acc;
        }, {})
      : {}
  };

  if (loading && players.length === 0) {
    return (
      <div className="player-page">
        <div className="loading-screen">
          <h2>🏸 Loading Players...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page">
      {/* Header */}
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>👤 Player Registration</h1>
        <div className="player-stats">
          <span>Total: {players.length}</span>
        </div>
      </header>

      {/* Filters - FIXED: Uses dynamic categories */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Category:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="age">Age</option>
            <option value="category">Category</option>
            <option value="basePrice">Base Price (High-Low)</option>
          </select>
        </div>

        <button className="add-player-btn" onClick={() => setShowForm(true)}>
          + Add New Player
        </button>
      </div>

      {/* Category Stats - FIXED: Uses dynamic categories */}
      <div className="category-stats">
        {categories.map(cat => (
          stats.byCategory[cat] > 0 && (
            <div key={cat} className="stat-badge">
              {cat}: {stats.byCategory[cat]}
            </div>
          )
        ))}
      </div>

      {/* Player Form */}
      {showForm && (
        <div className="player-form-overlay">
          <div className="player-form-container">
            <h2>{editingPlayer !== null ? 'Edit Player' : 'Add New Player'}</h2>
            <form onSubmit={handleSubmit} className="player-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Player Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g., 25"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Skill Level</label>
                  <select name="skill" value={formData.skill} onChange={handleInputChange} disabled={loading}>
                    <option value="">Select Skill Level</option>
                    {skillLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* FIXED: Category dropdown uses dynamic categories */}
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required disabled={loading}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Achievements</label>
                <textarea
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleInputChange}
                  placeholder="e.g., State Champion 2025, National Player..."
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Base Price (₹)</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    placeholder="e.g., 1500"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Player Photo</label>
                  <div className="image-upload">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="image-preview" />
                    ) : (
                      <div className="image-placeholder">👤</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      id="player-image"
                      disabled={loading}
                    />
                    <label htmlFor="player-image" className="upload-label">
                      Choose Photo
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingPlayer !== null ? 'Update Player' : 'Add Player')}
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Players Table */}
      {filteredAndSortedPlayers.length > 0 ? (
        <div className="players-table-container">
          <table className="players-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Age</th>
                <th>Skill</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPlayers.map((player, index) => {
                return (
                  <tr key={player.id}>
                    <td>
                      <div className="table-photo">
                        {player.image ? (
                          <img src={player.image} alt={player.name} />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{player.name}</strong>
                      {player.achievements && (
                        <small className="achievement-preview">{player.achievements.substring(0, 30)}...</small>
                      )}
                    </td>
                    <td>{player.age || '-'}</td>
                    <td>
                      {player.skill && (
                        <span className={`skill-badge ${player.skill.toLowerCase()}`}>
                          {player.skill}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`category-badge category-${player.category.toLowerCase()}`}>
                        {player.category}
                      </span>
                    </td>
                    <td>₹{player.basePrice?.toLocaleString() || '0'}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEdit(index)} disabled={loading}>
                        ✏️
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(index)} disabled={loading}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <span>👤</span>
          <h3>No Players Registered Yet</h3>
          <p>Click "Add New Player" to get started!</p>
        </div>
      )}

      {/* Save Button */}
      {players.length > 0 && (
        <button className="save-db-btn" onClick={handleSaveToDB} disabled={loading}>
          {loading ? '💾 Saving...' : `💾 Save ${players.length} Players to Database`}
        </button>
      )}
    </div>
  );
};

export default PlayerPage;
