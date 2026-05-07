import React from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";

const NAV_ITEMS = [
  {
    to: "/myaccount/info",
    label: "Account Information",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    to: "/myaccount/myorders",
    label: "My Orders",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    to: "/myaccount/myreviews",
    label: "My Reviews",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    to: "/myaccount/addresses",
    label: "My Addresses",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
];

const MyAccount = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;
  const initials = (currentUser?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Navbar — same structure as Dashboard */}
      <header className="navbar" style={{ backgroundColor: 'var(--pazaryolu-red)', borderBottom: 'none' }}>
        <div className="navbar-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/">
            <img src="/logo.png" alt="PazarYolu Logo" className="navbar-logo" />
          </Link>
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '1rem', letterSpacing: '0.01em' }}>
            My Account
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '10px', padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
          >
            ← Back to Home
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "2.5rem auto", padding: "0 1.25rem", display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.75rem", alignItems: "start" }}>

        {/* Sidebar */}
        <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", overflow: "hidden" }}>

          {/* User header */}
          <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--pazaryolu-red)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem", flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentUser?.name}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentUser?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ padding: "0.6rem" }}>
            {NAV_ITEMS.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: "11px",
                  padding: "0.75rem 1rem", borderRadius: "10px",
                  textDecoration: "none", fontWeight: "600", fontSize: "0.875rem",
                  color: isActive ? "var(--pazaryolu-red)" : "#374151",
                  background: isActive ? "#FEF2F2" : "transparent",
                  transition: "background 0.15s, color 0.15s",
                  marginBottom: "2px"
                })}
                onMouseEnter={e => { if (!e.currentTarget.style.background.includes('FEF2F2')) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (!e.currentTarget.style.background.includes('FEF2F2')) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ flexShrink: 0, opacity: 0.7 }}>{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Divider + Sign Out */}
          <div style={{ borderTop: "1px solid #f3f4f6", padding: "0.6rem" }}>
            <button
              onClick={() => {
                localStorage.removeItem('user');
                window.dispatchEvent(new Event('userChanged'));
                window.location.href = '/';
              }}
              style={{
                display: "flex", alignItems: "center", gap: "11px",
                width: "100%", padding: "0.75rem 1rem",
                background: "transparent", border: "none",
                color: "var(--pazaryolu-red)", fontWeight: "700",
                fontSize: "0.875rem", cursor: "pointer", borderRadius: "10px",
                textAlign: "left", transition: "background 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
