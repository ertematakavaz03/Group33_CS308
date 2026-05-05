import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.email === 'admin@pazaryolu.com' && formData.password === 'admin123') {
      localStorage.setItem('adminToken', 'pazaryolu-admin-secret-token');
      localStorage.removeItem('user');
      navigate('/admin/dashboard');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid User');
        return;
      }

      setError('');
      localStorage.setItem('user', JSON.stringify(data));

      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart) {
        try {
          const parsedCart = JSON.parse(guestCart);
          if (parsedCart.length > 0) {
            await fetch(`http://localhost:5001/api/cart/${data.user.id}/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cartItems: parsedCart })
            });
          }
          localStorage.removeItem('guest_cart');
        } catch (e) { console.error('Cart sync failed:', e); }
      }

      navigate('/');
    } catch {
      setError('Server Error. Please try again later.');
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6", position: "relative" }}>

      {/* Back to Home — fixed top left */}
      <div style={{ position: "absolute", top: "1.25rem", left: "1.5rem" }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "#fff", border: "1px solid #E5E7EB",
            borderRadius: "10px", padding: "0.5rem 1rem",
            fontWeight: "600", fontSize: "0.85rem", color: "#374151",
            cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          ← Back to Home
        </button>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "100vh", padding: "5rem 1rem 2rem",
        boxSizing: "border-box",
      }}>
        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: "12px", padding: "2.5rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB",
          width: "100%", maxWidth: "420px", boxSizing: "border-box",
        }}>
          <h2 className="auth-title">PazarYolu</h2>
          <p className="auth-subtitle">Welcome back! Please login to your account.</p>

          {location.state?.successMessage && (
            <div style={{
              backgroundColor: 'rgba(28,165,28,0.1)', color: '#1c7a1c',
              padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem',
              fontSize: '0.9rem', textAlign: 'center', border: '1px solid #1c7a1c'
            }}>
              {location.state.successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div style={{
                backgroundColor: 'rgba(165,28,28,0.1)', color: 'var(--pazaryolu-red)',
                padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem',
                fontSize: '0.9rem', textAlign: 'center', border: '1px solid var(--pazaryolu-red)'
              }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="auth-button">Sign In</button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup" className="auth-footer-link">Create one now</Link>
          </div>
        </div>

        {/* Admin Login — same width, directly below */}
        <div style={{
          background: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px",
          padding: "0.8rem 2rem", textAlign: "center", marginTop: "0.75rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          width: "100%", maxWidth: "420px", boxSizing: "border-box",
        }}>
          <span style={{ fontSize: "0.83rem", color: "#9CA3AF" }}>Are you an admin? </span>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            style={{
              background: "none", border: "none", padding: 0,
              color: "var(--pazaryolu-red)", fontWeight: "700",
              fontSize: "0.83rem", cursor: "pointer",
            }}
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
