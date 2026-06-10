import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MyNotifications = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;
  const userId = currentUser?.id;

  useEffect(() => {
    if (!userId) { navigate("/login"); return; }
    fetch(`http://localhost:5001/api/notifications/${userId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Failed to load notifications."); setLoading(false); });
  }, [userId, navigate]);

  const markRead = async (id) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    try {
      await fetch(`http://localhost:5001/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem" }}>
      <div style={s.spinner} />
      <p style={{ color: "#9CA3AF", marginTop: "1rem" }}>Loading notifications...</p>
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
        <h1 style={pageHeader.title}>Notifications</h1>
        <p style={pageHeader.sub}>{items.filter((n) => !n.is_read).length} unread update{items.filter((n) => !n.is_read).length === 1 ? "" : "s"}</p>
      </div>

      {items.length === 0 ? (
        <div style={s.empty}>
          <h2 style={{ color: "#111827", fontWeight: "800", margin: "0 0 0.5rem" }}>No notifications yet</h2>
          <p style={{ color: "#6B7280", margin: 0 }}>Wishlist discounts and refund decisions will appear here.</p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} style={{ ...s.card, borderColor: item.is_read ? "#F3F4F6" : "#FCA5A5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{
                    background: item.type === "refund" ? "#ECFDF5" : "#FEF2F2",
                    color: item.type === "refund" ? "#16A34A" : "var(--pazaryolu-red)",
                    padding: "3px 9px",
                    borderRadius: "999px",
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    textTransform: "uppercase"
                  }}>
                    {item.type}
                  </span>
                  {!item.is_read && <span style={s.unread}>New</span>}
                </div>
                <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem", color: "#111827" }}>{item.title}</h3>
                <p style={{ margin: 0, color: "#4B5563", fontSize: "0.9rem", lineHeight: 1.55 }}>{item.message}</p>
                <p style={{ margin: "0.65rem 0 0", color: "#9CA3AF", fontSize: "0.78rem", fontWeight: "600" }}>
                  {new Date(item.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              {!item.is_read && (
                <button onClick={() => markRead(item.id)} style={s.ghostBtn}>Mark read</button>
              )}
            </div>
          </div>
        ))
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
  spinner: { width: "36px", height: "36px", border: "3px solid #E5E7EB", borderTop: "3px solid var(--pazaryolu-red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  empty: { background: "#fff", borderRadius: "20px", padding: "4rem 2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center" },
  card: { background: "#fff", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1.5px solid #F3F4F6", padding: "1.25rem" },
  unread: { background: "#111827", color: "#fff", padding: "3px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: "800" },
  ghostBtn: { background: "#fff", border: "1.5px solid #E5E7EB", color: "#374151", borderRadius: "10px", padding: "0.45rem 0.9rem", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" },
};

export default MyNotifications;
