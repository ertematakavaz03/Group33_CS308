import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5002/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }
      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem("adminRole", data.role);
      navigate("/admin/dashboard"); 
    } catch {
      setError("Network error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", position: "relative" }}>

      {/* Back to Home */}
      <div style={{ position: "absolute", top: "1.25rem", left: "1.5rem" }}>
        <button
          onClick={() => window.location.href = "http://localhost:5173/"}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px",
            padding: "0.5rem 1rem", fontWeight: "600", fontSize: "0.85rem",
            color: "#374151", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          ← Back to Home
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ background: "#fff", padding: "2.5rem", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
          <h1 style={{ fontWeight: "800", fontSize: "1.8rem", marginBottom: "0.3rem" }}>Admin Panel</h1>
          <p style={{ color: "#6b7280", marginBottom: "2rem" }}>PazarYolu Manager Login</p>

          {error && <p style={{ color: "#dc2626", background: "#fee2e2", padding: "0.7rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
            />
            <button type="submit" style={btnStyle}>Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const inputStyle = { width: "100%", padding: "0.8rem", marginBottom: "1rem", borderRadius: "8px", border: "1px solid #e5e7eb", boxSizing: "border-box", fontSize: "1rem" };
const btnStyle = { width: "100%", padding: "0.9rem", background: "#b91c1c", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "1rem", cursor: "pointer" };

export default AdminLogin;