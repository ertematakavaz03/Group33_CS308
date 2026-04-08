import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    address: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });

  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
  let value = e.target.value;

  if (e.target.name === "cardNumber") {
    let raw = value.replace(/\D/g, "").slice(0, 16);

    value = raw.replace(/(.{4})/g, "$1 ").trim();
  }

  if (e.target.name === "cvv") {
    value = value.replace(/\D/g, "").slice(0, 3);
  }
  if (e.target.name === "expiry") {
    value = value.replace(/\D/g, "").slice(0, 4);
    if (value.length >= 3) {
        value = value.slice(0, 2) + "/" + value.slice(2);
    }
}

  setForm({
    ...form,
    [e.target.name]: value
  });
};

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.address || !form.cardNumber || !form.expiry || !form.cvv) {
        alert("Please fill in all fields");
        return;
    }

    if(form.cvv.length !== 3) {
        alert("CVV must be 3 digits");
        return;
    }
    if (form.cardNumber.replace(/\s/g, "").length !== 16) {
        alert("Card number must be 16 digits");
        return;
    }
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
        alert("Expiry date must be in MM/YY format");
        return;
    }
    const month = Number(form.expiry.split("/")[0]);

    if (month < 1 || month > 12) {
        alert("Month must be between 01 and 12");
        return;
    }

    setSuccess(true);

    console.log(form);
  };

if (success) {
  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>Payment Successful!</h1>

      <button onClick={() => navigate("/")} style={{ margin: "1rem" }}>
        Back to Home
      </button>

      <button onClick={() => navigate("/orders")} style={{ margin: "1rem" }}>
        Go to Orders
      </button>
    </div>
  );
}

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", background: "#fff", padding: "2rem", borderRadius: "20px", boxShadow: "0 10px 24px rgba(0,0,0,0.05)" }}>
      <h1 style={{ marginBottom: "1.5rem", fontWeight: "800", color: "var(--text-dark)" }}>Payment Details</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="cardNumber"
          placeholder="Card Number"
          value={form.cardNumber}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="expiry"
          placeholder="Expiry (MM/YY)"
          value={form.expiry}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="cvv"
          placeholder="CVV"
          value={form.cvv}
          onChange={handleChange}
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>
          Pay Now
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "0.8rem",
  marginBottom: "1rem",
  borderRadius: "8px",
  border: "1px solid #ccc"
};

const buttonStyle = {
  width: "100%",
  padding: "1rem",
  background: "var(--pazaryolu-red)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer"
};

export default Checkout;