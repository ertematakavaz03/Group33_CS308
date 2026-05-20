import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const tabs = ["Products", "Orders", "Users", "Reviews"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name:"", model:"", serial_no:"", description:"", stock:"", price:"", warranty:"", distributor:"", category:"", image_url:"" });

  const token = localStorage.getItem("adminToken");

  const fetchAll = useCallback(() => {
    fetch("http://localhost:5001/api/products").then(r => r.json()).then(setProducts);
    fetch("http://localhost:5001/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setOrders)
      .catch(console.error);
    fetch("http://localhost:5001/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setUsers).catch(() => {});
    fetch("http://localhost:5001/api/admin/reviews", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setReviews).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchAll();
  }, [fetchAll, navigate, token]);

  const handleLogout = () => { localStorage.removeItem("adminToken"); navigate("/admin"); };

  const resetForm = () => setForm({ name:"", model:"", serial_no:"", description:"", stock:"", price:"", warranty:"", distributor:"", category:"", image_url:"" });

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const url = editProduct ? `http://localhost:5001/api/admin/products/${editProduct.id}` : "http://localhost:5001/api/admin/products";
    const method = editProduct ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ ...form, stock: Number(form.stock), price: Number(form.price) }),
    });
    if (res.ok) { fetchAll(); setShowAddForm(false); setEditProduct(null); resetForm(); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`http://localhost:5001/api/admin/products/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } });
    fetchAll();
  };

  const openEdit = (p) => { setEditProduct(p); setForm({ name:p.name, model:p.model||"", serial_no:p.serial_no||"", description:p.description||"", stock:p.stock, price:p.price, warranty:p.warranty||"", distributor:p.distributor||"", category:p.category||"", image_url:p.image_url||"" }); setShowAddForm(true); };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5001/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
  
      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleUpdateReviewStatus = async (reviewId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5001/api/admin/reviews/${reviewId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => r.id === reviewId ? { ...r, status: newStatus } : r)
        );
      }
    } catch (err) {
      console.error("Review status update failed:", err);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f3f4f6" }}>
      {/* Header */}
      <div style={{ background:"#b91c1c", padding:"1rem 2rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1 style={{ color:"#fff", fontWeight:"800", fontSize:"1.4rem", margin:0 }}>PazarYolu Admin</h1>
        <button onClick={handleLogout} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", padding:"0.5rem 1.2rem", borderRadius:"8px", cursor:"pointer", fontWeight:"700" }}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", padding:"1.5rem 2rem 0" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding:"0.6rem 1.5rem", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer", fontWeight:"700", background: activeTab===t ? "#fff" : "#e5e7eb", color: activeTab===t ? "#b91c1c" : "#6b7280" }}>{t}</button>
        ))}
      </div>

      <div style={{ background:"#fff", margin:"0 2rem", borderRadius:"0 12px 12px 12px", padding:"2rem", boxShadow:"0 4px 20px rgba(0,0,0,0.05)" }}>

        {/* PRODUCTS TAB */}
        {activeTab === "Products" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
              <h2 style={{ margin:0, fontWeight:"800" }}>Products ({products.length})</h2>
              <button onClick={() => { resetForm(); setEditProduct(null); setShowAddForm(true); }} style={{ background:"#b91c1c", color:"#fff", border:"none", padding:"0.6rem 1.2rem", borderRadius:"8px", cursor:"pointer", fontWeight:"700" }}>+ Add Product</button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div style={{ background:"#f9fafb", borderRadius:"12px", padding:"1.5rem", marginBottom:"2rem", border:"1px solid #e5e7eb" }}>
                <h3 style={{ marginTop:0 }}>{editProduct ? "Edit Product" : "New Product"}</h3>
                <form onSubmit={handleSubmitProduct}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                    {[["name","Name"],["model","Model"],["serial_no","Serial No"],["category","Category"],["price","Price"],["stock","Stock"],["warranty","Warranty"],["distributor","Distributor"]].map(([key, label]) => (
                      <div key={key}>
                        <label style={{ fontSize:"0.8rem", fontWeight:"700", color:"#6b7280", display:"block", marginBottom:"4px" }}>{label}</label>
                        <input value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} style={fInputStyle} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:"1rem" }}>
                    <label style={{ fontSize:"0.8rem", fontWeight:"700", color:"#6b7280", display:"block", marginBottom:"4px" }}>Image URL</label>
                    <input value={form.image_url} onChange={e => setForm({...form, image_url:e.target.value})} placeholder="https://images.unsplash.com/..." style={{...fInputStyle, width:"100%", boxSizing:"border-box"}} />
                    {form.image_url && <img src={form.image_url} alt="preview" style={{ marginTop:"0.5rem", width:"120px", height:"80px", objectFit:"cover", borderRadius:"8px" }} onError={e => e.target.style.display="none"} />}
                  </div>
                  <div style={{ marginTop:"1rem" }}>
                    <label style={{ fontSize:"0.8rem", fontWeight:"700", color:"#6b7280", display:"block", marginBottom:"4px" }}>Description</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={3} style={{...fInputStyle, width:"100%", boxSizing:"border-box", resize:"vertical"}} />
                  </div>
                  <div style={{ display:"flex", gap:"1rem", marginTop:"1rem" }}>
                    <button type="submit" style={{ background:"#b91c1c", color:"#fff", border:"none", padding:"0.7rem 1.5rem", borderRadius:"8px", cursor:"pointer", fontWeight:"700" }}>{editProduct ? "Save Changes" : "Add Product"}</button>
                    <button type="button" onClick={() => { setShowAddForm(false); setEditProduct(null); resetForm(); }} style={{ background:"#e5e7eb", color:"#111", border:"none", padding:"0.7rem 1.5rem", borderRadius:"8px", cursor:"pointer", fontWeight:"700" }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Product Table */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f3f4f6" }}>
                    {["Image","Name","Category","Price","Stock","Actions"].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"0.7rem 1rem", color:"#6b7280", fontWeight:"700", fontSize:"0.8rem", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                      <td style={{ padding:"0.7rem 1rem" }}>
                        <img src={p.image_url} alt={p.name} style={{ width:"50px", height:"40px", objectFit:"cover", borderRadius:"6px", background:"#f3f4f6" }} onError={e => e.target.style.display="none"} />
                      </td>
                      <td style={{ padding:"0.7rem 1rem", fontWeight:"600" }}>{p.name}</td>
                      <td style={{ padding:"0.7rem 1rem", color:"#6b7280" }}>{p.category}</td>
                      <td style={{ padding:"0.7rem 1rem", fontWeight:"700", color:"#b91c1c" }}>${parseFloat(p.price).toFixed(2)}</td>
                      <td style={{ padding:"0.7rem 1rem" }}>
                        <span style={{ background: p.stock<=0?"#fee2e2":p.stock<=5?"#fef3c7":"#dcfce7", color:p.stock<=0?"#dc2626":p.stock<=5?"#d97706":"#16a34a", padding:"2px 10px", borderRadius:"20px", fontSize:"0.8rem", fontWeight:"700" }}>{p.stock}</span>
                      </td>
                      <td style={{ padding:"0.7rem 1rem" }}>
                        <button onClick={() => openEdit(p)} style={{ background:"#f3f4f6", border:"none", padding:"0.4rem 0.9rem", borderRadius:"6px", cursor:"pointer", fontWeight:"700", marginRight:"0.5rem" }}>Edit</button>
                        <button onClick={() => handleDelete(p.id)} style={{ background:"#fee2e2", color:"#dc2626", border:"none", padding:"0.4rem 0.9rem", borderRadius:"6px", cursor:"pointer", fontWeight:"700" }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === "Orders" && (
          <>
            <h2 style={{ marginTop:0, fontWeight:"800" }}>Orders ({orders.length})</h2>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f3f4f6" }}>
                    {["ID","User","Total","Status","Date"].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"0.7rem 1rem", color:"#6b7280", fontWeight:"700", fontSize:"0.8rem", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                      <td style={{ padding:"0.7rem 1rem", color:"#6b7280" }}>#{o.id}</td>
                      <td style={{ padding:"0.7rem 1rem", fontWeight:"600" }}>{o.user_email || o.email || "-"}</td>
                      <td style={{ padding:"0.7rem 1rem", fontWeight:"700", color:"#b91c1c" }}>${parseFloat(o.total_amount||0).toFixed(2)}</td>
                      <td style={{ padding:"0.7rem 1rem" }}>
                      <select
                        value={(o.status || "processing").toLowerCase()}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        style={{
                          padding: "0.35rem 0.6rem",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontWeight: "700",
                          color: "#111",
                          background: "#f9fafb"
                        }}
                      >
                        <option value="processing">Processing</option>
                        <option value="in-transit">In-Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                      <td style={{ padding:"0.7rem 1rem", color:"#6b7280" }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p style={{ color:"#6b7280", textAlign:"center", padding:"2rem" }}>No orders yet.</p>}
            </div>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === "Users" && (
          <>
            <h2 style={{ marginTop:0, fontWeight:"800" }}>Users ({users.length})</h2>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f3f4f6" }}>
                    {["ID","Name","Email","Joined"].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"0.7rem 1rem", color:"#6b7280", fontWeight:"700", fontSize:"0.8rem", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                      <td style={{ padding:"0.7rem 1rem", color:"#6b7280" }}>#{u.id}</td>
                      <td style={{ padding:"0.7rem 1rem", fontWeight:"600" }}>{u.name}</td>
                      <td style={{ padding:"0.7rem 1rem", color:"#6b7280" }}>{u.email}</td>
                      <td style={{ padding:"0.7rem 1rem", color:"#6b7280" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p style={{ color:"#6b7280", textAlign:"center", padding:"2rem" }}>No users yet.</p>}
            </div>
          </>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "Reviews" && (
          <>
            <h2 style={{ marginTop:0, fontWeight:"800" }}>Reviews ({reviews.length})</h2>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f3f4f6" }}>
                    {["Product","User","Rating","Comment","Date","Status","Action"].map(h => (
                      <th key={h} style={{ textAlign:"left", padding:"0.7rem 1rem", color:"#6b7280", fontWeight:"700", fontSize:"0.8rem", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id} style={{ borderBottom:"1px solid #f3f4f6" }}>
                      <td style={{ padding:"0.7rem 1rem", fontWeight:"600", maxWidth:"150px" }}>{r.product_name}</td>
                      <td style={{ padding:"0.7rem 1rem" }}>{r.user_name}</td>
                      <td style={{ padding:"0.7rem 1rem", color:"#fbbf24", fontWeight:"700" }}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</td>
                      <td style={{ padding:"0.7rem 1rem", maxWidth:"300px", color:"#374151" }}>{r.comment}</td>
                      <td style={{ padding:"0.7rem 1rem", color:"#6b7280" }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td style={{ padding:"0.7rem 1rem" }}>
                        <span style={{ 
                            background: r.status === 'approved' ? "#dcfce7" : r.status === 'rejected' ? "#fee2e2" : "#fef3c7", 
                            color: r.status === 'approved' ? "#16a34a" : r.status === 'rejected' ? "#dc2626" : "#d97706", 
                            padding:"4px 10px", borderRadius:"20px", fontSize:"0.75rem", fontWeight:"700", textTransform: "capitalize"
                        }}>
                            {r.status}
                        </span>
                      </td>
                      <td style={{ padding:"0.7rem 1rem" }}>
                        {r.status === 'pending' && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={() => handleUpdateReviewStatus(r.id, 'approved')} style={{ background: "#dcfce7", color: "#16a34a", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Approve</button>
                                <button onClick={() => handleUpdateReviewStatus(r.id, 'rejected')} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Reject</button>
                            </div>
                        )}
                        {r.status !== 'pending' && (
                             <button onClick={() => handleUpdateReviewStatus(r.id, 'pending')} style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Reset</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reviews.length === 0 && <p style={{ color:"#6b7280", textAlign:"center", padding:"2rem" }}>No reviews to moderate.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const fInputStyle = { padding:"0.6rem 0.8rem", borderRadius:"8px", border:"1px solid #e5e7eb", fontSize:"0.9rem", width:"100%", boxSizing:"border-box" };

export default AdminDashboard;
