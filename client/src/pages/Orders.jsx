import React from "react";
import { useNavigate } from "react-router-dom";

const Orders = () => {
  const navigate = useNavigate();   // 👈 BURAYA

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>Orders</h1>

      <p style={{ marginTop: "1rem", color: "#666" }}>
        Orders page will be implemented in the next phase.
      </p>

      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "2rem",
          padding: "0.9rem 1.5rem",
          background: "var(--pazaryolu-red)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontWeight: "700",
          cursor: "pointer"
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default Orders;