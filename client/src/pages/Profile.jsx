import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [isApplying, setIsApplying] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUser = user?.user || user;

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    title: "",
    full_address: "",
    city: "",
    district: "",
    postal_code: ""
  });

  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) return;
  
    fetch(`http://localhost:5001/api/addresses/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setSavedAddresses(data);
      })
      .catch(console.error);
  }, [currentUser?.id]);

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
          user_id: userId,
          ...newAddressForm
        })
      });
      const data = await response.json();
      if (response.ok) {
         setSavedAddresses([data, ...savedAddresses]);
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

    {/* Address Section */}
    <div
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "2rem",
        boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
        marginBottom: "2rem"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-dark)" }}>
          Address Information
        </h3>
        <button 
          type="button"
          onClick={() => setIsAddingAddress(!isAddingAddress)}
          style={{ background: "none", border: "none", color: "var(--pazaryolu-red)", fontWeight: "600", cursor: "pointer" }}
        >
          {isAddingAddress ? "Cancel" : "+ Add New Address"}
        </button>
      </div>

      {isAddingAddress && (
        <div style={{ background: "#f9fafb", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
          <h4 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem" }}>New Address</h4>
          <input name="title" placeholder="Address Title (e.g. Home, Work)" value={newAddressForm.title} onChange={handleNewAddressChange} style={inputStyle} />
          <input name="full_address" placeholder="Full Address" value={newAddressForm.full_address} onChange={handleNewAddressChange} style={inputStyle} />
          <div style={{ display: "flex", gap: "10px" }}>
            <input name="city" placeholder="City" value={newAddressForm.city} onChange={handleNewAddressChange} style={inputStyle} />
            <input name="district" placeholder="District" value={newAddressForm.district} onChange={handleNewAddressChange} style={inputStyle} />
            <input name="postal_code" placeholder="Postal Code" value={newAddressForm.postal_code} onChange={handleNewAddressChange} style={inputStyle} />
          </div>
          <button type="button" onClick={handleSaveNewAddress} style={{ padding: "0.8rem 1.5rem", background: "#111", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Save Address</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {savedAddresses.map(addr => (
          <div 
            key={addr.id} 
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "15px",
              background: "#fafafa"
            }}
          >
            <strong style={{ display: "block", marginBottom: "5px", color: "var(--text-dark)", fontSize: "1.1rem" }}>{addr.title}</strong>
            <p style={{ margin: "5px 0", fontSize: "0.95rem", color: "#555" }}>{addr.full_address}</p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#777" }}>
              {addr.city && addr.district ? `${addr.city}, ${addr.district}` : ""} {addr.postal_code}
            </p>
          </div>
        ))}
        {savedAddresses.length === 0 && !isAddingAddress && (
          <p style={{ color: "#777", fontStyle: "italic", margin: 0 }}>No saved addresses found.</p>
        )}
      </div>
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

export default Profile;
