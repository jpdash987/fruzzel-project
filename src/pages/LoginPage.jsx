import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import { HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi2';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      onLogin(res.data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left hero panel */}
        <div className="login-hero">
          <div className="login-hero-content">
            <div className="login-hero-logo-wrap">
              <img src="/logo.png" alt="Logo" className="login-hero-logo" />
            </div>
            <h1>Sales Tracker</h1>
            <p>Daily Sales + Profit + Online Tracking System</p>
            <div className="login-hero-features">
              <div className="login-feature"><span className="login-feature-dot"></span> Track daily sales &amp; returns</div>
              <div className="login-feature"><span className="login-feature-dot"></span> Auto-calculate profit</div>
              <div className="login-feature"><span className="login-feature-dot"></span> Monitor online payments</div>
              <div className="login-feature"><span className="login-feature-dot"></span> Customer-wise reporting</div>
            </div>
          </div>
        </div>

        {/* Right login form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <img src="/logo.png" alt="Logo" className="login-form-logo" />
              <div>
                <h2>Welcome Back</h2>
                <p className="login-subtitle">Sign in to your admin account</p>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>✕</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="login-username">
                  <HiOutlineUser /> Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  className="form-control"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="login-password">
                  <HiOutlineLockClosed /> Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary login-btn"
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>Secured Admin Portal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
