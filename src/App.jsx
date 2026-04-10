import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/CustomersPage';
import ItemsPage from './pages/ItemsPage';
import DailyEntryPage from './pages/DailyEntryPage';
import ProfitLossPage from './pages/ProfitLossPage';
import LoginPage from './pages/LoginPage';
import { validateToken } from './api/api';

function ProtectedRoute({ children, isAuthenticated }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }

    try {
      const res = await validateToken();
      if (res.data.valid) {
        setIsAuthenticated(true);
        setUsername(res.data.username || localStorage.getItem('username'));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    } finally {
      setChecking(false);
    }
  };

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUsername(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
  };

  if (checking) {
    return (
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        height: '100vh', background: 'var(--bg-primary)', gap: '20px' 
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '20px', 
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          <img src="/logo.png" alt="Z Logo" style={{ width: '50px', objectFit: 'contain' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
            Sales Tracker
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
            Profit & Online System
          </p>
        </div>
        <div className="spinner" style={{ marginTop: '10px' }} />
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
              70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
            }
          `}
        </style>
      </div>
    );
  }

  // If on login page, don't show layout
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
        } />
      </Routes>
    );
  }

  return (
    <ProtectedRoute isAuthenticated={isAuthenticated}>
      <Layout username={username} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/daily-entry" element={<DailyEntryPage />} />
          <Route path="/profit-loss" element={<ProfitLossPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}

export default App;
