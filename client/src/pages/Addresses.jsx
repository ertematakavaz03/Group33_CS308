import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";

const Addresses = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: '',
    full_address: '',
    city: '',
    district: '',
    postal_code: ''
  });

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;

  const fetchAddresses = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`http://localhost:5001/api/addresses/${currentUser.id}`);
      const data = await res.json();
      setAddresses(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) { navigate("/login"); return; }
    fetchAddresses();

    // Get Cart Count
    const cartKey = currentUser?.id ? `cart_user_${currentUser.id}` : 'guest_cart';
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
    }
  }, [currentUser?.id, navigate]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const url = newAddress.id 
        ? `http://localhost:5001/api/addresses/${newAddress.id}`
        : 'http://localhost:5001/api/addresses';
      const method = newAddress.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAddress, user_id: currentUser.id })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewAddress({ title: '', full_address: '', city: '', district: '', postal_code: '' });
        fetchAddresses();
      }
    } catch (err) {
      console.error("Error saving address:", err);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAddresses();
      else alert("Failed to delete address. Make sure the backend supports DELETE.");
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header cartCount={cartCount} onSearchChange={(val) => navigate(`/?search=${val}`)} />

      <div className="account-portal-container">
        {/* Sidebar Navigation */}
        <aside className="account-sidebar">
          <div className="sidebar-title">My Account</div>
          
          <Link to="/profile" className="sidebar-menu-item">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            User Information
          </Link>

          <Link to="/orders" className="sidebar-menu-item">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14L4 7m16 0v10l-8 4m0-14l-8 4M4 7v10l8 4"></path></svg>
            All Orders
          </Link>

          <Link to="/my-reviews" className="sidebar-menu-item">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
            My Reviews
          </Link>

          <Link to="/addresses" className="sidebar-menu-item active">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            My Addresses
          </Link>

          <div className="sidebar-menu-item" style={{ cursor: 'pointer', color: '#ef4444', marginTop: '10px' }} onClick={() => { localStorage.removeItem('user'); window.dispatchEvent(new Event('userChanged')); navigate('/'); }}>
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="account-main-content">
          <div className="content-header" style={{ textAlign: 'center' }}>
            <h1>My Addresses</h1>
            <p>Manage your delivery and billing addresses</p>
          </div>

          <div style={{ padding: '40px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '15px', color: '#6b7280' }}>Loading addresses...</p>
              </div>
            ) : (
              <div style={styles.addressListContainer}>
                {/* Permanent Add New Address Card */}
                <div 
                  onClick={() => {
                    setNewAddress({ title: '', full_address: '', city: '', district: '', postal_code: '' });
                    setShowAddModal(true);
                  }} 
                  style={{...styles.addressCard, ...styles.addNewCard}}
                >
                  <div style={styles.addIconContainer}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <span style={styles.addText}>Add New Address</span>
                </div>

                {addresses.map((addr) => (
                  <div key={addr.id} style={styles.addressCard}>
                    <div style={styles.cardHeader}>
                      <h4 style={styles.addrTitle}>{addr.title}</h4>
                      {addr.is_default && <span style={styles.defaultBadge}>Default</span>}
                    </div>
                    <p style={styles.addrText}>{addr.full_address}</p>
                    <p style={styles.addrLoc}>{addr.district} / {addr.city}</p>
                    <div style={styles.cardActions}>
                      <button 
                        onClick={() => {
                          setNewAddress({
                            id: addr.id,
                            title: addr.title,
                            full_address: addr.full_address,
                            city: addr.city,
                            district: addr.district,
                            postal_code: addr.postal_code || ''
                          });
                          setShowAddModal(true);
                        }} 
                        style={styles.actionBtn}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)} 
                        style={{...styles.actionBtn, color: '#ef4444'}}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Address Modal (Simple Overlay) */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', fontWeight: '800', color: '#111827' }}>Add New Address</h2>
            <form onSubmit={handleAddAddress}>
              <div className="form-group">
                <label>Address Title (e.g., Home, Office)</label>
                <input type="text" value={newAddress.title} onChange={e => setNewAddress({...newAddress, title: e.target.value})} className="profile-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Home" required />
              </div>
              
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Full Address</label>
                <textarea value={newAddress.full_address} onChange={e => setNewAddress({...newAddress, full_address: e.target.value})} className="profile-input" style={{ width: '100%', height: '100px', boxSizing: 'border-box', resize: 'none' }} placeholder="Enter your full street address..." required />
              </div>

              <div className="form-row" style={{ marginTop: '15px', gap: '20px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>City</label>
                  <input type="text" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="profile-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Istanbul" required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>District</label>
                  <input type="text" value={newAddress.district} onChange={e => setNewAddress({...newAddress, district: e.target.value})} className="profile-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Besiktas" required />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Postal Code</label>
                <input type="text" value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} className="profile-input" style={{ width: '100%', boxSizing: 'border-box' }} placeholder="34XXX" />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '35px' }}>
                <button type="submit" className="update-btn" style={{ flex: 1, padding: '14px', fontSize: '1rem' }}>Save Address</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="profile-input" style={{ flex: 0.4, cursor: 'pointer', background: '#f9fafb' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  addressListContainer: {
    display: 'flex',
    gap: '25px',
    marginTop: '20px',
    overflowX: 'auto',
    paddingBottom: '20px',
    paddingRight: '20px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#a51c1c #f3f4f6',
  },
  addressCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '24px',
    border: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'relative',
    minWidth: '320px',
    maxWidth: '320px',
    flexShrink: 0,
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
    transition: 'all 0.3s ease'
  },
  addNewCard: {
    border: '2px dashed #e5e7eb',
    background: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#9ca3af',
  },
  addIconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    color: 'var(--pazaryolu-red)'
  },
  addText: {
    fontWeight: '800',
    fontSize: '1.05rem',
    color: '#4b5563'
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  addrTitle: { margin: 0, fontWeight: '800', fontSize: '1.15rem', color: '#111827' },
  defaultBadge: { background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' },
  addrText: { margin: 0, color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5', minHeight: '45px' },
  addrLoc: { margin: 0, color: '#9ca3af', fontSize: '0.9rem', fontWeight: '600' },
  cardActions: { display: 'flex', gap: '25px', marginTop: '15px', borderTop: '1px solid #f3f4f6', paddingTop: '15px', justifyContent: 'center' },
  actionBtn: { background: 'none', border: 'none', color: '#6366f1', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' },
  primaryBtn: { padding: '12px 24px', background: 'var(--pazaryolu-red)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' },
  cancelBtn: { padding: '12px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalContent: { background: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' },
  formGroup: { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 },
  input: { padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem', outline: 'none' }
};

export default Addresses;
