import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";

const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;

  useEffect(() => {
    if (!currentUser?.id) { navigate("/login"); return; }

    // Fetch user's reviews
    fetch(`http://localhost:5001/api/reviews/user/${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching reviews:", err);
        setLoading(false);
      });

    // Get Cart Count
    const cartKey = currentUser?.id ? `cart_user_${currentUser.id}` : 'guest_cart';
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
    }
  }, [currentUser?.id, navigate]);

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

          <Link to="/my-reviews" className="sidebar-menu-item active">
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
            <h1>My Reviews</h1>
            <p>View and manage your product feedback</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '15px', color: '#6b7280' }}>Loading your reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="portal-empty-state">
              <h3>No reviews yet</h3>
              <p>You haven't reviewed any products yet. Share your experience with others!</p>
              <button onClick={() => navigate("/")} style={styles.primaryBtn}>Explore Products</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {reviews.map((review) => (
                <div key={review.id} style={styles.reviewCard}>
                  <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
                    {/* Product Image */}
                    <img 
                      src={review.image_url || 'https://via.placeholder.com/100'} 
                      alt={review.product_name} 
                      style={styles.productImg} 
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={styles.productName}>{review.product_name}</h4>
                          <div style={styles.ratingStars}>
                            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                            <span style={{ marginLeft: '10px', color: '#9ca3af', fontSize: '0.85rem' }}>
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span style={{ 
                          ...styles.statusBadge, 
                          backgroundColor: review.status === 'approved' ? '#dcfce7' : '#fef3c7',
                          color: review.status === 'approved' ? '#16a34a' : '#d97706'
                        }}>
                          {review.status}
                        </span>
                      </div>
                      
                      <p style={styles.commentText}>{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const styles = {
  primaryBtn: { 
    padding: "12px 30px", background: "var(--pazaryolu-red)", color: "#fff", 
    border: "none", borderRadius: "12px", fontWeight: "800", cursor: "pointer" 
  },
  reviewCard: {
    background: 'white', padding: '25px', borderRadius: '20px', 
    border: '1px solid #f0f0f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
  },
  productImg: {
    width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', background: '#f9fafb'
  },
  productName: {
    margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '800', color: '#111827'
  },
  ratingStars: {
    color: '#fbbf24', fontSize: '1rem', fontWeight: '700'
  },
  commentText: {
    margin: '15px 0 0 0', color: '#4b5563', lineHeight: '1.6', fontSize: '0.95rem'
  },
  statusBadge: {
    padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', 
    fontWeight: '800', textTransform: 'capitalize'
  }
};

export default MyReviews;
