import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [shippingAddressId, setShippingAddressId] = useState("");
  const [billingAddressId, setBillingAddressId] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    title: "",
    full_address: "",
    city: "",
    district: "",
    postal_code: ""
  });

  const [cardType, setCardType] = useState("");
  const [form, setForm] = useState({
    name: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const getCartKey = () => {
    if (!user) return "guest_cart";
    const userId = currentUser?.id;
    return `cart_user_${userId}`;
  };

  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;
  
    fetch(`http://localhost:5001/api/addresses/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSavedAddresses(data);
          if (data.length > 0) {
             setShippingAddressId(data[0].id);
             setBillingAddressId(data[0].id);
          }
        } else {
          console.error("Invalid addresses data:", data);
        }
      })
      .catch(console.error);
  }, [currentUser?.id]);

  const detectCardType = (value) => {
    const cleaned = value.replace(/\s/g, "");
    if (cleaned.startsWith("4")) return "visa";
    if (cleaned.startsWith("5")) return "mastercard";
    return "";
  };

  const handleChange = (e) => {
    let value = e.target.value;

    if (e.target.name === "cardNumber") {
      let raw = value.replace(/\D/g, "").slice(0, 16);
      value = raw.replace(/(.{4})/g, "$1 ").trim();
      setCardType(detectCardType(value));
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

  const handleNewAddressChange = (e) => {
    setNewAddressForm({
      ...newAddressForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveNewAddress = async () => {
    const userId = currentUser?.id;
    if (!userId) {
       alert("You must be logged in to save an address");
       return;
    }
    if (!newAddressForm.title || !newAddressForm.full_address) {
       alert("Please fill in the title and full address.");
       return;
    }
    
    try {
      const response = await fetch('http://localhost:5001/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          title: newAddressForm.title,
          full_address: newAddressForm.full_address,
          city: newAddressForm.city,
          district: newAddressForm.district,
          postal_code: newAddressForm.postal_code
        })
      });
      const data = await response.json();
      if (response.ok) {
         setSavedAddresses([data, ...savedAddresses]);
         setShippingAddressId(data.id);
         if (sameAsShipping) setBillingAddressId(data.id);
         setIsAddingAddress(false);
         setNewAddressForm({ title: "", full_address: "", city: "", district: "", postal_code: "" });
      } else {
         alert("Failed to save address");
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.cardNumber || !form.expiry || !form.cvv) {
        alert("Please fill in all payment fields");
        return;
    }
    if (!shippingAddressId) {
        alert("Please select a shipping address");
        return;
    }
    if (!sameAsShipping && !billingAddressId) {
        alert("Please select a billing address");
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

    setIsProcessing(true);

    try {
        const totalAmount = cartItems.reduce((sum, item) => {
          return sum + item.price * item.quantity;
        }, 0);
      
        const response = await fetch("http://localhost:5001/api/orders/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: currentUser?.id,
                userEmail: currentUser?.email,
                userName: currentUser?.name,
                items: cartItems,
                totalAmount,
                shippingAddressId,
                billingAddressId: sameAsShipping ? shippingAddressId : billingAddressId
            })
        });

        const data = await response.json();
        if (!response.ok) {
            setIsProcessing(false);
            alert(data.error || "Checkout failed.");
            return;
        }

        // Proceed to clear
        localStorage.removeItem(cartKey);

        const userId = currentUser?.id;
        if (userId) {
            await fetch(`http://localhost:5001/api/cart/${userId}`, { method: 'DELETE' }).catch(console.error);
        }

        const shippingAddr = savedAddresses.find(a => a.id === shippingAddressId);
        setInvoiceData({
            orderId: data.orderId,
            date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
            items: cartItems,
            totalAmount,
            shippingAddress: shippingAddr,
            customerName: currentUser?.name,
            customerEmail: currentUser?.email,
        });
        setSuccess(true);
        setIsProcessing(false);
    } catch (err) {
        console.error(err);
        setIsProcessing(false);
        alert("Network error. Please try again.");
    }
  };

  const renderAddressCards = (selectedId, setSelectedId) => (
    <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px", marginBottom: "1rem" }}>
      {savedAddresses.map(addr => (
        <div 
          key={addr.id} 
          onClick={() => setSelectedId(addr.id)}
          style={{
            border: selectedId === addr.id ? "2px solid var(--pazaryolu-red)" : "1px solid #ccc",
            borderRadius: "8px",
            padding: "15px",
            minWidth: "220px",
            cursor: "pointer",
            background: selectedId === addr.id ? "#fff0f0" : "#fff",
            transition: "all 0.2s"
          }}
        >
          <strong style={{ display: "block", marginBottom: "5px", color: "var(--text-dark)" }}>{addr.title}</strong>
          <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#555" }}>{addr.full_address}</p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#777" }}>
            {addr.city && addr.district ? `${addr.city}, ${addr.district}` : ""} {addr.postal_code}
          </p>
        </div>
      ))}
      {savedAddresses.length === 0 && (
        <p style={{ color: "#777", fontStyle: "italic" }}>No saved addresses found.</p>
      )}
    </div>
  );

  if (isProcessing) {
    return (
      <div style={{ maxWidth: "600px", margin: "5rem auto", background: "#fff", padding: "3rem", borderRadius: "20px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", minHeight: "400px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: "50px", height: "50px", border: "5px solid #f3f3f3", borderTop: "5px solid var(--pazaryolu-red)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "2rem" }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <h2 style={{ marginBottom: "1rem", color: "var(--text-dark)" }}>Processing Order...</h2>
        <p style={{ color: "#666" }}>Please do not close or refresh this page.</p>
      </div>
    );
  }

  if (success && invoiceData) {
    return (
      <div style={{ maxWidth: "680px", margin: "2rem auto", padding: "0 1rem" }}>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        {/* Invoice Card */}
        <div id="invoice-content" style={{ background: "#fff", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ background: "var(--pazaryolu-red)", padding: "2rem", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "800", letterSpacing: "-0.5px" }}>INVOICE</h1>
                <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "0.9rem" }}>PazarYolu Marketplace</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>Order #{invoiceData.orderId}</div>
                <div style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: "4px" }}>{invoiceData.date}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "2rem" }}>

            {/* Customer Info */}
            <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8f9fa", borderRadius: "12px" }}>
              <p style={{ margin: 0, fontWeight: "700", color: "#111", fontSize: "0.8rem", letterSpacing: "0.06em", marginBottom: "6px" }}>BILLED TO</p>
              <p style={{ margin: 0, fontWeight: "600", color: "#111" }}>{invoiceData.customerName}</p>
              <p style={{ margin: "2px 0 0", color: "#666", fontSize: "0.9rem" }}>{invoiceData.customerEmail}</p>
            </div>

            {/* Items Table */}
            <p style={{ margin: "0 0 0.75rem", fontWeight: "700", color: "#111", fontSize: "0.8rem", letterSpacing: "0.06em" }}>ITEMS</p>
            <div style={{ border: "1px solid #f0f0f0", borderRadius: "12px", overflow: "hidden", marginBottom: "1.5rem" }}>
              {/* Table Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "1rem", padding: "0.75rem 1rem", background: "#f8f9fa", fontSize: "0.78rem", fontWeight: "700", color: "#888", letterSpacing: "0.06em" }}>
                <span>PRODUCT</span>
                <span style={{ textAlign: "center" }}>QTY</span>
                <span style={{ textAlign: "right" }}>PRICE</span>
              </div>
              {/* Items */}
              {invoiceData.items.map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "1rem", padding: "0.9rem 1rem", borderTop: "1px solid #f0f0f0", alignItems: "center" }}>
                  <span style={{ fontWeight: "600", color: "#111", fontSize: "0.9rem" }}>{item.name}</span>
                  <span style={{ textAlign: "center", color: "#666", fontSize: "0.9rem" }}>x{item.quantity}</span>
                  <span style={{ textAlign: "right", fontWeight: "600", color: "#111", fontSize: "0.9rem" }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {/* Total Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", padding: "1rem", borderTop: "2px solid #f0f0f0", background: "#fafafa" }}>
                <span style={{ fontWeight: "800", color: "#111" }}>Total</span>
                <span style={{ fontWeight: "800", color: "var(--pazaryolu-red)", fontSize: "1.1rem" }}>${Number(invoiceData.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {invoiceData.shippingAddress && (
              <div style={{ marginBottom: "2rem", padding: "1rem", background: "#f8f9fa", borderRadius: "12px" }}>
                <p style={{ margin: "0 0 6px", fontWeight: "700", color: "#111", fontSize: "0.8rem", letterSpacing: "0.06em" }}>SHIPPING ADDRESS</p>
                <p style={{ margin: 0, fontWeight: "600", color: "#111" }}>{invoiceData.shippingAddress.title}</p>
                <p style={{ margin: "2px 0 0", color: "#666", fontSize: "0.9rem" }}>{invoiceData.shippingAddress.full_address}</p>
                <p style={{ margin: "2px 0 0", color: "#666", fontSize: "0.9rem" }}>
                  {[invoiceData.shippingAddress.district, invoiceData.shippingAddress.city, invoiceData.shippingAddress.postal_code].filter(Boolean).join(", ")}
                </p>
              </div>
            )}

            {/* Confirmation Note */}
            <p style={{ textAlign: "center", color: "#16a34a", fontWeight: "600", fontSize: "0.9rem", marginBottom: "2rem" }}>
              A copy of this invoice has been sent to {invoiceData.customerEmail}
            </p>

            {/* Action Buttons */}
            <div className="no-print" style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={async () => {
                  const res = await fetch(`http://localhost:5001/api/orders/${invoiceData.orderId}/invoice`);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `invoice-order-${invoiceData.orderId}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ flex: 1, padding: "0.9rem", background: "var(--pazaryolu-red)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" }}
              >
                Download PDF
              </button>
              <button
                onClick={() => navigate("/myaccount/myorders")}
                style={{ flex: 1, padding: "0.9rem", background: "#f3f4f6", color: "#111", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" }}
              >
                My Orders
              </button>
              <button
                onClick={() => navigate("/")}
                style={{ flex: 1, padding: "0.9rem", background: "#f3f4f6", color: "#111", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer" }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", background: "#fff", padding: "2rem", borderRadius: "20px", boxShadow: "0 10px 24px rgba(0,0,0,0.05)", position: "relative" }}>
      <button onClick={() => navigate("/cart")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#111", padding: 0, display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", position: "absolute", top: "2rem", left: "2rem" }}>
        ← Back
      </button>

      <h1 style={{ marginBottom: "2rem", fontWeight: "800", color: "var(--text-dark)", textAlign: "center" }}>Checkout</h1>

      {/* Address Section */}
      <div style={{ marginBottom: "2.5rem", padding: "1.5rem", background: "#f9fafb", borderRadius: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.4rem", margin: 0, color: "var(--text-dark)" }}>Shipping Address</h2>
          <button 
            type="button"
            onClick={() => setIsAddingAddress(!isAddingAddress)}
            style={{ background: "none", border: "none", color: "var(--pazaryolu-red)", fontWeight: "600", cursor: "pointer" }}
          >
            {isAddingAddress ? "Cancel" : "+ Add New Address"}
          </button>
        </div>

        {isAddingAddress ? (
          <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
            <h3 style={{ marginTop: 0, fontSize: "1.1rem" }}>New Address</h3>
            <input name="title" placeholder="Address Title (e.g. Home, Work)" value={newAddressForm.title} onChange={handleNewAddressChange} style={inputStyle} />
            <input name="full_address" placeholder="Full Address" value={newAddressForm.full_address} onChange={handleNewAddressChange} style={inputStyle} />
            <div style={{ display: "flex", gap: "10px" }}>
              <input name="city" placeholder="City" value={newAddressForm.city} onChange={handleNewAddressChange} style={inputStyle} />
              <input name="district" placeholder="District" value={newAddressForm.district} onChange={handleNewAddressChange} style={inputStyle} />
              <input name="postal_code" placeholder="Postal Code" value={newAddressForm.postal_code} onChange={handleNewAddressChange} style={inputStyle} />
            </div>
            <button type="button" onClick={handleSaveNewAddress} style={{ padding: "0.8rem 1.5rem", background: "#111", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Save Address</button>
          </div>
        ) : (
          renderAddressCards(shippingAddressId, setShippingAddressId)
        )}

        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "1rem", fontWeight: "500", color: "#444" }}>
          <input 
            type="checkbox" 
            checked={sameAsShipping} 
            onChange={(e) => setSameAsShipping(e.target.checked)} 
            style={{ width: "18px", height: "18px", accentColor: "var(--pazaryolu-red)" }}
          />
          Billing address is the same as Shipping address
        </label>

        {!sameAsShipping && (
          <div style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem", color: "var(--text-dark)" }}>Billing Address</h2>
            {renderAddressCards(billingAddressId, setBillingAddressId)}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: "1.4rem", marginBottom: "1.5rem", color: "var(--text-dark)" }}>Payment Details</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name on Card" value={form.name} onChange={handleChange} style={inputStyle} />

        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <input name="cardNumber" placeholder="Card Number" value={form.cardNumber} onChange={handleChange} style={{ ...inputStyle, marginBottom: 0, paddingRight: "70px" }} />
          {cardType === "visa" && (
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg/960px-Visa_Inc._logo_%282021%E2%80%93present%29.svg.png" alt="Visa" style={cardLogoStyle} />
          )}
          {cardType === "mastercard" && (
            <img src="https://assets.weforum.org/organization/image/pyHyiLnMaQXMa0TXz0PB17X110sq_ESvDuHREqKIKP0.jpg" alt="Mastercard" style={{ ...cardLogoStyle, width: "48px", height: "30px", objectFit: "cover" }} />
          )}
        </div>

        <div style={{ display: "flex", gap: "15px", marginBottom: "1.5rem" }}>
          <input name="expiry" placeholder="Expiry (MM/YY)" value={form.expiry} onChange={handleChange} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
          <input name="cvv" placeholder="CVV" value={form.cvv} onChange={handleChange} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        </div>

        <button type="submit" style={buttonStyle}>Complete Order</button>
      </form>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "1rem",
  marginBottom: "1rem",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  fontSize: "1rem",
  background: "#fff"
};

const cardLogoStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "42px",
  height: "26px",
  objectFit: "contain",
  background: "#fff",
  padding: "2px",
  borderRadius: "4px"
};

const buttonStyle = {
  width: "100%",
  padding: "1.2rem",
  background: "var(--pazaryolu-red)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  fontSize: "1.1rem",
  cursor: "pointer",
  transition: "background 0.2s"
};

export default Checkout;