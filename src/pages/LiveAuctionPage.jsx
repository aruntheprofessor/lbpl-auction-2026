// LiveAuctionPage.jsx - The main auction screen!
import React, { useState, useEffect } from 'react';
import { 
  getTeamsForAuction, 
  getAvailablePlayers, 
  getUnsoldPlayers,
  sellPlayer, 
  unsellPlayer, 
  updateTeamPurse, 
  recordBid,
  getAuctionCategories,
  getCategoryDetails,
  getSoldPlayers
} from '../services/bidService';
import { playBidSound, playSoldSound, playUnsoldSound } from '../services/soundService';
import './LiveAuctionPage.css';

const LiveAuctionPage = ({ onBack }) => {
  // State
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [biddingTeam, setBiddingTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showUnsoldRound, setShowUnsoldRound] = useState(false);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [soldPlayersList, setSoldPlayersList] = useState([]);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [currentInstructionSlide, setCurrentInstructionSlide] = useState(0);
  const [soldAnimation, setSoldAnimation] = useState(null); // { playerId, teamId }

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    
    // Load teams
    const teamsResult = await getTeamsForAuction();
    if (teamsResult.success) {
      setTeams(teamsResult.data);
    }

    // Load categories
    const catResult = await getAuctionCategories();
    if (catResult.success) {
      setCategories(catResult.data);
    }

    setLoading(false);
  };

  // Handle category selection
  const handleSelectCategory = async (category) => {
    setSelectedCategory(category);
    setLoading(true);

    // Get category details (base price, increment)
    const detailsResult = await getCategoryDetails(category.category_name);
    if (detailsResult.success) {
      setCategoryDetails(detailsResult.data);
    }

    // Get available players in this category
    const playersResult = await getAvailablePlayers(category.category_name);
    if (playersResult.success) {
      setPlayers(playersResult.data);
    }

    setLoading(false);
  };

  // Start auction with first player
  const handleStartAuction = () => {
    if (players.length > 0) {
      // Shuffle players
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      setPlayers(shuffled);
      setCurrentPlayer(shuffled[0]);
      setCurrentBid(shuffled[0].base_price || categoryDetails?.base_price || 1000);
      setAuctionStarted(true);
      setShowInstructions(false);
    }
  };

  // Handle team bid
// Handle team bid
const handleTeamBid = async (team) => {
  if (!currentPlayer) return;
  if (team.current_purse < currentBid + (categoryDetails?.increment_value || 250)) {
    alert(`❌ ${team.name} doesn't have enough purse!`);
    return;
  }

  const newBid = currentBid + (categoryDetails?.increment_value || 250);
  setCurrentBid(newBid);
  setBiddingTeam(team);

  // Play bid sound
  playBidSound();

  // Record bid
  await recordBid(currentPlayer.id, team.id, newBid);
};

  // Handle SOLD
 // Handle SOLD
const handleSold = async () => {
  if (!currentPlayer || !biddingTeam) {
    alert('No team has bid on this player!');
    return;
  }

    // Play SOLD sound!
  playSoldSound();
  
  // Trigger confetti!
  triggerConfetti();

  // Trigger animation
  setSoldAnimation({ playerId: currentPlayer.id, teamId: biddingTeam.id });
  
  // Clear animation after 1 second
  setTimeout(() => setSoldAnimation(null), 1000);

  setLoading(true);

  // Update player status
  await sellPlayer(currentPlayer.id, biddingTeam.id, currentBid);

  // Update team purse
  const newPurse = biddingTeam.current_purse - currentBid;
  await updateTeamPurse(biddingTeam.id, newPurse);

  // Update local teams state
  setTeams(teams.map(t => 
    t.id === biddingTeam.id 
      ? { ...t, current_purse: newPurse }
      : t
  ));

  // Move to next player after animation
  setTimeout(() => {
    moveToNextPlayer();
    setLoading(false);
  }, 800);
};

 // Handle UNSOLD
const handleUnsold = async () => {
  if (!currentPlayer) return;

  // Play unsold sound
  playUnsoldSound();

  setLoading(true);

  // Mark player as unsold
  await unsellPlayer(currentPlayer.id);

  // Move to next player
  moveToNextPlayer();
  
  setLoading(false);
};
  // Move to next player
  const moveToNextPlayer = () => {
    const remainingPlayers = players.filter(p => p.id !== currentPlayer?.id);
    setPlayers(remainingPlayers);

    if (remainingPlayers.length > 0) {
      setCurrentPlayer(remainingPlayers[0]);
      setCurrentBid(remainingPlayers[0].base_price || categoryDetails?.base_price || 1000);
      setBiddingTeam(null);
    } else {
      // Category finished
      setCurrentPlayer(null);
      setAuctionStarted(false);
      
      // Check if this was unsold round
      if (showUnsoldRound) {
        setShowUnsoldRound(false);
        alert('✅ Unsold round completed!');
        setSelectedCategory(null);
      } else {
        alert('✅ Category completed! Select another category.');
        setSelectedCategory(null);
      }
    }
  };

  // Handle unsold round
  const handleUnsoldRound = async () => {
    setLoading(true);
    const result = await getUnsoldPlayers();
    if (result.success && result.data.length > 0) {
      setUnsoldPlayers(result.data);
      setPlayers(result.data);
      setShowUnsoldRound(true);
      setSelectedCategory({ category_name: 'UNSOLD' });
      setCategoryDetails({ base_price: 500, increment_value: 100 });
      setAuctionStarted(false);
    } else {
      alert('No unsold players!');
    }
    setLoading(false);
  };

  // Toggle summary view - ONLY available after instructions
  const handleToggleSummary = async () => {
    if (!showSummary) {
      setLoading(true);
      const result = await getSoldPlayers();
      if (result.success) {
        setSoldPlayersList(result.data);
      }
      setLoading(false);
    }
    setShowSummary(!showSummary);
  };

  // Close summary
  const handleCloseSummary = () => {
    setShowSummary(false);
  };

  // Go back to categories
  const handleBackToCategories = () => {
    if (auctionStarted) {
      if (window.confirm('Exit current auction? You can resume this category later.')) {
        setAuctionStarted(false);
        setCurrentPlayer(null);
        setSelectedCategory(null);
      }
    } else {
      setSelectedCategory(null);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Confetti animation for SOLD
const triggerConfetti = () => {
  // Create multiple confetti pieces
  const colors = ['#ffd700', '#ffed4a', '#ff6b6b', '#4facfe', '#43e97b', '#f093fb'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
    }, i * 20);
  }
};

const createConfettiPiece = (color) => {
  const confetti = document.createElement('div');
  confetti.className = 'confetti-piece';
  confetti.style.backgroundColor = color;
  confetti.style.left = Math.random() * 100 + '%';
  confetti.style.animationDuration = (Math.random() * 1 + 0.8) + 's';
  confetti.style.width = (Math.random() * 10 + 5) + 'px';
  confetti.style.height = (Math.random() * 10 + 5) + 'px';
  
  document.body.appendChild(confetti);
  
  setTimeout(() => {
    confetti.remove();
  }, 2000);
};

  // Instructions slides
  const instructionSlides = [
    {
      title: '🏸 Welcome to LBPL Auction!',
      content: 'Lourdes Badminton Premier League - Season 1 • 2026',
      teams: true
    },
    {
      title: '📋 Auction Rules',
      content: [
        'Each team has a fixed purse',
        'Minimum bid is the base price',
        'Bid increments as per category',
        'Going once... Going twice... SOLD!'
      ]
    },
    {
      title: '📊 Categories',
      content: categories.map(c => `${c.category_name}: Base ${formatCurrency(c.base_price)} (+${formatCurrency(c.increment_value)})`)
    }
  ];

  // ===== SUMMARY VIEW =====
  if (showSummary) {
    // Get top 5 highest sold players
    const topBuys = [...soldPlayersList]
      .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
      .slice(0, 5);

    return (
      <div className="live-auction-page summary-mode">
        <header className="auction-header">
          <button className="back-btn" onClick={handleCloseSummary}>← Back</button>
          <h1>📊 Auction Summary</h1>
          <div></div>
        </header>

        <div className="summary-container">
          {/* Top Buys Section */}
          {topBuys.length > 0 && (
            <div className="top-buys-section">
              <h2>🏆 Highest Sold Players</h2>
              <div className="top-buys-grid">
                {topBuys.map((player, index) => (
                  <div key={player.id} className="top-buy-card">
                    <div className="top-buy-rank">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </div>
                    <div className="top-buy-photo">
                      {player.image_url ? (
                        <img src={player.image_url} alt={player.name} />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div className="top-buy-info">
                      <h3>{player.name}</h3>
                      <p className="top-buy-category">{player.category}</p>
                      <p className="top-buy-team" style={{ color: player.teams?.team_color || '#ffd700' }}>
                        {player.teams?.name || 'Unknown Team'}
                      </p>
                      <p className="top-buy-price">{formatCurrency(player.sold_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Status Section */}
          <div className="teams-summary">
            <h2>Team Status</h2>
            <div className="teams-summary-grid">
              {teams.map(team => (
                <div key={team.id} className="team-summary-card" style={{ borderColor: team.team_color }}>
                  <div className="team-summary-header" style={{ backgroundColor: team.team_color + '20' }}>
                    <span className="team-name">{team.name}</span>
                    <span className="team-purse">{formatCurrency(team.current_purse)}</span>
                  </div>
                  <div className="team-players-list">
                    {soldPlayersList
                      .filter(p => p.sold_to_team === team.id)
                      .map(p => (
                        <div key={p.id} className="sold-player-item">
                          <span>{p.name}</span>
                          <span className="sold-price">{formatCurrency(p.sold_price)}</span>
                        </div>
                      ))}
                    {soldPlayersList.filter(p => p.sold_to_team === team.id).length === 0 && (
                      <p className="no-players">No players yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Stats */}
          <div className="summary-stats">
            <div className="stat-item">
              <span>Total Players Sold:</span>
              <strong>{soldPlayersList.length}</strong>
            </div>
            <div className="stat-item">
              <span>Total Auction Value:</span>
              <strong>{formatCurrency(soldPlayersList.reduce((sum, p) => sum + (p.sold_price || 0), 0))}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !auctionStarted) {
    return (
      <div className="live-auction-page">
        <div className="loading-screen">
          <h2>🏸 Loading Auction...</h2>
        </div>
      </div>
    );
  }

  // Instructions View - NO SUMMARY BUTTON HERE!
  if (showInstructions && !auctionStarted) {
    const slide = instructionSlides[currentInstructionSlide];
    return (
      <div className="live-auction-page instructions-mode">
        <header className="auction-header">
          <button className="back-btn" onClick={onBack}>← Dashboard</button>
          <h1>🏸 LBPL Auction 2026</h1>
          <div></div> {/* No summary button during instructions */}
        </header>

        <div className="instructions-container">
          <div className="instruction-slide">
            <h2>{slide.title}</h2>
            
            {slide.teams && (
              <div className="teams-preview-grid">
                {teams.map(team => (
                  <div key={team.id} className="team-preview-card" style={{ borderColor: team.team_color }}>
                    <div className="team-preview-logo">
                      {team.logo_url ? <img src={team.logo_url} alt={team.name} /> : <span>🏸</span>}
                    </div>
                    <h3 style={{ color: team.team_color }}>{team.name}</h3>
                    <p>Captain: {team.captain_name || 'TBA'}</p>
                    <p className="purse">Purse: {formatCurrency(team.current_purse)}</p>
                  </div>
                ))}
              </div>
            )}

            {slide.content && Array.isArray(slide.content) && (
              <ul className="rules-list">
                {slide.content.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}

            <div className="instruction-nav">
              {currentInstructionSlide > 0 && (
                <button onClick={() => setCurrentInstructionSlide(s => s - 1)}>← Previous</button>
              )}
              {currentInstructionSlide < instructionSlides.length - 1 ? (
                <button onClick={() => setCurrentInstructionSlide(s => s + 1)}>Next →</button>
              ) : (
                <button className="start-btn" onClick={() => setShowInstructions(false)}>
                  🎲 Choose Category
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category Selection View - SUMMARY BUTTON AVAILABLE HERE!
  if (!selectedCategory) {
    return (
      <div className="live-auction-page">
        <header className="auction-header">
          <button className="back-btn" onClick={onBack}>← Dashboard</button>
          <h1>🎲 Select Category</h1>
          <button className="summary-btn" onClick={handleToggleSummary}>📊 Summary</button>
        </header>

        <div className="category-selector">
          <h2>Choose a category to start auction</h2>
          <div className="category-grid">
            {categories.map(cat => (
              <button
                key={cat.id}
                className="category-btn"
                onClick={() => handleSelectCategory(cat)}
              >
                <span className="cat-name">{cat.category_name}</span>
                <span className="cat-base">Base: {formatCurrency(cat.base_price)}</span>
                <span className="cat-inc">+{formatCurrency(cat.increment_value)}</span>
              </button>
            ))}
          </div>
          
          <button className="unsold-round-btn" onClick={handleUnsoldRound}>
            🔄 Start Unsold Players Round
          </button>
        </div>
      </div>
    );
  }

  // Main Auction View - SUMMARY BUTTON AVAILABLE HERE!
  return (
    <div className="live-auction-page auction-mode">
      <header className="auction-header">
        <button className="back-btn" onClick={handleBackToCategories}>
          ← {auctionStarted ? 'Back to Categories' : 'Choose Different Category'}
        </button>
        <h1>
          🏸 Live Auction 
          {selectedCategory && <span className="category-badge">{selectedCategory.category_name}</span>}
        </h1>
        <button className="summary-btn" onClick={handleToggleSummary}>📊 Summary</button>
      </header>

      {!auctionStarted ? (
        <div className="start-auction-container">
          <div className="category-info">
            <h2>{selectedCategory.category_name} Category</h2>
            <p>Players Available: {players.length}</p>
            <p>Base Price: {formatCurrency(categoryDetails?.base_price || 0)}</p>
            <p>Bid Increment: +{formatCurrency(categoryDetails?.increment_value || 0)}</p>
          </div>
          <button className="start-auction-btn" onClick={handleStartAuction} disabled={players.length === 0}>
            {players.length > 0 ? '🎲 Start Auction' : '❌ No Players in this Category'}
          </button>
        </div>
      ) : (
        <div className="auction-main">
          {/* Left Panel - Teams */}
          <div className="teams-panel">
            <h3>Teams & Purses</h3>
            <div className="teams-list">
              {teams.map(team => (
                <div 
                  key={team.id} 
                  className={`team-purse-card ${biddingTeam?.id === team.id ? 'active' : ''}`}
                  style={{ borderColor: team.team_color }}
                >
                  <div className="team-logo-small">
                    {team.logo_url ? <img src={team.logo_url} alt={team.name} /> : <span>🏸</span>}
                  </div>
                  <div className="team-info">
                    <span className="team-name-small" style={{ color: team.team_color }}>
                      {team.name}
                    </span>
                    <span className="team-purse-amount">{formatCurrency(team.current_purse)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="players-left">
              Players Left: {players.length}
            </div>
          </div>

          {/* Right Panel - Player Display */}
          <div className="player-panel">
            {currentPlayer && (
              <>
                <div className="player-display">
                  <div className={`player-image-container ${soldAnimation ? 'sold-animation' : ''}`}>
                    {currentPlayer.image_url ? (
                      <img src={currentPlayer.image_url} alt={currentPlayer.name} />
                    ) : (
                      <div className="player-image-placeholder">👤</div>
                    )}
                  </div>
                  <div className="player-details">
                    <h2>{currentPlayer.name}</h2>
                    <div className="player-meta">
                      <span>Age: {currentPlayer.age || 'N/A'}</span>
                      <span>Skill: {currentPlayer.skill_level || 'N/A'}</span>
                      <span className="player-category-tag">{currentPlayer.category}</span>
                    </div>
                    <p className="player-achievements">{currentPlayer.achievements || 'No achievements listed'}</p>
                    <div className="base-price-display">
                      Base Price: {formatCurrency(currentPlayer.base_price)}
                    </div>
                  </div>
                </div>

                {/* Current Bid Box */}
                <div className="current-bid-box">
                  <span className="bid-label">Current Bid</span>
                  <span className="bid-amount">{formatCurrency(currentBid)}</span>
                  {biddingTeam && (
                    <span className="bidding-team" style={{ color: biddingTeam.team_color }}>
                      {biddingTeam.name}
                    </span>
                  )}
                </div>

                {/* Team Bidding Buttons Grid */}
                <div className="bidding-grid">
                  {teams.slice(0, 8).map(team => (
                    <button
                      key={team.id}
                      className="team-bid-btn"
                      style={{ 
                        backgroundColor: team.team_color + '20',
                        borderColor: team.team_color 
                      }}
                      onClick={() => handleTeamBid(team)}
                      disabled={team.current_purse < currentBid + (categoryDetails?.increment_value || 250)}
                    >
                      <span className="team-bid-logo">
                        {team.logo_url ? <img src={team.logo_url} alt={team.name} /> : <span>🏸</span>}
                      </span>
                      <span className="team-bid-name" style={{ color: team.team_color }}>
                        {team.name}
                      </span>
                      <span className="team-bid-purse">{formatCurrency(team.current_purse)}</span>
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="auction-actions">
                  <button className="sold-btn" onClick={handleSold} disabled={!biddingTeam}>
                    🏆 SOLD
                  </button>
                  <button className="unsold-btn" onClick={handleUnsold}>
                    ❌ UNSOLD
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAuctionPage;