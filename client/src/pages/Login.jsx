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
      console.log('Login successful:', data);
      
      // --- ADD THIS LINE ---
      // Save the user data to localStorage so the Dashboard knows you are logged in
      localStorage.setItem('user', JSON.stringify(data)); 
      
      navigate('/');
    } catch (err) {
      setError('Server Error. Please try again later.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">PazarYolu</h2>
        <p className="auth-subtitle">Welcome back! Please login to your account.</p>
        
        {location.state?.successMessage && (
          <div style={{ 
            backgroundColor: 'rgba(28, 165, 28, 0.1)', 
            color: '#1c7a1c', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            fontSize: '0.9rem',
            textAlign: 'center',
            border: '1px solid #1c7a1c'
          }}>
            {location.state.successMessage}
          </div>
        )}
        
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
          <button type="submit" className="auth-button">Sign In</button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-footer-link">Create one now</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
