import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const getCartKey = () => {
    if (!user) return "guest_cart";
    const userId = user?.user?.id || user?.id;
    return `cart_user_${userId}`;
  };

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

  const handleSubmit = async (e) => {
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

    const [expMonth, expYear] = form.expiry.split("/");
    const inputMonth = Number(expMonth);
    const inputYear = Number("20" + expYear);

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (inputYear < currentYear || (inputYear === currentYear && inputMonth < currentMonth)) {
        alert("Card expiry date cannot be in the past");
        return;
    }
    const cartKey = getCartKey();
    const cartItems = JSON.parse(localStorage.getItem(cartKey) || "[]");

    if (cartItems.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    try {
        const response = await fetch('http://localhost:5001/api/products/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cartItems })
        });
        
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || "Checkout failed due to stock limitations");
            return;
        }

        // Proceed to clear
        localStorage.removeItem(cartKey);

        const userId = user?.user?.id || user?.id;
        if (userId) {
            await fetch(`http://localhost:5001/api/cart/${userId}`, { method: 'DELETE' }).catch(console.error);
        }

        setSuccess(true);
        console.log(form);
    } catch (err) {
        console.error(err);
        alert("Network error. Please try again.");
    }
  };

if (success) {
  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "5rem auto",
        background: "#fff",
        padding: "3rem",
        borderRadius: "20px",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}
    >
      <h1 style={{ marginBottom: "1rem" }}>Payment Successful</h1>

      <p style={{ marginBottom: "2rem", color: "#666" }}>
        Your order has been placed successfully.
      </p>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        
        <button
          onClick={() => navigate("/")}
          style={{
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

        <button
          onClick={() => navigate("/orders")}
          style={{
            padding: "0.9rem 1.5rem",
            background: "#f3f4f6",
            color: "#111",
            border: "none",
            borderRadius: "10px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          Go to Orders
        </button>

      </div>
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
  border: "1px solid #ccc",
  boxSizing: "border-box"
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