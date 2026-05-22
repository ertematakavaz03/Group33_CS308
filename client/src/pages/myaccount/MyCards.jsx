import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => currentYear + i);

const emptyForm = { cardholder_name: "", card_number: "", expiry_month: "", expiry_year: "", is_default: false };

const brandColor = (brand) => ({
  Visa: "#1A1F71", Mastercard: "#EB001B", Amex: "#2E77BC", Discover: "#E96D1F"
}[brand] || "#374151");

const MyCards = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;
  const userId = currentUser?.id;

  const load = () => {
    fetch(`http://localhost:5001/api/cards/${userId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setCards(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Failed to load payment methods."); setLoading(false); });
  };

  useEffect(() => {
    if (!userId) { navigate("/login"); return; }
    load();
  }, [userId]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 19);
    const grouped = raw.replace(/(.{4})/g, "$1 ").trim();
    setForm({ ...form, card_number: grouped });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const digits = form.card_number.replace(/\D/g, "");
    if (digits.length < 12) { setFormError("Please enter a valid card number."); return; }
    if (!form.cardholder_name.trim()) { setFormError("Cardholder name is required."); return; }
    if (!form.expiry_month || !form.expiry_year) { setFormError("Please select an expiry date."); return; }

    setBusy(true);
    try {
      const res = await fetch(`http://localhost:5001/api/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cardholder_name: form.cardholder_name.trim(),
          card_number: digits,
          expiry_month: Number(form.expiry_month),
          expiry_year: Number(form.expiry_year),
          is_default: form.is_default
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setForm(emptyForm);
        setShowForm(false);
        load();
        showToast("Card saved securely");
      } else {
        setFormError(data.error || "Failed to save card.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    setBusy(true);
    try {
      const res = await fetch(`http://localhost:5001/api/cards/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) { setCards((prev) => prev.filter((c) => c.id !== id)); showToast("Card removed"); }
    } catch { /* ignore */ }
    finally { setBusy(false); }
  };

  const handleSetDefault = async (id) => {
    setBusy(true);
    try {
      const res = await fetch(`http://localhost:5001/api/cards/${id}/default`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setCards((prev) => prev.map((c) => ({ ...c, is_default: c.id === id })));
        showToast("Default card updated");
      }
    } catch { /* ignore */ }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem" }}>
      <div style={s.spinner} />
      <p style={{ color: "#9CA3AF", marginTop: "1rem" }}>Loading payment methods…</p>
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
          <h1 style={pageHeader.title}>Payment Methods</h1>
          <p style={pageHeader.sub}>{cards.length} saved card{cards.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "12px", fontWeight: "600", fontSize: "0.9rem", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", zIndex: 9999 }}>
          {toast}
        </div>
      )}

      {/* Saved cards */}
      {cards.length === 0 && !showForm ? (
        <div style={{ background: "#fff", borderRadius: "20px", padding: "3.5rem 2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💳</div>
          <h2 style={{ color: "#111827", fontWeight: "800", margin: "0 0 0.5rem" }}>No saved cards</h2>
          <p style={{ color: "#6B7280", marginBottom: "1.5rem" }}>Add a card for faster checkout.</p>
          <button onClick={() => setShowForm(true)} style={s.primaryBtn}>+ Add Card</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {cards.map((card) => (
            <div key={card.id} style={s.cardTile(brandColor(card.card_brand))}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.05em" }}>{card.card_brand}</span>
                {card.is_default && (
                  <span style={{ background: "rgba(255,255,255,0.25)", padding: "2px 9px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: "700" }}>DEFAULT</span>
                )}
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: "700", letterSpacing: "0.12em", margin: "1.4rem 0 1rem" }}>
                {card.masked_number}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: "0.62rem", opacity: 0.7, letterSpacing: "0.08em" }}>CARDHOLDER</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>{card.cardholder_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.62rem", opacity: 0.7, letterSpacing: "0.08em" }}>EXPIRES</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                    {String(card.expiry_month).padStart(2, "0")}/{String(card.expiry_year).slice(-2)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.1rem" }}>
                {!card.is_default && (
                  <button onClick={() => handleSetDefault(card.id)} disabled={busy} style={s.tileBtn}>
                    Set Default
                  </button>
                )}
                <button onClick={() => handleDelete(card.id)} disabled={busy} style={{ ...s.tileBtn, marginLeft: card.is_default ? "auto" : 0 }}>
                  Remove
                </button>
              </div>
            </div>
          ))}

          {!showForm && (
            <button onClick={() => setShowForm(true)} style={s.addTile}>
              <span style={{ fontSize: "2rem", lineHeight: 1 }}>+</span>
              <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>Add New Card</span>
            </button>
          )}
        </div>
      )}

      {/* Add card form */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6", padding: "1.75rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontWeight: "800", color: "#111" }}>Add New Card</h3>
          <form onSubmit={handleSubmit}>
            <label style={s.label}>CARD NUMBER</label>
            <input
              value={form.card_number}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              style={s.input}
            />
            <label style={s.label}>CARDHOLDER NAME</label>
            <input
              value={form.cardholder_name}
              onChange={(e) => setForm({ ...form, cardholder_name: e.target.value })}
              placeholder="Name as printed on card"
              style={s.input}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>EXPIRY MONTH</label>
                <select value={form.expiry_month} onChange={(e) => setForm({ ...form, expiry_month: e.target.value })} style={s.input}>
                  <option value="">MM</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>EXPIRY YEAR</label>
                <select value={form.expiry_year} onChange={(e) => setForm({ ...form, expiry_year: e.target.value })} style={s.input}>
                  <option value="">YYYY</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.5rem 0 1rem", fontSize: "0.85rem", color: "#374151", fontWeight: "600", cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              Set as default card
            </label>

            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "0.7rem 0.9rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontSize: "0.78rem", color: "#15803D", fontWeight: "600" }}>
                Your card number is encrypted (AES-256). We never store your CVV.
              </span>
            </div>

            {formError && (
              <p style={{ background: "#FEF2F2", color: "#DC2626", padding: "0.6rem 0.85rem", borderRadius: "8px", margin: "0 0 1rem", fontSize: "0.85rem", fontWeight: "600" }}>
                {formError}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button type="submit" disabled={busy} style={{ ...s.primaryBtn, cursor: busy ? "wait" : "pointer" }}>
                {busy ? "Saving…" : "Save Card"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(""); }}
                disabled={busy}
                style={{ background: "#E5E7EB", color: "#111", border: "none", padding: "0.85rem 1.5rem", borderRadius: "12px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const pageHeader = {
  background: "var(--pazaryolu-red)", borderRadius: "14px", padding: "1.4rem 1.5rem",
  boxShadow: "0 4px 16px rgba(165,28,28,0.18)", textAlign: "center",
  title: { margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#fff" },
  sub:   { margin: "4px 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", fontWeight: "500" },
};

const s = {
  spinner:    { width: "36px", height: "36px", border: "3px solid #E5E7EB", borderTop: "3px solid var(--pazaryolu-red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  primaryBtn: { padding: "0.85rem 1.75rem", background: "var(--pazaryolu-red)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" },
  label:      { display: "block", fontSize: "0.72rem", fontWeight: "700", color: "#9CA3AF", letterSpacing: "0.06em", margin: "0 0 0.35rem" },
  input:      { width: "100%", boxSizing: "border-box", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontSize: "0.92rem", marginBottom: "1rem", background: "#fff", fontFamily: "inherit" },
  cardTile: (bg) => ({
    background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, color: "#fff",
    borderRadius: "16px", padding: "1.4rem", boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
    display: "flex", flexDirection: "column",
  }),
  tileBtn:    { background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", padding: "0.4rem 0.85rem", borderRadius: "8px", fontWeight: "700", fontSize: "0.75rem", cursor: "pointer" },
  addTile:    { background: "#fff", border: "2px dashed #D1D5DB", borderRadius: "16px", padding: "1.4rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "#6B7280", cursor: "pointer", minHeight: "180px" },
};

export default MyCards;
