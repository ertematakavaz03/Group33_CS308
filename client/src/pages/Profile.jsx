import React, { useState } from 'react';

const Profile = () => {
  const [isApplying, setIsApplying] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const handleApply = () => {
    console.log('Applying for Shop Owner Role...');
    
    setIsApplying(true);
  };

  return (
  <div
    className="container"
    style={{
      maxWidth: "900px",
      margin: "2rem auto",
      padding: "2rem"
    }}
  >
    <h2
      style={{
        textAlign: "center",
        marginBottom: "2rem",
        fontSize: "2.2rem",
        fontWeight: "800",
        color: "var(--text-dark)"
      }}
    >
      Your <span style={{ color: "var(--pazaryolu-red)" }}>Profile</span>
    </h2>

    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "2rem",
        boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
        marginBottom: "2rem"
      }}
    >
      <h3
        style={{
          marginBottom: "1.2rem",
          fontSize: "1.5rem",
          color: "var(--text-dark)"
        }}
      >
        Personal Information
      </h3>

      <p><strong>Name:</strong> {user?.user?.name}</p>
      <p><strong>Email:</strong> {user?.user?.email}</p>
      <p>
        <strong>Role:</strong>{" "}
        {user?.user?.role
          ? user.user.role.charAt(0).toUpperCase() + user.user.role.slice(1)
          : ""}
      </p>
    </div>

    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "2rem",
        boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
        marginBottom: "2rem"
      }}
    >
      <h3
        style={{
          marginBottom: "1rem",
          fontSize: "1.5rem",
          color: "var(--text-dark)"
        }}
      >
        Become a Shop Owner
      </h3>

      <p style={{ marginBottom: "1.2rem", color: "var(--text-muted)" }}>
        Want to sell your own products? Apply to become a shop owner today.
      </p>

      <button
        onClick={handleApply}
        disabled={isApplying}
        style={{
          padding: "0.9rem 1.4rem",
          background: "var(--pazaryolu-red)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "700"
        }}
      >
        {isApplying ? "Application Sent (Pending Approval)" : "Apply Now"}
      </button>
    </div>

    <div style={{ textAlign: "center" }}>
      <button
        onClick={() => window.location.href = "/"}
        style={{
          padding: "0.9rem 1.4rem",
          background: "#fff",
          color: "var(--text-dark)",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "700"
        }}
      >
        Back to Home
      </button>
    </div>
  </div>
);
};

export default Profile;
