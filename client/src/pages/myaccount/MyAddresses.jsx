import React, { useState, useEffect } from 'react';

const emptyForm = { title: "", full_address: "", city: "", district: "", postal_code: "" };

const AddressForm = ({ form, onChange, onSave, onCancel, saveLabel }) => (
  <div style={s.card}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
      <div style={{ gridColumn: "span 2" }}>
        <label style={s.label}>Address Title *</label>
        <input name="title" placeholder="e.g. Home, Work" value={form.title} onChange={onChange} style={s.input} maxLength={100} />
      </div>
      <div style={{ gridColumn: "span 2" }}>
        <label style={s.label}>Full Address *</label>
        <input name="full_address" placeholder="Street, building no, apartment..." value={form.full_address} onChange={onChange} style={s.input} maxLength={500} />
      </div>
      <div>
        <label style={s.label}>City</label>
        <input name="city" placeholder="Istanbul" value={form.city} onChange={onChange} style={s.input} maxLength={100} />
      </div>
      <div>
        <label style={s.label}>District</label>
        <input name="district" placeholder="Kadıköy" value={form.district} onChange={onChange} style={s.input} maxLength={100} />
      </div>
      <div>
        <label style={s.label}>Postal Code</label>
        <input
          name="postal_code"
          placeholder="34000"
          value={form.postal_code}
          onChange={e => { if (/^\d*$/.test(e.target.value)) onChange(e); }}
          inputMode="numeric"
          maxLength={5}
          style={s.input}
        />
      </div>
    </div>
    <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
      <button onClick={onSave} style={s.primaryBtn}>{saveLabel}</button>
      <button onClick={onCancel} style={s.ghostBtn}>Cancel</button>
    </div>
  </div>
);

const MyAddresses = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUser = user?.user || user;

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;
    fetch(`http://localhost:5001/api/addresses/${userId}`)
      .then(r => r.json()).then(setSavedAddresses).catch(console.error);
  }, [currentUser?.id]);

  const handleAdd = async () => {
    const userId = currentUser?.id;
    if (!newForm.title || !newForm.full_address) { alert("Please fill in the title and full address."); return; }
    try {
      const res = await fetch('http://localhost:5001/api/addresses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...newForm })
      });
      const data = await res.json();
      if (res.ok) { setSavedAddresses(prev => [data, ...prev]); setIsAddingAddress(false); setNewForm(emptyForm); }
      else alert("Failed to save address");
    } catch { alert("Network error."); }
  };

  const handleEdit = async (id) => {
    if (!editForm.title || !editForm.full_address) { alert("Please fill in the title and full address."); return; }
    try {
      const res = await fetch(`http://localhost:5001/api/addresses/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) { setSavedAddresses(prev => prev.map(a => a.id === id ? data : a)); setEditingId(null); }
      else alert("Failed to update address");
    } catch { alert("Network error."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/addresses/${id}`, { method: 'DELETE' });
      if (res.ok) setSavedAddresses(prev => prev.filter(a => a.id !== id));
      else alert("Failed to delete address");
    } catch { alert("Network error."); }
  };

  const handleSetDefault = async (id) => {
    const userId = currentUser?.id;
    try {
      const res = await fetch(`http://localhost:5001/api/addresses/${id}/default`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok) {
        setSavedAddresses(prev =>
          prev
            .map(a => ({ ...a, is_default: a.id === data.id }))
            .sort((a, b) => Number(b.is_default) - Number(a.is_default))
        );
      } else {
        alert(data.error || "Failed to set default address");
      }
    } catch { alert("Network error."); }
  };

  const startEdit = (addr) => {
    setEditingId(addr.id);
    setEditForm({ title: addr.title, full_address: addr.full_address, city: addr.city || "", district: addr.district || "", postal_code: addr.postal_code || "" });
    setIsAddingAddress(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <style>{`
        @keyframes cardIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Page Header */}
      <div style={{ background: "var(--pazaryolu-red)", borderRadius: "14px", padding: "1.4rem 1.5rem", boxShadow: "0 4px 16px rgba(165,28,28,0.18)", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#fff" }}>My Addresses</h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", fontWeight: "500" }}>Manage your saved delivery addresses</p>
      </div>

      {/* Add Form */}
      {isAddingAddress && (
        <AddressForm
          form={newForm}
          onChange={e => setNewForm({ ...newForm, [e.target.name]: e.target.value })}
          onSave={handleAdd}
          onCancel={() => { setIsAddingAddress(false); setNewForm(emptyForm); }}
          saveLabel="Save Address"
        />
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Add card — always first */}
        <button
          onClick={() => { setIsAddingAddress(true); setEditingId(null); }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--pazaryolu-red)'; e.currentTarget.style.background = '#FEF2F2'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff'; }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            border: "2px dashed #E5E7EB", background: "#fff", borderRadius: "14px",
            cursor: "pointer", gap: "0.5rem", minHeight: "130px", transition: "border-color 0.2s, background 0.2s",
            padding: "1rem"
          }}
        >
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pazaryolu-red)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span style={{ fontWeight: "700", color: "var(--pazaryolu-red)", fontSize: "0.875rem" }}>Add New Address</span>
        </button>

        {/* Address cards */}
        {savedAddresses.map(addr => (
          <div key={addr.id} style={{ animation: "cardIn 0.25s ease" }}>
            {editingId === addr.id ? (
              <AddressForm
                form={editForm}
                onChange={e => setEditForm({ ...editForm, [e.target.name]: e.target.value })}
                onSave={() => handleEdit(addr.id)}
                onCancel={() => setEditingId(null)}
                saveLabel="Update Address"
              />
            ) : (
              <div
                onMouseEnter={() => setHoveredId(addr.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: "#fff", borderRadius: "14px", padding: "1.1rem 1.25rem",
                  border: hoveredId === addr.id ? "1.5px solid var(--pazaryolu-red)" : "1px solid #F3F4F6",
                  boxShadow: hoveredId === addr.id ? "0 6px 20px rgba(165,28,28,0.1)" : "0 2px 12px rgba(0,0,0,0.05)",
                  transition: "border 0.2s, box-shadow 0.2s",
                  minHeight: "130px", display: "flex", flexDirection: "column", justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--pazaryolu-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span style={{ fontWeight: "700", color: "#111827", fontSize: "0.9rem" }}>{addr.title}</span>
                    {addr.is_default && (
                      <span style={{ marginLeft: "auto", background: "#ECFDF5", color: "#16A34A", borderRadius: "999px", padding: "2px 8px", fontSize: "0.68rem", fontWeight: "800" }}>
                        Default
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "0 0 3px", fontSize: "0.82rem", color: "#4B5563", lineHeight: "1.4" }}>{addr.full_address}</p>
                  <p style={{ margin: 0, fontSize: "0.77rem", color: "#9CA3AF" }}>
                    {[addr.district, addr.city, addr.postal_code].filter(Boolean).join(", ")}
                  </p>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem" }}>
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "0.45rem 0.75rem", background: "#ECFDF5", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "0.78rem", color: "#16A34A", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ECFDF5'}
                    >
                      Default
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(addr)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "0.45rem 0.75rem", background: "#F3F4F6", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "0.78rem", color: "#374151", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                    onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "0.45rem 0.75rem", background: "#FEF2F2", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "0.78rem", color: "var(--pazaryolu-red)", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FECACA'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const s = {
  card:       { background: "#fff", borderRadius: "16px", padding: "1.25rem 1.5rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" },
  primaryBtn: { padding: "0.65rem 1.25rem", background: "var(--pazaryolu-red)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "0.875rem", cursor: "pointer" },
  ghostBtn:   { background: "none", border: "1.5px solid #E5E7EB", color: "#374151", borderRadius: "10px", padding: "0.65rem 1.25rem", fontWeight: "600", fontSize: "0.875rem", cursor: "pointer" },
  label:      { display: "block", fontSize: "0.78rem", fontWeight: "700", color: "#6B7280", marginBottom: "4px" },
  input:      { width: "100%", padding: "0.7rem 0.9rem", borderRadius: "9px", border: "1.5px solid #E5E7EB", fontSize: "0.9rem", background: "#f9fafb", color: "#111", boxSizing: "border-box" },
};

export default MyAddresses;
