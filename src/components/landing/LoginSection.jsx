// LoginSection.jsx - Admin login and registration
import React, { useState } from 'react';
import './LoginSection.css';

const LoginSection = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  
  if (!username || !password) {
    setError('Please fill in all fields');
    return;
  }

  if (!isLogin && password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  setLoading(true);
  
  // Call the onLogin function with email, password, and isRegister flag
  if (onLogin) {
    await onLogin(username, password, !isLogin);
  }
  
  setLoading(false);
};

const handleQuickAccess = (type) => {
  if (type === 'main') {
    setUsername('lbpl_main@auction.com');
    setPassword('auction2026');  // ← CHANGED FROM auction2024
  } else {
    setUsername('lbpl_test@auction.com');
    setPassword('test123');
  }
  setIsLogin(true);
};

  return (
    <div className="login-section">
      <div className="login-container">
        <h3 className="login-title">
          {isLogin ? '🔐 Admin Login' : '📝 Admin Registration'}
        </h3>
        
        {/* Quick Access Buttons */}
        <div className="quick-access">
          <button 
            type="button"
            className="quick-btn main"
            onClick={() => handleQuickAccess('main')}
          >
            <span className="btn-icon">🏆</span>
            <span className="btn-text">REAL AUCTION</span>
            <small>LBPL_MAIN</small>
          </button>
          
          <button 
            type="button"
            className="quick-btn test"
            onClick={() => handleQuickAccess('test')}
          >
            <span className="btn-icon">🧪</span>
            <span className="btn-text">TEST MODE</span>
            <small>LBPL_TEST</small>
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        {/* Login/Register Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input"
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="toggle-btn"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginSection;