import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const fmtPrice = (n) => "$" + Number(n).toFixed(2);

const MyWishlist = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;
  const userId = currentUser?.id;

  const getCartKey = () => userId ? `cart_user_${userId}` : "guest_cart";

  useEffect(() => {
    if (!userId) { navigate("/login"); return; }
    fetch(`http://localhost:5001/api/wishlist/${userId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Failed to load wishlist."); setLoading(false); });
  }, [userId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1800); };

  const handleRemove = async (productId) => {
    setBusyId(productId);
    try {
      const res = await fetch(`http://localhost:5001/api/wishlist/${userId}/${productId}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== productId));
        window.dispatchEvent(new Event('wishlistChanged'));
      }
    } catch (err) { console.error(err); }
    finally { setBusyId(null); }
  };

  const handleAddToCart = async (product) => {
    if (product.stock <= 0) { showToast("Out of stock"); return; }
    const cartKey = getCartKey();
    const existing = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const found = existing.find((i) => i.id === product.id);
    let updated;
    if (found) {
      if (found.quantity >= product.stock) { showToast(`Only ${product.stock} in stock`); return; }
      updated = existing.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      updated = [...existing, { ...product, quantity: 1 }];
    }
    localStorage.setItem(cartKey, JSON.stringify(updated));
    try {
      await fetch(`http://localhost:5001/api/cart/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });
    } catch (err) { console.error(err); }
    showToast(`Added "${product.name}" to cart`);
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem" }}>
      <div style={s.spinner} />
      <p style={{ color: "#9CA3AF", marginTop: "1rem" }}>Loading wishlist…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ background: "#FEF2F2", borderRadius: "16px", padding: "2rem", textAlign: "center" }}>
      <p style={{ color: "#EF4444", fontWeight: "600" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={pageHeader}>
        <div>
          <h1 style={pageHeader.title}>My Wishlist</h1>
          <p style={pageHeader.sub}>{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "12px", fontWeight: "600", fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "20px", padding: "4rem 2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🤍</div>
          <h2 style={{ color: "#111827", fontWeight: "800", margin: "0 0 0.5rem" }}>Your wishlist is empty</h2>
          <p style={{ color: "#6B7280", marginBottom: "2rem" }}>Tap the heart on any product to save it here.</p>
          <button onClick={() => navigate("/")} style={s.primaryBtn}>Browse Products</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {items.map((product) => {
            const out = product.stock <= 0;
            return (
              <div key={product.id} style={s.card}>
                <Link to={`/product/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={s.imgWrap}>
                    {product.is_on_discount && (
                      <span style={s.discountBadge}>-{parseFloat(product.discount_percentage).toFixed(0)}%</span>
                    )}
                    <img
                      src={product.image_url || `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}`; }}
                    />
                  </div>
                </Link>
                <div style={{ padding: "1rem 1.1rem 1.1rem" }}>
                  <Link to={`/product/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h3 style={s.name}>{product.name}</h3>
                  </Link>
                  {product.category && <p style={s.category}>{product.category}</p>}
                  <div style={{ marginTop: "0.6rem", display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "800", color: "var(--pazaryolu-red)", fontSize: "1.15rem" }}>
                      {fmtPrice(product.effective_price ?? product.price)}
                    </span>
                    {product.is_on_discount && (
                      <span style={{ color: "#9CA3AF", textDecoration: "line-through", fontSize: "0.85rem", fontWeight: "600" }}>
                        {fmtPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: "0.4rem" }}>
                    {out
                      ? <span style={s.outBadge}>Out of stock</span>
                      : <span style={s.stockBadge}>In stock ({product.stock})</span>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={out}
                      style={{
                        flex: 1, padding: "0.65rem 0.75rem", borderRadius: "10px",
                        border: "none", fontWeight: "700", fontSize: "0.85rem",
                        background: out ? "#e5e7eb" : "var(--pazaryolu-red)",
                        color: out ? "#9CA3AF" : "#fff",
                        cursor: out ? "not-allowed" : "pointer"
                      }}
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(product.id)}
                      disabled={busyId === product.id}
                      title="Remove from wishlist"
                      style={{
                        width: "42px", padding: "0.65rem", borderRadius: "10px",
                        border: "1.5px solid #fecaca", background: "#fff", color: "var(--pazaryolu-red)",
                        cursor: busyId === product.id ? "wait" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const pageHeader = {
  background: "var(--pazaryolu-red)", borderRadius: "14px", padding: "1.4rem 1.5rem",
  boxShadow: "0 4px 16px rgba(165,28,28,0.18)",
  textAlign: "center",
  title: { margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#fff" },
  sub:   { margin: "4px 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", fontWeight: "500" },
};

const s = {
  spinner:     { width: "36px", height: "36px", border: "3px solid #E5E7EB", borderTop: "3px solid var(--pazaryolu-red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  primaryBtn:  { padding: "0.85rem 2rem", background: "var(--pazaryolu-red)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" },
  card:        { background: "#fff", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #F3F4F6", display: "flex", flexDirection: "column" },
  imgWrap:     { position: "relative", width: "100%", aspectRatio: "4/3", background: "#f9fafb", overflow: "hidden" },
  discountBadge: { position: "absolute", top: "10px", left: "10px", background: "#dc2626", color: "#fff", padding: "4px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: "800", zIndex: 5 },
  name:        { margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#111827", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  category:    { margin: "4px 0 0", color: "#9CA3AF", fontSize: "0.75rem", fontWeight: "600" },
  stockBadge:  { background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "700" },
  outBadge:    { background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "700" },
};

export default MyWishlist;
