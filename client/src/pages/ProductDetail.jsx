import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reviewsRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [stockAlert, setStockAlert] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewStatus, setReviewStatus] = useState("");
  const [hasPurchased, setHasPurchased] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const userDropdownRef = useRef(null);
  const userCloseTimer = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const getCartKey = () => {
    if (!user) return "guest_cart";
    const userId = user?.user?.id || user?.id;
    return `cart_user_${userId}`;
  };

  useEffect(() => {
    fetch(`http://localhost:5001/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => { setProduct(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));

    fetch(`http://localhost:5001/api/products/${id}/reviews`)
      .then((res) => res.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(console.error);

    const userId = user?.user?.id || user?.id;
    if (userId) {
      fetch(`http://localhost:5001/api/orders/my-orders/${userId}`)
        .then((res) => res.json())
        .then((orders) => {
          const purchased = Array.isArray(orders) && orders.some((order) =>
            order.status === 'delivered' &&
            order.items?.some((item) => String(item.product_id || item.id) === String(id))
          );
          setHasPurchased(purchased);
        })
        .catch(console.error);

      fetch(`http://localhost:5001/api/wishlist/${userId}/has/${id}`)
        .then((res) => res.json())
        .then((data) => setInWishlist(!!data.inWishlist))
        .catch(console.error);
    }
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    const userId = user?.user?.id || user?.id;
    if (!userId || wishlistBusy) return;
    setWishlistBusy(true);
    const next = !inWishlist;
    setInWishlist(next);
    try {
      if (next) {
        await fetch(`http://localhost:5001/api/wishlist/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: Number(id) })
        });
      } else {
        await fetch(`http://localhost:5001/api/wishlist/${userId}/${id}`, { method: 'DELETE' });
      }
      window.dispatchEvent(new Event('wishlistChanged'));
    } catch (err) {
      console.error(err);
      setInWishlist(!next);
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setReviewStatus("You must be logged in to leave a review."); return; }
    const userId = user?.user?.id || user?.id;
    try {
      const res = await fetch(`http://localhost:5001/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...reviewForm })
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => [data, ...prev.filter((r) => r.id !== data.id)]);
        setReviewStatus("Your review has been submitted and is shown below.");
        setReviewForm({ rating: 5, comment: "" });
        setShowReviewForm(false);
        window.dispatchEvent(new Event('reviewUpdated'));
      } else {
        setReviewStatus(data.error || "Failed to submit review.");
      }
    } catch {
      setReviewStatus("An error occurred. Please try again.");
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) {
      setStockAlert('This product is out of stock.');
      setTimeout(() => setStockAlert(''), 3000);
      return;
    }
    const cartKey = getCartKey();
    const existing = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const found = existing.find((item) => item.id === product.id);
    let updatedCart;
    if (found) {
      if (found.quantity >= product.stock) {
        setStockAlert(`No more stock available. Only ${product.stock} in stock.`);
        setTimeout(() => setStockAlert(''), 3000);
        return;
      }
      updatedCart = existing.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      const cartProduct = {
        ...product,
        original_price: product.price,
        price: product.is_on_discount ? product.effective_price : product.price,
      };
      updatedCart = [...existing, { ...cartProduct, quantity: 1 }];
    }
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    const userId = user?.user?.id || user?.id;
    if (userId) {
      try {
        await fetch(`http://localhost:5001/api/cart/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
      } catch (err) { console.error(err); }
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleSeeReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <p style={{ color: "#9ca3af" }}>Loading...</p>
    </div>
  );

  if (!product) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <h2>Product not found.</h2>
      <button onClick={() => navigate("/")}>← Back to Home</button>
    </div>
  );

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const currentUserId = user?.user?.id || user?.id;
  // All reviews count toward the star average regardless of approval status
  const avgRating = reviews.length > 0
    ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
    : null;
  const visibleReviews = reviews.filter(r => r.status === 'approved' || r.user_id === currentUserId);

  const abbrevName = (name) => {
    if (!name) return "User";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return parts[0] + " " + parts[parts.length - 1][0] + ".";
  };

  const tabs = [
    { key: 'description', label: 'Description' },
    { key: 'specifications', label: 'Specifications' },
    { key: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  const hasSpecs = product.warranty || product.distributor || product.serial_no || product.model || product.category;

  const cartCount = (() => {
    try {
      const cartKey = getCartKey();
      const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      return cart.reduce((sum, item) => sum + item.quantity, 0);
    } catch { return 0; }
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>

      {/* Navbar */}
      <header className="navbar" style={{ backgroundColor: 'var(--pazaryolu-red)', borderBottom: 'none' }}>
        <div className="navbar-logo-container">
          <Link to="/">
            <img src="/logo.png" alt="PazarYolu Logo" className="navbar-logo" />
          </Link>
        </div>
        <div className="navbar-links" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user ? (
            <div
              ref={userDropdownRef}
              style={{ position: 'relative' }}
              onMouseEnter={() => { clearTimeout(userCloseTimer.current); setShowUserDropdown(true); }}
              onMouseLeave={() => { userCloseTimer.current = setTimeout(() => setShowUserDropdown(false), 200); }}
            >
              <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', color: 'var(--pazaryolu-red)', border: '2px solid #fff', borderRadius: '12px', padding: '0.55rem 1.1rem', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                {user?.user?.name?.split(' ')[0] || 'Account'}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {showUserDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', minWidth: '220px', zIndex: 1000, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-7px', right: '22px', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid #fff', filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.07))' }} />
                  <div style={{ padding: '1rem 1.2rem 0.75rem', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111' }}>{user?.user?.name || 'User'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>{user?.user?.email || ''}</div>
                  </div>
                  <nav style={{ padding: '0.4rem' }}>
                    {[
                      { to: '/myaccount/info', label: 'Account Information', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg> },
                      { to: '/myaccount/myorders', label: 'My Orders', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> },
                      { to: '/myaccount/myreviews', label: 'My Reviews', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
                      { to: '/myaccount/addresses', label: 'My Addresses', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg> },
                      { to: '/myaccount/wishlist', label: 'My Wishlist', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
                    ].map(({ to, label, icon }) => (
                      <Link key={to} to={to} onClick={() => setShowUserDropdown(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.7rem 1rem', color: '#374151', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ color: '#9ca3af' }}>{icon}</span>{label}
                      </Link>
                    ))}
                  </nav>
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '0.4rem' }}>
                    <button
                      onClick={() => { localStorage.removeItem('user'); window.dispatchEvent(new Event('userChanged')); window.location.href = '/'; }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '0.7rem 1rem', background: 'transparent', border: 'none', color: 'var(--pazaryolu-red)', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', borderRadius: '8px', textAlign: 'left', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" style={{ background: '#fff', color: 'var(--pazaryolu-red)', border: '2px solid #fff', borderRadius: '12px', padding: '0.5rem 1rem', fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none' }}>
              Login
            </Link>
          )}
          <Link to="/cart" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Go to Cart">
            <img src="/cart-icon.png" alt="Cart" style={{ height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} onError={e => e.target.style.display = 'none'} />
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '1rem', marginLeft: '2px' }}>({cartCount})</span>
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "2rem auto", padding: "0 2rem 5rem" }}>

        {/* Stock alert popup */}
        {stockAlert && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none' }}>
            <div style={{ background: '#1a1a1a', color: '#fff', padding: '1.2rem 2rem', borderRadius: '16px', fontWeight: '700', fontSize: '1rem', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', border: '2px solid #b22222', maxWidth: '380px', textAlign: 'center' }}>
              🚫 {stockAlert}
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", padding: "0.6rem 0" }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "0.85rem", fontWeight: "600", padding: 0, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = '#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
          >Home</button>
          <span style={{ color: "#d1d5db" }}>›</span>
          {product.category && <>
            <button
              onClick={() => navigate(`/?category=${encodeURIComponent(product.category)}`)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "0.85rem", fontWeight: "600", padding: 0, textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.color = '#b91c1c'}
              onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
              {product.category}
            </button>
            <span style={{ color: "#d1d5db" }}>›</span>
          </>}
          <span style={{ color: "#374151", fontSize: "0.85rem", fontWeight: "700" }}>{product.name}</span>
        </div>

        {/* Product Card: Image + Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", background: "#fff", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "2.5rem", marginBottom: "1.5rem" }}>

          {/* Left: Image */}
          <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", background: "#f9fafb", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {product.category && (
              <span style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.75rem", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", zIndex: 10 }}>
                {product.category}
              </span>
            )}
            <img
              src={product.image_url || `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`; }}
            />
          </div>

          {/* Right: Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#111", margin: 0, lineHeight: 1.2 }}>{product.name}</h1>

            {/* Rating row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: "#fbbf24", fontSize: "1.1rem" }}>★</span>
              <span style={{ fontWeight: "800", color: "#111", fontSize: "1rem" }}>
                {avgRating || "No ratings yet"}
              </span>
              <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>({reviews.length} reviews)</span>
              <button
                onClick={handleSeeReviews}
                style={{ background: "none", border: "none", color: "#b91c1c", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                See reviews
              </button>
            </div>

            {/* Price */}
            {product.is_on_discount ? (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "800", color: "#b91c1c" }}>
                    ${parseFloat(product.effective_price).toFixed(2)}
                  </span>
                  <span style={{ fontSize: "1.1rem", color: "#9ca3af", textDecoration: "line-through", fontWeight: "600" }}>
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                  <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 10px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: "800" }}>
                    -{parseFloat(product.discount_percentage).toFixed(0)}%
                  </span>
                </div>
                {product.discount_end && (
                  <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#6b7280", fontWeight: "600" }}>
                    Ends {new Date(product.discount_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "#b91c1c" }}>
                ${parseFloat(product.price).toFixed(2)}
              </div>
            )}

            {/* Stock badge */}
            <div>
              {isOutOfStock ? (
                <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700" }}>Out of Stock</span>
              ) : isLowStock ? (
                <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700" }}>Only {product.stock} left!</span>
              ) : (
                <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700" }}>In Stock ({product.stock})</span>
              )}
            </div>

            {/* Short description */}
            {product.description && (
              <p style={{ fontSize: "0.92rem", color: "#6b7280", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {product.description}
              </p>
            )}

            {/* Meta: warranty/distributor/serial */}
            {hasSpecs && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0", borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
                {product.model && <Row label="Model" value={product.model} />}
                {product.warranty && <Row label="Warranty" value={product.warranty} />}
                {product.distributor && <Row label="Distributor" value={product.distributor} />}
                {product.serial_no && <Row label="SKU" value={product.serial_no} />}
              </div>
            )}

            {/* Add to Cart + Wishlist */}
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "auto" }}>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{
                  flex: 1, padding: "1rem", border: "none", borderRadius: "12px",
                  fontSize: "1rem", fontWeight: "800",
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  background: isOutOfStock ? "#e5e7eb" : added ? "#16a34a" : "#b91c1c",
                  color: isOutOfStock ? "#9ca3af" : "#fff",
                  transition: "background 0.2s"
                }}
              >
                {isOutOfStock ? "Unavailable" : added ? "✓ Added to Cart!" : "Add to Cart"}
              </button>
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistBusy}
                title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                style={{
                  width: "58px", padding: "1rem", borderRadius: "12px",
                  border: `2px solid ${inWishlist ? "#b91c1c" : "#e5e7eb"}`,
                  background: inWishlist ? "#fef2f2" : "#fff",
                  color: inWishlist ? "#b91c1c" : "#9ca3af",
                  cursor: wishlistBusy ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s"
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div ref={reviewsRef} style={{ background: "#fff", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>

          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: "1rem 1.5rem", background: "none", border: "none",
                  borderBottom: activeTab === tab.key ? "2px solid #b91c1c" : "2px solid transparent",
                  color: activeTab === tab.key ? "#b91c1c" : "#6b7280",
                  fontWeight: activeTab === tab.key ? "700" : "600",
                  fontSize: "0.9rem", cursor: "pointer", transition: "all 0.15s",
                  marginBottom: "-1px"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "2rem 2.5rem" }}>

            {/* Description tab */}
            {activeTab === 'description' && (
              <div>
                {product.description ? (
                  <p style={{ fontSize: "0.97rem", color: "#374151", lineHeight: 1.8, margin: 0 }}>{product.description}</p>
                ) : (
                  <p style={{ color: "#9ca3af", fontStyle: "italic" }}>No description available.</p>
                )}
              </div>
            )}

            {/* Specifications tab */}
            {activeTab === 'specifications' && (
              <div>
                {hasSpecs ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {product.category && <SpecRow label="Category" value={product.category} />}
                      {product.model && <SpecRow label="Model" value={product.model} />}
                      {product.warranty && <SpecRow label="Warranty" value={product.warranty} />}
                      {product.distributor && <SpecRow label="Distributor" value={product.distributor} />}
                      {product.serial_no && <SpecRow label="SKU / Serial No" value={product.serial_no} />}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: "#9ca3af", fontStyle: "italic" }}>No specifications available.</p>
                )}
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === 'reviews' && (
              <div>
                {/* Header row: title + Add Review button */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#111" }}>
                      Customer Reviews
                      {avgRating && <span style={{ marginLeft: "0.75rem", color: "#fbbf24", fontWeight: "700" }}>★ {avgRating}</span>}
                    </h3>
                    <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "#9ca3af" }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>
                  {hasPurchased && !showReviewForm && (
                    <button
                      onClick={() => { setShowReviewForm(true); setReviewStatus(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        background: "#b91c1c", color: "#fff", border: "none",
                        borderRadius: "10px", padding: "0.6rem 1.2rem",
                        fontWeight: "700", fontSize: "0.875rem", cursor: "pointer"
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                      Write a Review
                    </button>
                  )}
                  {!user && (
                    <a href="/login" style={{ color: "#b91c1c", fontSize: "0.85rem", fontWeight: "700" }}>Login to review</a>
                  )}
                  {user && !hasPurchased && (
                    <span style={{ color: "#9ca3af", fontSize: "0.82rem", fontStyle: "italic" }}>Purchase to leave a review</span>
                  )}
                </div>

                {/* Review form */}
                {showReviewForm && hasPurchased && (
                  <div style={{ background: "#f9fafb", borderRadius: "14px", padding: "1.5rem", marginBottom: "2rem", border: "1px solid #f3f4f6" }}>
                    <h4 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: "700", color: "#111" }}>Your Review</h4>
                    <form onSubmit={handleReviewSubmit}>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#6b7280", marginBottom: "0.4rem", letterSpacing: "0.04em" }}>RATING</label>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n} type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.8rem", color: n <= reviewForm.rating ? "#fbbf24" : "#d1d5db", transition: "color 0.1s", padding: "0 2px" }}
                            >★</button>
                          ))}
                          <span style={{ marginLeft: "0.5rem", alignSelf: "center", fontSize: "0.85rem", color: "#6b7280", fontWeight: "600" }}>{reviewForm.rating}/5</span>
                        </div>
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#6b7280", marginBottom: "0.4rem", letterSpacing: "0.04em" }}>COMMENT</label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          rows="4"
                          style={{ padding: "0.85rem 1rem", borderRadius: "10px", border: "1.5px solid #e5e7eb", width: "100%", boxSizing: "border-box", resize: "vertical", fontSize: "0.92rem", background: "#fff", color: "#111", fontFamily: "inherit" }}
                          placeholder="Share your experience with this product..."
                        />
                      </div>
                      {reviewStatus && (
                        <p style={{ fontSize: "0.875rem", color: reviewStatus.includes("submitted") ? "#16a34a" : "#dc2626", marginBottom: "1rem", fontWeight: "600" }}>
                          {reviewStatus}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button type="submit" style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "0.7rem 1.5rem", borderRadius: "9px", fontWeight: "700", cursor: "pointer", fontSize: "0.875rem" }}>
                          Submit Review
                        </button>
                        <button type="button" onClick={() => { setShowReviewForm(false); setReviewStatus(""); }} style={{ background: "none", border: "1.5px solid #e5e7eb", color: "#374151", padding: "0.7rem 1.25rem", borderRadius: "9px", fontWeight: "600", cursor: "pointer", fontSize: "0.875rem" }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Review list */}
                {visibleReviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 0", color: "#9ca3af" }}>
                    <p style={{ margin: 0, fontWeight: "600" }}>No reviews yet</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>Be the first to review this product!</p>
                  </div>
                ) : (
                  <div>
                    {visibleReviews.map((r, idx) => (
                      <div key={r.id} style={{ paddingTop: idx === 0 ? 0 : "1.5rem", paddingBottom: "1.5rem", borderBottom: idx < visibleReviews.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                        {/* Name + Stars */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <span style={{ fontWeight: "700", color: "#111827", fontSize: "0.95rem" }}>{abbrevName(r.user_name)}</span>
                            {r.status && r.status !== "approved" && (
                              <span style={{ background: "#fef3c7", color: "#d97706", borderRadius: "999px", padding: "2px 8px", fontSize: "0.68rem", fontWeight: "700", textTransform: "capitalize" }}>
                                {r.status}
                              </span>
                            )}
                          </div>
                          <span style={{ color: "#fbbf24", fontSize: "1rem", letterSpacing: "1px" }}>
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          </span>
                        </div>
                        {/* Date */}
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.75rem", fontWeight: "500" }}>
                          {new Date(r.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </div>
                        {/* Comment — only shown after admin approval */}
                        {r.comment && r.status === 'approved' && (
                          <p style={{ fontSize: "0.92rem", color: "#374151", margin: 0, lineHeight: 1.65 }}>{r.comment}</p>
                        )}
                        {r.status === 'pending' && r.user_id === currentUserId && (
                          <p style={{ fontSize: "0.82rem", color: "#d97706", margin: 0, fontStyle: "italic" }}>Your comment is awaiting admin approval.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f9fafb" }}>
    <span style={{ fontSize: "0.82rem", color: "#9ca3af", fontWeight: "600" }}>{label}</span>
    <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: "700" }}>{value}</span>
  </div>
);

const SpecRow = ({ label, value }) => (
  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
    <td style={{ padding: "0.85rem 0", fontSize: "0.85rem", color: "#9ca3af", fontWeight: "600", width: "40%" }}>{label}</td>
    <td style={{ padding: "0.85rem 0", fontSize: "0.9rem", color: "#111827", fontWeight: "600" }}>{value}</td>
  </tr>
);

export default ProductDetail;
