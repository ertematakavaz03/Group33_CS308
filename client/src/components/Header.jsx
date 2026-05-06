import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Header = ({ searchTerm, onSearchChange, cartCount, cartAnimating }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };
    window.addEventListener('userChanged', syncUser);
    return () => window.removeEventListener('userChanged', syncUser);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userChanged'));
    navigate('/');
  };

  return (
    <header className="navbar" style={{ backgroundColor: 'var(--pazaryolu-red)', borderBottom: 'none' }}>
      <div className="navbar-logo-container">
        <Link to="/">
          <img src="/logo.png" alt="PazarYolu Logo" className="navbar-logo" />
        </Link>
      </div>

      <div className="navbar-search-container">
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search for products, brands and more..."
          value={searchTerm || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
        <button className="navbar-search-button">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>
      </div>

      <div className="navbar-links" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {user ? (
          <div className="user-dropdown">
            <div className="nav-trigger">
              <div className="nav-icon">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <div className="nav-content">
                <span className="nav-name">{user?.user?.first_name || user?.first_name || user?.user?.name?.split(' ')[0] || "User"}</span>
                <span className="nav-label">ACCOUNT</span>
              </div>
            </div>
            <div className="user-dropdown-menu" style={{ padding: '0', minWidth: '260px' }}>
              <div className="user-dropdown-inner" style={{ overflow: 'hidden', borderRadius: '12px', background: 'white' }}>
                <div className="dropdown-user-info">
                  <span className="dropdown-user-email">{user?.user?.email || user?.email || "User Account"}</span>
                </div>
                <Link to="/profile" className="dropdown-item">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  User Information
                </Link>
                <Link to="/orders" className="dropdown-item">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14L4 7m16 0v10l-8 4m0-14l-8 4M4 7v10l8 4"></path></svg>
                  All Orders
                </Link>
                <Link to="/my-reviews" className="dropdown-item">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                  My Reviews
                </Link>
                <Link to="/addresses" className="dropdown-item">
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  My Addresses
                </Link>
                <Link to="/" onClick={handleSignOut} className="dropdown-item" style={{ backgroundColor: '#fff5f5', color: '#dc2626' }}>
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#dc2626' }}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="user-dropdown">
            <div className="nav-trigger">
              <div className="nav-icon">
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <div className="nav-content">
                <span className="nav-name">Login</span>
              </div>
            </div>
            <div className="user-dropdown-menu" style={{ padding: '0', minWidth: '220px' }}>
              <div className="user-dropdown-inner" style={{ overflow: 'hidden', borderRadius: '12px', background: 'white', padding: '20px' }}>
                <Link to="/login" style={{ display: 'block', textDecoration: 'none', textAlign: 'center', background: 'linear-gradient(135deg, #a51c1c 0%, #8b1818 100%)', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', marginBottom: '10px' }}>
                  Login
                </Link>
                <Link to="/signup" style={{ display: 'block', textDecoration: 'none', textAlign: 'center', border: '2px solid #e5e7eb', color: '#374151', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem' }}>
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}

        <Link to="/cart" className="nav-trigger" title="Go to Cart">
          <div className="nav-icon">
            <svg 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              viewBox="0 0 24 24"
              style={{
                transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                transform: cartAnimating ? 'scale(1.3) rotate(-10deg)' : 'scale(1)'
              }}
            >
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div className="nav-content">
            <span className="nav-name">Cart</span>
            <span className="nav-label">
              ({cartCount || 0}) ITEMS
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;
