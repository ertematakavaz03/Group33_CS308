import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  pending:    { label: "Pending",    bg: "#FFF8E1", color: "#F59E0B", dot: "#F59E0B" },
  preparing:  { label: "Preparing",  bg: "#EFF6FF", color: "#3B82F6", dot: "#3B82F6" },
  processing: { label: "Processing", bg: "#EFF6FF", color: "#3B82F6", dot: "#3B82F6" },
  shipped:    { label: "Shipped",    bg: "#F0FDF4", color: "#22C55E", dot: "#22C55E" },
  delivered:  { label: "Delivered",  bg: "#ECFDF5", color: "#16A34A", dot: "#16A34A" },
  cancelled:  { label: "Cancelled",  bg: "#FEF2F2", color: "#EF4444", dot: "#EF4444" },
};

const getStatus = (raw) => STATUS_CONFIG[(raw || "").toLowerCase()] || STATUS_CONFIG.pending;

const fmt = {
  date:  (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
  price: (n)   => "$" + Number(n).toFixed(2),
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(null);

  const user        = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;

  useEffect(() => {
    if (!currentUser?.id) { navigate("/login"); return; }

    fetch(`http://localhost:5001/api/orders/my-orders/${currentUser.id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setOrders(data); setLoading(false); })
      .catch(() => { setError("Failed to load orders."); setLoading(false); });
  }, [currentUser?.id]);

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA" }}>

      {/* Top Bar */}
      <div style={{
        background: "var(--pazaryolu-red)",
        padding: "0 2rem",
        height: "64px",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}>
        <button onClick={() => navigate("/profile")} style={styles.backBtn}>
          ← Profile
        </button>
        <span style={{ color: "#fff", fontWeight: "700", fontSize: "1.1rem" }}>
          My Orders
        </span>
      </div>

      <div style={{ maxWidth: "820px", margin: "2.5rem auto", padding: "0 1.25rem" }}>

        {/* Loading */}
        {loading && (
          <div style={styles.centerBox}>
            <div style={styles.spinner} />
            <p style={{ color: "#9CA3AF", marginTop: "1rem" }}>Loading orders…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ ...styles.centerBox, background: "#FEF2F2", borderRadius: "16px", padding: "2rem" }}>
            <span style={{ fontSize: "2rem" }}>!</span>
            <p style={{ color: "#EF4444", fontWeight: "600", marginTop: "0.5rem" }}>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div style={{ ...styles.centerBox, background: "#fff", borderRadius: "20px", padding: "4rem 2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}></div>
            <h2 style={{ color: "#111827", fontWeight: "800", margin: "0 0 0.5rem" }}>
              No orders yet
            </h2>
            <p style={{ color: "#6B7280", marginBottom: "2rem" }}>
              Start shopping to place your first order!
            </p>
            <button onClick={() => navigate("/")} style={styles.primaryBtn}>
              Start Shopping
            </button>
          </div>
        )}

        {/* Order List */}
        {!loading && !error && orders.map((order) => {
          const cfg       = getStatus(order.status);
          const isOpen    = expanded === order.id;
          const itemCount = order.items?.length ?? 0;
          const totalQty  = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

          return (
            <div key={order.id} style={styles.card}>

              {/* Card Header */}
              <button onClick={() => toggle(order.id)} style={styles.cardHeader}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "left" }}>
                  <span style={{ fontWeight: "700", color: "#111827", fontSize: "0.95rem" }}>
                    Order #{order.id}
                  </span>
                  <span style={{ color: "#9CA3AF", fontSize: "0.8rem" }}>
                    {fmt.date(order.created_at)} · {totalQty} item{totalQty !== 1 ? "s" : ""} ({itemCount} type{itemCount !== 1 ? "s" : ""})
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: cfg.bg, color: cfg.color,
                    padding: "4px 12px", borderRadius: "999px",
                    fontSize: "0.78rem", fontWeight: "700",
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                    {cfg.label}
                  </span>

                  <span style={{ fontWeight: "800", color: "var(--pazaryolu-red)", fontSize: "1rem", minWidth: "70px", textAlign: "right" }}>
                    {fmt.price(order.total_amount)}
                  </span>

                  <span style={{ color: "#9CA3AF", fontSize: "0.85rem", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▼
                  </span>
                </div>
              </button>

              {/* Expanded Detail */}
              {isOpen && (
                <div style={{ borderTop: "1px solid #F3F4F6", padding: "1.5rem" }}>

                  {/* Items */}
                  <p style={styles.sectionLabel}>ITEMS</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={styles.itemRow}>
                        <div style={styles.itemImg}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                            : <span style={{ fontSize: "1.5rem" }}></span>
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "600", color: "#111827", fontSize: "0.9rem" }}>
                            {item.name || "Product"}
                          </div>
                          <div style={{ color: "#9CA3AF", fontSize: "0.8rem", marginTop: "2px" }}>
                            {item.quantity} × {fmt.price(item.price_at_purchase)}
                          </div>
                        </div>
                        <div style={{ fontWeight: "700", color: "#111827", fontSize: "0.9rem" }}>
                          {fmt.price(item.quantity * item.price_at_purchase)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #F3F4F6", paddingTop: "1rem", marginBottom: "1.5rem" }}>
                    <span style={{ color: "#6B7280", fontSize: "0.9rem", marginRight: "1rem" }}>Order Total</span>
                    <span style={{ fontWeight: "800", color: "var(--pazaryolu-red)", fontSize: "1.1rem" }}>
                      {fmt.price(order.total_amount)}
                    </span>
                  </div>

                  {/* Addresses */}
                  {(order.shipping_address || order.billing_address) && (
                    <>
                      <p style={styles.sectionLabel}>DELIVERY INFORMATION</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        {order.shipping_address && (
                          <div style={styles.addressBox}>
                            <p style={styles.addressType}>SHIPPING ADDRESS</p>
                            <p style={styles.addressTitle}>{order.shipping_title}</p>
                            <p style={styles.addressText}>{order.shipping_address}</p>
                            <p style={styles.addressText}>{order.shipping_city}</p>
                          </div>
                        )}
                        {order.billing_address && (
                          <div style={styles.addressBox}>
                            <p style={styles.addressType}>BILLING ADDRESS</p>
                            <p style={styles.addressTitle}>{order.billing_title}</p>
                            <p style={styles.addressText}>{order.billing_address}</p>
                            <p style={styles.addressText}>{order.billing_city}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const styles = {
  backBtn: {
    background: "rgba(255,255,255,0.18)", border: "none", color: "#fff",
    borderRadius: "8px", padding: "0.45rem 1rem", cursor: "pointer",
    fontWeight: "600", fontSize: "0.85rem",
  },
  centerBox: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", textAlign: "center",
  },
  spinner: {
    width: "36px", height: "36px",
    border: "3px solid #E5E7EB",
    borderTop: "3px solid var(--pazaryolu-red)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  primaryBtn: {
    padding: "0.85rem 2rem", background: "var(--pazaryolu-red)", color: "#fff",
    border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer",
  },
  card: {
    background: "#fff", borderRadius: "16px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
    marginBottom: "1rem", overflow: "hidden", border: "1px solid #F3F4F6",
  },
  cardHeader: {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "1.25rem 1.5rem",
    background: "none", border: "none", cursor: "pointer",
  },
  sectionLabel: {
    fontSize: "0.72rem", fontWeight: "700", color: "#9CA3AF",
    letterSpacing: "0.08em", margin: "0 0 0.75rem",
  },
  itemRow: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "10px 12px", background: "#FAFAFA", borderRadius: "12px",
  },
  itemImg: {
    width: "52px", height: "52px", background: "#F3F4F6", borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", flexShrink: 0,
  },
  addressBox:   { background: "#F8F9FA", borderRadius: "12px", padding: "1rem" },
  addressType:  { fontSize: "0.7rem", fontWeight: "700", color: "#9CA3AF", letterSpacing: "0.08em", margin: "0 0 6px" },
  addressTitle: { fontWeight: "700", color: "#111827", fontSize: "0.85rem", margin: "0 0 4px" },
  addressText:  { color: "#6B7280", fontSize: "0.8rem", margin: "0" },
};

export default Orders;
