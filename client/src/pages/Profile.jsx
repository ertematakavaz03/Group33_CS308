import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dobDay: 'Select',
    dobMonth: 'Select',
    dobYear: 'Select',
    isCorporate: false
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) { navigate("/login"); return; }
    
    const parsedUser = JSON.parse(savedUser);
    const currentUser = parsedUser?.user || parsedUser;
    setUser(currentUser);

    // Populate form data from existing user info
    setFormData(prev => ({
      ...prev,
      firstName: currentUser.first_name || currentUser.name?.split(' ')[0] || '',
      lastName: currentUser.last_name || currentUser.name?.split(' ').slice(1).join(' ') || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      // Attempt to parse DOB if it exists (assuming YYYY-MM-DD format)
      ...(currentUser.date_of_birth ? {
        dobYear: currentUser.date_of_birth.split('-')[0],
        dobMonth: currentUser.date_of_birth.split('-')[1],
        dobDay: currentUser.date_of_birth.split('-')[2],
      } : {})
    }));

    // Get Cart Count
    const cartKey = currentUser?.id ? `cart_user_${currentUser.id}` : 'guest_cart';
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dob = (formData.dobYear !== 'Select' && formData.dobMonth !== 'Select' && formData.dobDay !== 'Select')
        ? `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`
        : null;

      const response = await fetch(`http://localhost:5001/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: dob
        })
      });

      if (response.ok) {
        const updatedUser = { 
          ...user, 
          first_name: formData.firstName, 
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: dob
        };
        
        // Update local storage so it persists on refresh
        const storageData = JSON.parse(localStorage.getItem("user"));
        if (storageData.user) {
          storageData.user = updatedUser;
        } else {
          Object.assign(storageData, updatedUser);
        }
        localStorage.setItem("user", JSON.stringify(storageData));
        window.dispatchEvent(new Event('userChanged'));
        
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("An error occurred while saving your information.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header cartCount={cartCount} onSearchChange={(val) => navigate(`/?search=${val}`)} />

      <div className="account-portal-container">
        {/* Sidebar Navigation */}
        <aside className="account-sidebar">
          <div className="sidebar-title">My Account</div>
          
          <Link to="/profile" className="sidebar-menu-item active">
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

          <Link to="/addresses" className="sidebar-menu-item">
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
          <div className="content-header">
            <h1>User Information</h1>
            <p>Manage your personal details and account settings</p>
          </div>

          <form className="profile-form-container" onSubmit={handleUpdate}>
            {/* Name Row */}
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="profile-input" placeholder="Enter your first name" required />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="profile-input" placeholder="Enter your last name" required />
              </div>
            </div>

            {/* Email Row */}
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="profile-input" placeholder="example@domain.com" required />
            </div>

            {/* Phone Number Row */}
            <div className="form-group">
              <label>Phone Number *</label>
              <div className="phone-input-group">
                <select className="profile-input prefix-select">
                  <option>+90</option>
                  <option>+1</option>
                  <option>+44</option>
                </select>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="profile-input" style={{ flex: 1 }} placeholder="5XX XXX XX XX" />
              </div>
            </div>

            {/* Date of Birth Row */}
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

            {/* Form Footer */}
            <div className="form-footer">
              <button type="submit" className="update-btn" disabled={loading}>
                {loading ? "Saving..." : "Update"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Profile;
