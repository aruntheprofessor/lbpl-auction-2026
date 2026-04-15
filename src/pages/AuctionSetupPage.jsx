// AuctionSetupPage.jsx - Auction configuration page
import React, { useState, useEffect } from 'react';
import { 
  getCategories, createCategory, updateCategory, deleteCategory, saveAllCategories,
  getBudget, saveBudget, getAuctionStats 
} from '../services/auctionService';
import './AuctionSetupPage.css';

const AuctionSetupPage = ({ onBack }) => {
  const [categories, setCategories] = useState([]);
  const [budget, setBudget] = useState(100000);
  const [stats, setStats] = useState({ teams: 0, players: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    basePrice: '',
    increment: ''
  });

  // Load data on page load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load categories
    const catResult = await getCategories();
    if (catResult.success && catResult.data) {
      const formattedCats = catResult.data.map(cat => ({
        id: cat.id,
        name: cat.category_name,
        basePrice: cat.base_price,
        increment: cat.increment_value
      }));
      setCategories(formattedCats);
    }

    // Load budget
    const budgetResult = await getBudget();
    if (budgetResult.success) {
      setBudget(budgetResult.data.overall_budget);
    }

    // Load stats
    const statsResult = await getAuctionStats();
    if (statsResult.success) {
      setStats(statsResult.data);
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.basePrice || !formData.increment) {
      alert('All fields are required!');
      return;
    }

    setLoading(true);

    if (editingCategory !== null) {
      const result = await updateCategory(formData.id, formData);
      if (result.success) {
        alert('✅ Category updated successfully!');
        await loadData();
        resetForm();
      } else {
        alert('❌ Failed to update category: ' + result.error);
      }
    } else {
      const result = await createCategory(formData);
      if (result.success) {
        alert('✅ Category added successfully!');
        await loadData();
        resetForm();
      } else {
        alert('❌ Failed to add category: ' + result.error);
      }
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', basePrice: '', increment: '' });
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleEdit = (index) => {
    const cat = categories[index];
    setFormData({
      id: cat.id,
      name: cat.name,
      basePrice: cat.basePrice,
      increment: cat.increment
    });
    setEditingCategory(index);
    setShowForm(true);
  };

  const handleDelete = async (index) => {
    const cat = categories[index];
    if (window.confirm(`Delete category "${cat.name}"?`)) {
      setLoading(true);
      const result = await deleteCategory(cat.id);
      if (result.success) {
        alert('✅ Category deleted successfully!');
        await loadData();
      } else {
        alert('❌ Failed to delete category: ' + result.error);
      }
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    const result = await saveBudget(budget);
    if (result.success) {
      alert(`✅ Budget saved: ₹${budget.toLocaleString()}`);
    } else {
      alert('❌ Failed to save budget: ' + result.error);
    }
    setSaving(false);
  };

  const handleSaveCategories = async () => {
    if (categories.length === 0) {
      alert('No categories to save!');
      return;
    }
    
    setSaving(true);
    const result = await saveAllCategories(categories);
    if (result.success) {
      alert(`✅ ${categories.length} categories saved to database!`);
    } else {
      alert('❌ Failed to save categories: ' + result.error);
    }
    setSaving(false);
  };

  const formatIndianCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading && categories.length === 0) {
    return (
      <div className="auction-setup-page">
        <div className="loading-screen">
          <h2>⚙️ Loading Auction Setup...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-setup-page">
      {/* Header */}
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>⚙️ Auction Setup</h1>
        <div className="header-stats">
          <span>🏏 Teams: {stats.teams}</span>
          <span>👤 Players: {stats.players}</span>
        </div>
      </header>

      {/* Budget Section */}
      <div className="budget-section">
        <h2>💰 Overall Team Budget</h2>
        <div className="budget-input-group">
          <span className="currency-symbol">₹</span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="budget-input"
            placeholder="Enter budget amount"
          />
          <button 
            className="save-budget-btn" 
            onClick={handleSaveBudget}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
        <p className="budget-display">
          Each team will have: <strong>{formatIndianCurrency(budget)}</strong>
        </p>
      </div>

      {/* Categories Section */}
      <div className="categories-section">
        <div className="section-header">
          <h2>📊 Auction Categories</h2>
          {!showForm && (
            <button className="add-cat-btn" onClick={() => setShowForm(true)}>
              + Add Category
            </button>
          )}
        </div>

        {/* Category Form */}
        {showForm && (
          <div className="category-form-container">
            <h3>{editingCategory !== null ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., A+"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Base Price (₹) *</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    placeholder="e.g., 1500"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Bid Increment (₹) *</label>
                  <input
                    type="number"
                    name="increment"
                    value={formData.increment}
                    onChange={handleInputChange}
                    placeholder="e.g., 250"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingCategory !== null ? 'Update' : 'Add')}
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Table */}
        {categories.length > 0 ? (
          <div className="categories-table-container">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Bid Increment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat.id}>
                    <td>
                      <span className="category-tag category-tag-large">
                        {cat.name}
                      </span>
                    </td>
                    <td>{formatIndianCurrency(cat.basePrice)}</td>
                    <td>
                      <span className="increment-value">
                        +{formatIndianCurrency(cat.increment)}
                      </span>
                    </td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEdit(index)} disabled={loading}>
                        ✏️
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(index)} disabled={loading}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-categories">
            <span>📊</span>
            <h3>No Categories Defined</h3>
            <p>Add categories like A+, A, B, etc.</p>
          </div>
        )}

        {/* Category Cards Preview */}
        {categories.length > 0 && (
          <div className="category-cards-preview">
            <h3>Category Summary</h3>
            <div className="category-cards-grid">
              {categories.map(cat => (
                <div key={cat.id} className="category-card">
                  <div className="category-card-header">{cat.name}</div>
                  <div className="category-card-body">
                    <div className="cat-detail">
                      <span>Base:</span>
                      <strong>{formatIndianCurrency(cat.basePrice)}</strong>
                    </div>
                    <div className="cat-detail">
                      <span>Increment:</span>
                      <strong className="increment">+{formatIndianCurrency(cat.increment)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Categories Button */}
        {categories.length > 0 && (
          <button className="save-all-btn" onClick={handleSaveCategories} disabled={saving}>
            {saving ? '💾 Saving...' : '💾 Save Categories to Database'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuctionSetupPage;