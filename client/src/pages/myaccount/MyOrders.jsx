import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STATUS_CONFIG = {
  pending:      { label: "Pending",     bg: "#FFF8E1", color: "#F59E0B", dot: "#F59E0B" },
  preparing:    { label: "Preparing",   bg: "#EFF6FF", color: "#3B82F6", dot: "#3B82F6" },
  processing:   { label: "Processing",  bg: "#EFF6FF", color: "#3B82F6", dot: "#3B82F6" },
  "in-transit": { label: "In-Transit",  bg: "#F0FDF4", color: "#22C55E", dot: "#22C55E" },
  shipped:      { label: "Shipped",     bg: "#F0FDF4", color: "#22C55E", dot: "#22C55E" },
  delivered:    { label: "Delivered",   bg: "#ECFDF5", color: "#16A34A", dot: "#16A34A" },
  cancelled:    { label: "Cancelled",   bg: "#FEF2F2", color: "#EF4444", dot: "#EF4444" },
};

const getStatus = (raw) => STATUS_CONFIG[(raw || "").toLowerCase()] || STATUS_CONFIG.pending;
const fmt = {
  date:  (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
  price: (n)   => "$" + Number(n).toFixed(2),
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError]   = useState("");

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

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    setCancelError("");
    try {
      const res = await fetch(`http://localhost:5001/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
        setConfirmingId(null);
      } else {
        setCancelError(data.error || "Failed to cancel order.");
      }
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem" }}>
      <div style={s.spinner} />
      <p style={{ color: "#9CA3AF", marginTop: "1rem" }}>Loading orders…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ background: "#FEF2F2", borderRadius: "16px", padding: "2rem", textAlign: "center" }}>
      <p style={{ color: "#EF4444", fontWeight: "600" }}>{error}</p>
    </div>
  );

  if (orders.length === 0) return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "4rem 2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center" }}>
      <h2 style={{ color: "#111827", fontWeight: "800", margin: "0 0 0.5rem" }}>No orders yet</h2>
      <p style={{ color: "#6B7280", marginBottom: "2rem" }}>Start shopping to place your first order!</p>
      <button onClick={() => navigate("/")} style={s.primaryBtn}>Start Shopping</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={pageHeader}>
        <div>
          <h1 style={pageHeader.title}>My Orders</h1>
          <p style={pageHeader.sub}>Track and manage your order history</p>
        </div>
      </div>
      {orders.map((order) => {
        const cfg      = getStatus(order.status);
        const isOpen   = expanded === order.id;
        const itemCount = order.items?.length ?? 0;
        const totalQty  = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

        return (
          <div key={order.id} style={s.card}>
            <button onClick={() => toggle(order.id)} style={s.cardHeader}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "left" }}>
                <span style={{ fontWeight: "700", color: "#111827", fontSize: "0.95rem" }}>Order #{order.id}</span>
                <span style={{ color: "#9CA3AF", fontSize: "0.8rem" }}>
                  {fmt.date(order.created_at)} · {totalQty} item{totalQty !== 1 ? "s" : ""} ({itemCount} type{itemCount !== 1 ? "s" : ""})
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: cfg.bg, color: cfg.color, padding: "4px 12px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: "700" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                  {cfg.label}
                </span>
                <span style={{ fontWeight: "800", color: "var(--pazaryolu-red)", fontSize: "1rem", minWidth: "70px", textAlign: "right" }}>
                  {fmt.price(order.total_amount)}
                </span>
                <span style={{ color: "#9CA3AF", fontSize: "0.85rem", display: "inline-block", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
              </div>
            </button>

            {isOpen && (
              <div style={{ borderTop: "1px solid #F3F4F6", padding: "1.5rem" }}>
                <p style={s.sectionLabel}>ITEMS</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={s.itemRow}>
                      <div style={s.itemImg}>
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} />
                          : <span style={{ fontSize: "1.5rem" }}>📦</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", color: "#111827", fontSize: "0.9rem" }}>{item.name || "Product"}</div>
                        <div style={{ color: "#9CA3AF", fontSize: "0.8rem", marginTop: "2px" }}>{item.quantity} × {fmt.price(item.price_at_purchase)}</div>
                      </div>
                      <div style={{ fontWeight: "700", color: "#111827", fontSize: "0.9rem" }}>{fmt.price(item.quantity * item.price_at_purchase)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #F3F4F6", paddingTop: "1rem", marginBottom: "1.5rem" }}>
                  <span style={{ color: "#6B7280", fontSize: "0.9rem", marginRight: "1rem" }}>Order Total</span>
                  <span style={{ fontWeight: "800", color: "var(--pazaryolu-red)", fontSize: "1.1rem" }}>{fmt.price(order.total_amount)}</span>
                </div>
                {(order.shipping_address || order.billing_address) && (
                  <>
                    <p style={s.sectionLabel}>DELIVERY INFORMATION</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {order.shipping_address && (
                        <div style={s.addressBox}>
                          <p style={s.addressType}>SHIPPING ADDRESS</p>
                          <p style={s.addressTitle}>{order.shipping_title}</p>
                          <p style={s.addressText}>{order.shipping_address}</p>
                          <p style={s.addressText}>{order.shipping_city}</p>
                        </div>
                      )}
                      {order.billing_address && (
                        <div style={s.addressBox}>
                          <p style={s.addressType}>BILLING ADDRESS</p>
                          <p style={s.addressTitle}>{order.billing_title}</p>
                          <p style={s.addressText}>{order.billing_address}</p>
                          <p style={s.addressText}>{order.billing_city}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {order.status === "processing" && (
                  <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmingId(order.id); setCancelError(""); }}
                      style={{ background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FCA5A5", padding: "0.65rem 1.4rem", borderRadius: "10px", fontWeight: "700", fontSize: "0.875rem", cursor: "pointer" }}
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {confirmingId !== null && (
        <div
          onClick={() => !cancellingId && setConfirmingId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "16px", padding: "1.75rem", width: "100%", maxWidth: "420px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}
          >
            <h3 style={{ margin: "0 0 0.5rem", fontWeight: "800", color: "#111", fontSize: "1.1rem" }}>Cancel Order #{confirmingId}?</h3>
            <p style={{ margin: "0 0 1.25rem", color: "#6B7280", fontSize: "0.9rem", lineHeight: 1.5 }}>
              This will return the items to stock and you will not be charged. This action cannot be undone.
            </p>
            {cancelError && (
              <p style={{ background: "#FEF2F2", color: "#DC2626", padding: "0.6rem 0.85rem", borderRadius: "8px", margin: "0 0 1rem", fontSize: "0.85rem", fontWeight: "600" }}>
                {cancelError}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button
                onClick={() => setConfirmingId(null)}
                disabled={!!cancellingId}
                style={{ background: "#E5E7EB", color: "#111", border: "none", padding: "0.65rem 1.2rem", borderRadius: "10px", fontWeight: "700", cursor: cancellingId ? "wait" : "pointer" }}
              >
                Keep Order
              </button>
              <button
                onClick={() => handleCancel(confirmingId)}
                disabled={!!cancellingId}
                style={{ background: "#DC2626", color: "#fff", border: "none", padding: "0.65rem 1.4rem", borderRadius: "10px", fontWeight: "700", cursor: cancellingId ? "wait" : "pointer" }}
              >
                {cancellingId ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
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
  card:        { background: "#fff", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #F3F4F6" },
  cardHeader:  { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", background: "none", border: "none", cursor: "pointer" },
  sectionLabel:{ fontSize: "0.72rem", fontWeight: "700", color: "#9CA3AF", letterSpacing: "0.08em", margin: "0 0 0.75rem" },
  itemRow:     { display: "flex", alignItems: "center", gap: "14px", padding: "10px 12px", background: "#FAFAFA", borderRadius: "12px" },
  itemImg:     { width: "52px", height: "52px", background: "#F3F4F6", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  addressBox:  { background: "#F8F9FA", borderRadius: "12px", padding: "1rem" },
  addressType: { fontSize: "0.7rem", fontWeight: "700", color: "#9CA3AF", letterSpacing: "0.08em", margin: "0 0 6px" },
  addressTitle:{ fontWeight: "700", color: "#111827", fontSize: "0.85rem", margin: "0 0 4px" },
  addressText: { color: "#6B7280", fontSize: "0.8rem", margin: "0" },
};

export default MyOrders;
