import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AccountInfo = () => {
  const navigate = useNavigate();
  const raw = JSON.parse(localStorage.getItem("user"));
  const currentUser = raw?.user || raw;

  const formatPhoneDisplay = (digits) => {
    const d = String(digits || '').replace(/\D/g, '');
    if (d.length !== 10) return digits || '';
    return `0 (${d.slice(0, 3)}) ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  };

  const formatPhoneInput = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length > 10) digits = digits.slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `0 (${digits}`;
    if (digits.length <= 6) return `0 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 8) return `0 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `0 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  };

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: formatPhoneDisplay(currentUser?.phone),
    tax_id: currentUser?.tax_id || '',
    password: '',
    confirmPassword: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState({ msg: '', error: false });
  const [isApplying, setIsApplying] = useState(false);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`http://localhost:5001/api/addresses/${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => setAddresses(Array.isArray(data) ? data : []))
      .catch(() => setAddresses([]));
  }, [currentUser?.id]);

  const initials = (currentUser?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : "";
  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
  const legacyHomeAddress = currentUser?.home_address;

  const handleChange = (e) => {
    if (e.target.name === 'phone') {
      setForm({ ...form, phone: formatPhoneInput(e.target.value) });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      setStatus({ msg: "Passwords do not match.", error: true });
      return;
    }
    if (form.password && form.password.length < 6) {
      setStatus({ msg: "Password must be at least 6 characters.", error: true });
      return;
    }
    const rawPhoneDigits = form.phone.replace(/\D/g, '');
    const normalizedPhone = rawPhoneDigits.startsWith('0') ? rawPhoneDigits.slice(1) : rawPhoneDigits;
    if (normalizedPhone.length !== 10) {
      setStatus({ msg: "Phone number must be exactly 10 digits.", error: true });
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/auth/update/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: normalizedPhone,
          tax_id: form.tax_id,
          password: form.password || ''
        })
      });
      const data = await res.json();
      if (!res.ok) { setStatus({ msg: data.error || "Update failed.", error: true }); return; }

      // update localStorage
      const updated = { ...raw, user: { ...(raw?.user || raw), ...data.user } };
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('userChanged'));

      setStatus({ msg: "Profile updated successfully!", error: false });
      setIsEditing(false);
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch {
      setStatus({ msg: "Network error. Please try again.", error: true });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Page Header */}
      <div style={{ background: "var(--pazaryolu-red)", borderRadius: "14px", padding: "1.4rem 1.5rem", boxShadow: "0 4px 16px rgba(165,28,28,0.18)", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#fff" }}>Account Information</h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", fontWeight: "500" }}>View and update your personal details</p>
      </div>

      {/* Personal Info Card */}
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={s.avatar}>{initials}</div>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: "800", color: "#111827" }}>{currentUser?.name}</h2>
              <span style={{ display: "inline-block", background: "#FEF2F2", color: "var(--pazaryolu-red)", padding: "2px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700" }}>{roleLabel}</span>
            </div>
          </div>
          {!isEditing && (
            <button onClick={() => { setIsEditing(true); setStatus({ msg: '', error: false }); }} style={s.editBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Profile
            </button>
          )}
        </div>

        {status.msg && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "10px", background: status.error ? "#FEF2F2" : "#ECFDF5", color: status.error ? "#DC2626" : "#16A34A", fontWeight: "600", fontSize: "0.875rem" }}>
            {status.msg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={s.label}>Full Name</label>
            {isEditing
              ? <input name="name" value={form.name} onChange={handleChange} style={s.input} maxLength={255} />
              : <div style={s.value}>{currentUser?.name}</div>}
          </div>
          <div>
            <label style={s.label}>Email Address</label>
            {isEditing
              ? <input name="email" type="email" value={form.email} onChange={handleChange} style={s.input} maxLength={255} />
              : <div style={s.value}>{currentUser?.email}</div>}
          </div>
          <div>
            <label style={s.label}>Phone Number</label>
            {isEditing
              ? <input name="phone" type="tel" value={form.phone} onChange={handleChange} style={s.input} placeholder="0 (5XX) XXX XX XX" maxLength={17} />
              : <div style={s.value}>{formatPhoneDisplay(currentUser?.phone) || '—'}</div>}
          </div>
          <div>
            <label style={s.label}>Tax ID</label>
            {isEditing
              ? <input name="tax_id" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value.replace(/\D/g, '').slice(0, 11) })} style={s.input} placeholder="Optional (10-11 digits)" maxLength={11} inputMode="numeric" />
              : <div style={s.value}>{currentUser?.tax_id || '—'}</div>}
          </div>
        </div>

        <div style={s.addressSummary}>
          <div>
            <label style={s.label}>Default Address</label>
            {defaultAddress ? (
              <>
                <div style={{ fontWeight: "800", color: "#111827", marginTop: "0.35rem" }}>{defaultAddress.title}</div>
                <div style={{ color: "#4B5563", fontSize: "0.9rem", marginTop: "0.25rem", lineHeight: 1.45 }}>{defaultAddress.full_address}</div>
                <div style={{ color: "#9CA3AF", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  {[defaultAddress.district, defaultAddress.city, defaultAddress.postal_code].filter(Boolean).join(", ")}
                </div>
              </>
            ) : legacyHomeAddress ? (
              <div style={{ color: "#4B5563", fontSize: "0.9rem", marginTop: "0.35rem", lineHeight: 1.45 }}>{legacyHomeAddress}</div>
            ) : (
              <div style={{ color: "#9CA3AF", fontSize: "0.9rem", marginTop: "0.35rem" }}>No default address yet.</div>
            )}
          </div>
          <button onClick={() => navigate('/myaccount/addresses')} style={s.ghostBtn}>
            Manage Addresses
          </button>
        </div>

        {isEditing && (
          <>
            <div style={{ height: "1px", background: "#F3F4F6", margin: "1.25rem 0" }} />
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", fontWeight: "700", color: "#9CA3AF", letterSpacing: "0.05em" }}>CHANGE PASSWORD (leave blank to keep current)</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={s.label}>New Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} style={s.input} placeholder="Min. 6 characters" maxLength={128} />
              </div>
              <div>
                <label style={s.label}>Confirm New Password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} style={s.input} placeholder="Repeat password" maxLength={128} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button onClick={handleSave} style={s.primaryBtn}>Save Changes</button>
              <button onClick={() => { setIsEditing(false); setStatus({ msg: '', error: false }); setForm(f => ({ ...f, password: '', confirmPassword: '' })); }} style={s.ghostBtn}>Cancel</button>
            </div>
          </>
        )}
      </div>

      {/* Become a Shop Owner */}
      <div style={{ ...s.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: "700", color: "#111827" }}>Become a Shop Owner</h3>
          <p style={{ margin: 0, color: "#6B7280", fontSize: "0.85rem" }}>Apply to sell your products on PazarYolu</p>
        </div>
        <button
          onClick={() => setIsApplying(true)}
          disabled={isApplying}
          style={isApplying ? { ...s.primaryBtn, background: "#9CA3AF", cursor: "default" } : s.primaryBtn}
        >
          {isApplying ? "Applied ✓" : "Apply Now"}
        </button>
      </div>
    </div>
  );
};

const s = {
  card:       { background: "#fff", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" },
  avatar:     { width: "56px", height: "56px", borderRadius: "50%", background: "var(--pazaryolu-red)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.2rem", flexShrink: 0 },
  label:      { display: "block", fontSize: "0.75rem", fontWeight: "700", color: "#9CA3AF", marginBottom: "5px", letterSpacing: "0.04em" },
  value:      { fontSize: "0.95rem", fontWeight: "600", color: "#111827", padding: "0.65rem 0" },
  input:      { width: "100%", padding: "0.7rem 0.9rem", borderRadius: "9px", border: "1.5px solid #E5E7EB", fontSize: "0.9rem", background: "#f9fafb", color: "#111", boxSizing: "border-box" },
  addressSummary: { marginTop: "1.25rem", borderTop: "1px solid #F3F4F6", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" },
  editBtn:    { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1.5px solid #E5E7EB", color: "#374151", borderRadius: "10px", padding: "0.5rem 1rem", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" },
  primaryBtn: { padding: "0.7rem 1.4rem", background: "var(--pazaryolu-red)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "0.875rem", cursor: "pointer", whiteSpace: "nowrap" },
  ghostBtn:   { background: "none", border: "1.5px solid #E5E7EB", color: "#374151", borderRadius: "10px", padding: "0.7rem 1.25rem", fontWeight: "600", fontSize: "0.875rem", cursor: "pointer" },
};

export default AccountInfo;
