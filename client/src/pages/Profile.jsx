import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [isApplying, setIsApplying] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUser = user?.user || user;

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    title: "", full_address: "", city: "", district: "", postal_code: ""
  });

  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;
    fetch(`http://localhost:5001/api/addresses/${userId}`)
      .then(r => r.json())
      .then(setSavedAddresses)
      .catch(console.error);
  }, [currentUser?.id]);

  const handleNewAddressChange = (e) =>
    setNewAddressForm({ ...newAddressForm, [e.target.name]: e.target.value });

  const handleSaveNewAddress = async () => {
    const userId = currentUser?.id;
    if (!userId) { alert("You must be logged in to save an address"); return; }
    if (!newAddressForm.title || !newAddressForm.full_address) {
      alert("Please fill in the title and full address."); return;
    }
    try {
      const res = await fetch('http://localhost:5001/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...newAddressForm })
      });
      const data = await res.json();
      if (res.ok) {
        setSavedAddresses([data, ...savedAddresses]);
        setIsAddingAddress(false);
        setNewAddressForm({ title: "", full_address: "", city: "", district: "", postal_code: "" });
      } else { alert("Failed to save address"); }
    } catch { alert("Network error. Please try again."); }
  };

  const initials = (currentUser?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "";

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>

      {/* Top Bar */}
      <div style={{
        background: "var(--pazaryolu-red)", padding: "0 2rem", height: "64px",
        display: "flex", alignItems: "center", gap: "1rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
      }}>
        <button onClick={() => navigate("/")} style={s.backBtn}>← Home</button>
        <span style={{ color: "#fff", fontWeight: "700", fontSize: "1.1rem" }}>My Profile</span>
      </div>

      <div style={{ maxWidth: "760px", margin: "2.5rem auto", padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── Personal Info ── */}
        <div style={s.card}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={s.avatar}>{initials}</div>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.3rem", fontWeight: "800", color: "#111827" }}>
                {currentUser?.name}
              </h2>
              <p style={{ margin: "0 0 6px", color: "#6B7280", fontSize: "0.9rem" }}>{currentUser?.email}</p>
              <span style={{
                display: "inline-block", background: "#FEF2F2", color: "var(--pazaryolu-red)",
                padding: "2px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700"
              }}>{roleLabel}</span>
            </div>
          </div>
        </div>

        {/* ── My Orders ── */}
        <div style={{ ...s.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={s.iconBox}></div>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: "700", color: "#111827" }}>My Orders</h3>
              <p style={{ margin: 0, color: "#6B7280", fontSize: "0.85rem" }}>Track and view your order history</p>
            </div>
          </div>
          <button onClick={() => navigate("/orders")} style={s.primaryBtn}>View Orders →</button>
        </div>

        {/* ── Addresses ── */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={s.iconBox}></div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#111827" }}>Saved Addresses</h3>
            </div>
            <button
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              style={s.ghostBtn}
            >
              {isAddingAddress ? "Cancel" : "+ Add Address"}
            </button>
          </div>

          {/* Add Address Form */}
          {isAddingAddress && (
            <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem", border: "1px dashed #E5E7EB" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={s.label}>Address Title</label>
                  <input name="title" placeholder="e.g. Home, Work" value={newAddressForm.title} onChange={handleNewAddressChange} style={s.input} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={s.label}>Full Address</label>
                  <input name="full_address" placeholder="Street, building no..." value={newAddressForm.full_address} onChange={handleNewAddressChange} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>City</label>
                  <input name="city" placeholder="Istanbul" value={newAddressForm.city} onChange={handleNewAddressChange} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>District</label>
                  <input name="district" placeholder="Kadıköy" value={newAddressForm.district} onChange={handleNewAddressChange} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Postal Code</label>
                  <input name="postal_code" placeholder="34000" value={newAddressForm.postal_code} onChange={handleNewAddressChange} style={s.input} />
                </div>
              </div>
              <button onClick={handleSaveNewAddress} style={s.primaryBtn}>Save Address</button>
            </div>
          )}

          {/* Address List */}
          {savedAddresses.length === 0 && !isAddingAddress ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}></div>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>No saved addresses yet</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {savedAddresses.map(addr => (
                <div key={addr.id} style={s.addressCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}></span>
                    <span style={{ fontWeight: "700", color: "#111827", fontSize: "0.9rem" }}>{addr.title}</span>
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.83rem", color: "#4B5563" }}>{addr.full_address}</p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#9CA3AF" }}>
                    {[addr.district, addr.city, addr.postal_code].filter(Boolean).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Become a Shop Owner ── */}
        <div style={{ ...s.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={s.iconBox}></div>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: "700", color: "#111827" }}>Become a Shop Owner</h3>
              <p style={{ margin: 0, color: "#6B7280", fontSize: "0.85rem" }}>Apply to sell your products on PazarYolu</p>
            </div>
          </div>
          <button
            onClick={() => setIsApplying(true)}
            disabled={isApplying}
            style={isApplying ? { ...s.primaryBtn, background: "#9CA3AF", cursor: "default" } : s.primaryBtn}
          >
            {isApplying ? "Applied" : "Apply Now"}
          </button>
        </div>

      </div>
    </div>
  );
};

const s = {
  card: {
    background: "#fff", borderRadius: "16px",
    padding: "1.5rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
    border: "1px solid #F3F4F6",
  },
  avatar: {
    width: "64px", height: "64px", borderRadius: "50%",
    background: "var(--pazaryolu-red)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "800", fontSize: "1.4rem", flexShrink: 0,
  },
  iconBox: {
    width: "44px", height: "44px", borderRadius: "12px",
    background: "#FEF2F2", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "1.2rem", flexShrink: 0,
  },
  primaryBtn: {
    padding: "0.7rem 1.4rem", background: "var(--pazaryolu-red)", color: "#fff",
    border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "0.88rem",
    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
  },
  ghostBtn: {
    background: "none", border: "1.5px solid #E5E7EB", color: "#374151",
    borderRadius: "10px", padding: "0.5rem 1rem", fontWeight: "600",
    fontSize: "0.85rem", cursor: "pointer",
  },
  addressCard: {
    background: "#F9FAFB", borderRadius: "12px",
    padding: "1rem", border: "1px solid #E5E7EB",
  },
  label: {
    display: "block", fontSize: "0.78rem", fontWeight: "700",
    color: "#6B7280", marginBottom: "4px",
  },
  input: {
    width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px",
    border: "1px solid #E5E7EB", fontSize: "0.9rem",
    background: "#fff", boxSizing: "border-box",
  },
  backBtn: {
    background: "rgba(255,255,255,0.18)", border: "none", color: "#fff",
    borderRadius: "8px", padding: "0.45rem 1rem", cursor: "pointer",
    fontWeight: "600", fontSize: "0.85rem",
  },
};

export default Profile;
