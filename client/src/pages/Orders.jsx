import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [expandedOrders, setExpandedOrders] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;

  useEffect(() => {
    if (!currentUser?.id) { navigate("/login"); return; }

    fetch(`http://localhost:5001/api/orders/my-orders/${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      });

    const cartKey = currentUser?.id ? `cart_user_${currentUser.id}` : 'guest_cart';
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
    }
  }, [currentUser?.id, navigate]);

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'processing': return { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' };
      case 'delivered': return { bg: '#ecfdf5', text: '#059669', dot: '#10b981' };
      case 'cancelled': return { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' };
      default: return { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af' };
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header cartCount={cartCount} onSearchChange={(val) => navigate(`/?search=${val}`)} />

      <div className="account-portal-container">
        <aside className="account-sidebar">
          <div className="sidebar-title">My Account</div>
          <Link to="/profile" className="sidebar-menu-item">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            User Information
          </Link>
          <Link to="/orders" className="sidebar-menu-item active">
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

        <main className="account-main-content">
          <div className="content-header">
            <h1>My Orders</h1>
            <p>Manage and track your shopping history</p>
          </div>

          <div className="orders-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="portal-empty-state">
                <h3>No orders yet</h3>
                <p>Looks like you haven't placed any orders yet.</p>
                <button onClick={() => navigate("/")} className="update-btn" style={{ padding: '12px 40px' }}>Start Shopping</button>
              </div>
            ) : (
              orders.map((order) => {
                const colors = getStatusColor(order.status);
                const isExpanded = expandedOrders[order.id];

                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header" onClick={() => toggleOrder(order.id)}>
                      <div className="order-header-main-info">
                        <div className="order-header-item">
                          <span className="order-header-label">Order Placed</span>
                          <span className="order-header-value">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="order-header-item">
                          <span className="order-header-label">Total</span>
                          <span className="order-header-value">${order.total_amount}</span>
                        </div>
                        <div className="order-header-item">
                          <span className="order-header-label">Status</span>
                          <span className="order-header-value" style={{ color: colors.text }}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="order-header-right-info">
                        <div className="order-header-item" style={{ alignItems: 'flex-end', flexDirection: 'row', gap: '15px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span className="order-header-label">Order # {order.id}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#2563eb' }}>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                          </div>
                          <svg 
                            width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                            style={{ transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#6b7280' }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="order-card-body">
                        <div className="order-items">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="order-item-row">
                              <img src={item.image_url || "/placeholder.png"} alt={item.name} className="order-item-image" />
                              <div className="order-item-info">
                                <div className="order-item-name">{item.name}</div>
                                <div className="order-item-meta">{item.quantity} × ${Number(item.price_at_purchase).toFixed(2)} = ${(item.quantity * Number(item.price_at_purchase)).toFixed(2)}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                                <button className="update-btn" style={{ padding: '10px 22px', fontSize: '0.85rem', fontWeight: '800' }} onClick={() => navigate(`/product/${item.product_id}`)}>
                                  Buy Again
                                </button>
                                <button className="profile-input" style={{ padding: '10px 22px', fontSize: '0.85rem', cursor: 'pointer', background: '#f9fafb', fontWeight: '800' }} onClick={() => navigate(`/product/${item.product_id}?review=true`)}>
                                  Review
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Orders;
