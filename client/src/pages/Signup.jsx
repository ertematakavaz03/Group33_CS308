import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setError('Invalid: Phone number must be exactly 10 digits.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: digitsOnly })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to register');
        return;
      }

      setError('');
      localStorage.setItem('user', JSON.stringify(data));
      window.dispatchEvent(new Event('userChanged'));
      navigate('/');
    } catch (err) {
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

    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">PazarYolu</h2>
        <p className="auth-subtitle">Join us today! Create your account below.</p>
        
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div style={{ 
              backgroundColor: 'rgba(165, 28, 28, 0.1)', 
              color: 'var(--pazaryolu-red)', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              fontSize: '0.9rem',
              textAlign: 'center',
              border: '1px solid var(--pazaryolu-red)'
            }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              name="name" 
              className="form-input"
              placeholder="John Doe"
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              name="email" 
              className="form-input"
              placeholder="name@example.com"
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              type="tel" 
              name="phone" 
              className="form-input"
              placeholder="(555) 555 55 55"
              value={formData.phone} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              name="password" 
              className="form-input"
              placeholder="••••••••"
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          <button type="submit" className="auth-button">Create Account</button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-footer-link">Log in here</Link>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Signup;
