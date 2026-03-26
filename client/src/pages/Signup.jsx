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
      console.log('Signup successful:', data);
      navigate('/login', { state: { successMessage: 'Signup successful! You can Login now.' } });
    } catch (err) {
      setError('Server Error. Please try again later.');
    }
  };

  return (
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
  );
};

export default Signup;
