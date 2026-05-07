import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MyReviews = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) { navigate("/login"); return; }
    fetch(`http://localhost:5001/api/products/user-reviews/${currentUser.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setReviews(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentUser?.id]);

  const renderStars = (n) => (
    <span style={{ fontSize: "1rem", letterSpacing: "2px" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? "#F59E0B" : "#D1D5DB" }}>★</span>
      ))}
    </span>
  );

  const fmt = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={s.spinner} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (reviews.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={ph}>
        <h1 style={ph.title}>My Reviews</h1>
        <p style={ph.sub}>Reviews you have submitted for your purchases</p>
      </div>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "4rem 2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center" }}>
        <h2 style={{ color: "#111827", fontWeight: "800", margin: "0 0 0.5rem" }}>No reviews yet</h2>
        <p style={{ color: "#6B7280", marginBottom: "2rem" }}>Purchase a product and share your experience!</p>
        <button onClick={() => navigate("/")} style={s.primaryBtn}>Start Shopping</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cardIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={ph}>
        <h1 style={ph.title}>My Reviews</h1>
        <p style={ph.sub}>Reviews you have submitted for your purchases</p>
      </div>

      {reviews.map((r) => {
        const isHovered = hoveredId === r.id;
        const statusConfig = {
          approved: { bg: "#ECFDF5", color: "#16A34A", label: "Approved" },
          rejected: { bg: "#FEF2F2", color: "#DC2626", label: "Rejected" },
          pending:  { bg: "#FFF8E1", color: "#D97706", label: "Pending"  },
        };
        const sc = statusConfig[r.status] || statusConfig.pending;
        return (
          <div
            key={r.id}
            onMouseEnter={() => setHoveredId(r.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "1.25rem 1.5rem",
              border: isHovered ? "1.5px solid var(--pazaryolu-red)" : "1px solid #F3F4F6",
              boxShadow: isHovered ? "0 6px 24px rgba(165,28,28,0.1)" : "0 2px 12px rgba(0,0,0,0.05)",
              transition: "border 0.2s, box-shadow 0.2s",
              animation: "cardIn 0.25s ease",
              display: "flex", flexDirection: "column", gap: "0.6rem"
            }}
          >
            {/* Row 1: Product name + Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "700", color: "#111827", fontSize: "0.97rem" }}>
                {r.product_name || "Product"}
              </span>
              <span style={{
                background: sc.bg, color: sc.color,
                padding: "3px 12px", borderRadius: "999px",
                fontSize: "0.73rem", fontWeight: "700", letterSpacing: "0.03em"
              }}>
                {sc.label}
              </span>
            </div>

            {/* Row 2: Stars + Date */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {renderStars(r.rating)}
              <span style={{ color: "#9CA3AF", fontSize: "0.78rem", fontWeight: "500" }}>{fmt(r.created_at)}</span>
            </div>

            {/* Row 3: Comment */}
            {r.comment && (
              <p style={{
                margin: 0, color: "#4B5563", fontSize: "0.875rem",
                lineHeight: "1.6", fontStyle: "italic",
                borderLeft: "3px solid #F3F4F6", paddingLeft: "0.75rem"
              }}>
                {r.comment}
              </p>
            )}

            {/* Row 4: Reviewed by + Go to Review */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.25rem", borderTop: "1px solid #F9FAFB" }}>
              <span style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>
                Reviewed by <span style={{ fontWeight: "700", color: "#374151" }}>{currentUser?.name}</span>
              </span>
              <button
                onClick={() => navigate(`/product/${r.product_id}`)}
                style={{
                  background: "none", border: "1px solid #E5E7EB", color: "#374151",
                  borderRadius: "8px", padding: "0.3rem 0.8rem",
                  fontSize: "0.75rem", fontWeight: "600", cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--pazaryolu-red)'; e.currentTarget.style.color = 'var(--pazaryolu-red)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
              >
                [ Go to Review ]
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ph = {
  background: "var(--pazaryolu-red)", borderRadius: "14px", padding: "1.4rem 1.5rem",
  boxShadow: "0 4px 16px rgba(165,28,28,0.18)", textAlign: "center",
  title: { margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#fff" },
  sub:   { margin: "4px 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", fontWeight: "500" },
};

const s = {
  spinner:    { width: "36px", height: "36px", border: "3px solid #E5E7EB", borderTop: "3px solid var(--pazaryolu-red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  primaryBtn: { padding: "0.85rem 2rem", background: "var(--pazaryolu-red)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" },
};

export default MyReviews;
