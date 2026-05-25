import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    tax_id: '',
    home_address: ''
  });
  const [error, setError] = useState('');

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length > 10) digits = digits.slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `0 (${digits}`;
    if (digits.length <= 6) return `0 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 8) return `0 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `0 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  };

  const handleChange = (e) => {
    if (e.target.name === 'phone') {
      setFormData({ ...formData, phone: formatPhone(e.target.value) });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    const rawDigits = formData.phone.replace(/\D/g, '');
    const digitsOnly = rawDigits.startsWith('0') ? rawDigits.slice(1) : rawDigits;
    if (digitsOnly.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
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

      const userId = data.user?.id || data.id;
      if (formData.home_address.trim() && userId) {
        try {
          await fetch(`/api/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              title: 'Home',
              full_address: formData.home_address.trim(),
              is_default: true
            })
          });
        } catch {
          // Address can still be added from My Addresses later.
        }
      }

      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart && userId) {
        try {
          const parsedCart = JSON.parse(guestCart);
          if (parsedCart.length > 0) {
            await fetch(`/api/cart/${userId}/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cartItems: parsedCart })
            });
          }
          localStorage.removeItem('guest_cart');
        } catch {
          // cart sync failure shouldn't block signup
        }
      }

      window.dispatchEvent(new Event('userChanged'));
      navigate('/');
    } catch {
      setError('Server Error. Please try again later.');
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>

      <header className="navbar" style={{ backgroundColor: 'var(--pazaryolu-red)', borderBottom: 'none' }}>
        <div className="navbar-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/"><img src="/logo.png" alt="PazarYolu Logo" className="navbar-logo" /></Link>
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>Sign Up</span>
        </div>
        <div>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '10px', padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
            ← Back to Home
          </button>
        </div>
      </header>

    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">PazarYolu</h2>
        <p className="auth-subtitle">Join us today! Create your account below.</p>
        
        <form onSubmit={handleSubmit} noValidate autoComplete="off">
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
              maxLength={255}
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
              maxLength={255}
              autoComplete="off"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="0 (5XX) XXX XX XX"
              value={formData.phone}
              onChange={handleChange}
              maxLength={17}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Tax ID</label>
            <input
              type="text"
              name="tax_id"
              className="form-input"
              placeholder="Optional (10-11 digits)"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value.replace(/\D/g, '').slice(0, 11) })}
              maxLength={11}
              inputMode="numeric"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Default Delivery Address</label>
            <input
              type="text"
              name="home_address"
              className="form-input"
              placeholder="Optional"
              value={formData.home_address}
              onChange={handleChange}
              maxLength={500}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              maxLength={128}
              autoComplete="new-password"
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
