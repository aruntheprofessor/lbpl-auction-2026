// App.jsx - Main Application File
import { useEffect, useState } from 'react';
import { testConnection } from './services/supabase';
import LandingPage from './pages/LandingPage';
import './App.css';

function App() {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection();
      if (isConnected) {
        setConnectionStatus('✅ Database Connected!');
        setTimeout(() => {
          setShowApp(true);
        }, 500);
      } else {
        setConnectionStatus('❌ Database Connection Failed');
      }
    };
    
    checkConnection();
  }, []);

  if (!showApp) {
    return (
      <div className="App">
        <h1>🏸 LBPL Auction Software</h1>
        <h2>Lourdes Badminton Premier League</h2>
        <p>Season 1 - 2024</p>
        
        <div className="status-box">
          <h3>Database Status:</h3>
          <p className="status">{connectionStatus}</p>
        </div>
        
        <div className="next-steps">
          <p>✅ Supabase keys loaded</p>
          <p>✅ Database tables created</p>
          <p>🚀 Loading auction interface...</p>
        </div>
      </div>
    );
  }

  return <LandingPage />;
}

export default App;