import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dobDay: 'Select',
    dobMonth: 'Select',
    dobYear: 'Select'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setError('Invalid: Phone number must be exactly 10 digits.');
      setLoading(false);
      return;
    }

    let dob = null;
    if (formData.dobDay !== 'Select' && formData.dobMonth !== 'Select' && formData.dobYear !== 'Select') {
      dob = `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: digitsOnly,
          password: formData.password,
          dob: dob
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to register');
        setLoading(false);
        return;
      }

      setError('');
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('userChanged'));
      navigate('/');
    } catch {
      setError('Server Error. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      {/* Back to Home Button */}
      <div style={{ position: "absolute", top: "2rem", left: "2rem" }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: "12px", padding: "10px 20px",
            fontWeight: "700", fontSize: "0.9rem", color: "#374151",
            cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            transition: 'all 0.2s'
          }}
        >
          ← Back to Home
        </button>
      </div>

      <div className="account-main-content" style={{ maxWidth: '850px', width: '100%', borderRadius: '32px', overflow: 'hidden' }}>
        <div className="content-header" style={{ textAlign: 'center', padding: '50px 40px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>PazarYolu</h1>
          <p>Join us today! Create your account in a few seconds.</p>
        </div>

        <form className="profile-form-container" onSubmit={handleSubmit} style={{ padding: '40px 50px' }}>
          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              color: '#dc2626', 
              padding: '12px 20px', 
              borderRadius: '12px', 
              marginBottom: '25px',
              fontSize: '0.9rem',
              fontWeight: '600',
              border: '1px solid #fee2e2',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Name Row */}
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="profile-input" placeholder="Ertem" required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="profile-input" placeholder="Ata" required />
            </div>
          </div>

          {/* Email Group */}
          <div className="form-group">
            <label>Email Address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="profile-input" placeholder="example@domain.com" required />
          </div>

          {/* Phone Group */}
          <div className="form-group">
            <label>Phone Number *</label>
            <div className="phone-input-group">
              <select className="profile-input prefix-select" style={{ cursor: 'pointer' }}>
                <option>+90</option>
              </select>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="profile-input" style={{ flex: 1 }} placeholder="5XX XXX XX XX" required />
            </div>
          </div>

          {/* DOB Group */}
          <div className="form-group">
            <label>Date of Birth</label>
            <div className="dob-group">
              <select name="dobDay" value={formData.dobDay} onChange={handleChange} className="dob-select">
                <option value="Select">Day</option>
                {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={String(i+1).padStart(2, '0')}>{String(i+1).padStart(2, '0')}</option>)}
              </select>
              <select name="dobMonth" value={formData.dobMonth} onChange={handleChange} className="dob-select">
                <option value="Select">Month</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                  <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
              <select name="dobYear" value={formData.dobYear} onChange={handleChange} className="dob-select">
                <option value="Select">Year</option>
                {Array.from({ length: 100 }, (_, i) => <option key={2025-i} value={String(2025-i)}>{2025-i}</option>)}
              </select>
            </div>
          </div>

          {/* Password Group */}
          <div className="form-group">
            <label>Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="profile-input" placeholder="••••••••" required />
          </div>

          <div className="form-footer" style={{ marginTop: '40px' }}>
            <button type="submit" className="update-btn" style={{ width: '100%', padding: '16px' }} disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#6b7280' }}>
              Already have an account? <Link to="/login" style={{ color: '#a51c1c', fontWeight: '700', textDecoration: 'none' }}>Log in here</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
