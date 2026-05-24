import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const getTabsByRole = (role) => {
  if (role === "product_manager") {
    return ["Products", "Categories", "Deliveries", "Reviews"];
  }

  if (role === "sales_manager") {
    return ["Products", "Orders", "Revenue", "Returns"];
  }

  return [];
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [returns, setReturns] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: "", model: "", serial_no: "", description: "", stock: "", price: "", warranty: "", distributor: "", category: "", image_url: "" });
  const [categories, setCategories] = useState([]);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [discountProduct, setDiscountProduct] = useState(null);
  const [discountForm, setDiscountForm] = useState({ price: "", discount_percentage: "", discount_start: "", discount_end: "" });
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });

  const token = localStorage.getItem("adminToken");
  const adminRole = localStorage.getItem("adminRole");
  const tabs = getTabsByRole(adminRole);
  const revenueChartData = orders.map((order) => ({
    name: `#${order.id}`,
    total: Number(order.total_amount || 0)
  }));
  const grossRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const approvedRefunds = returns
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + Number(r.refund_amount || (Number(r.price_at_purchase || 0) * Number(r.quantity || 0))), 0);
  const netProfit = grossRevenue - approvedRefunds;

  const fetchAll = useCallback(() => {
    // Resilient loader: handles an expired/invalid session (401) by sending
    // the admin back to login instead of crashing on a non-array response.
    const authedGet = (path, setter, enabled = true) => {
      if (!enabled) return;
      fetch(`http://localhost:5002/api/admin/${path}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => {
          if (r.status === 401) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminRole");
            navigate("/admin");
            return null;
          }
          return r.json();
        })
        .then((data) => { if (Array.isArray(data)) setter(data); })
        .catch(console.error);
    };

    const orderParams = new URLSearchParams();
    if (dateFilter.startDate) orderParams.set("startDate", dateFilter.startDate);
    if (dateFilter.endDate) orderParams.set("endDate", dateFilter.endDate);
    const orderPath = `orders${orderParams.toString() ? `?${orderParams.toString()}` : ""}`;

    authedGet("products", setProducts);
    authedGet("categories", setCategories);
    authedGet(orderPath, setOrders, adminRole === "sales_manager");
    authedGet("returns", setReturns, adminRole === "sales_manager");
    authedGet("deliveries", setDeliveries, adminRole === "product_manager");
    authedGet("reviews", setReviews);
  }, [token, adminRole, navigate, dateFilter.startDate, dateFilter.endDate]);

  const toLocalInput = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openDiscount = (p) => {
    setDiscountProduct(p);
    setDiscountForm({
      price: p.price ? String(p.price) : "",
      discount_percentage: p.discount_percentage ? String(p.discount_percentage) : "",
      discount_start: toLocalInput(p.discount_start),
      discount_end: toLocalInput(p.discount_end)
    });
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    const priceRes = await fetch(`http://localhost:5002/api/admin/products/${discountProduct.id}/price`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ price: Number(discountForm.price) })
    });
    if (!priceRes.ok) {
      const data = await priceRes.json().catch(() => ({}));
      alert(data.error || "Failed to save price");
      return;
    }

    const res = await fetch(`http://localhost:5002/api/admin/products/${discountProduct.id}/discount`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        discount_percentage: Number(discountForm.discount_percentage) || 0,
        discount_start: discountForm.discount_start || null,
        discount_end: discountForm.discount_end || null
      })
    });
    if (res.ok) {
      setDiscountProduct(null);
      fetchAll();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save discount");
    }
  };

  const handleClearDiscount = async () => {
    if (!window.confirm("Remove discount on this product?")) return;
    await fetch(`http://localhost:5002/api/admin/products/${discountProduct.id}/discount`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setDiscountProduct(null);
    fetchAll();
  };

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchAll();
  }, [fetchAll, navigate, token]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5002/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch { /* ignore — clear local state regardless */ }
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    navigate("/admin");
  };

  const resetForm = () => setForm({ name: "", model: "", serial_no: "", description: "", stock: "", price: "", warranty: "", distributor: "", category: "", image_url: "" });

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const url = editProduct ? `http://localhost:5002/api/admin/products/${editProduct.id}` : "http://localhost:5002/api/admin/products";
    const method = editProduct ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, stock: Number(form.stock), price: Number(form.price) }),
      });
      if (res.ok) {
        fetchAll(); setShowAddForm(false); setEditProduct(null); resetForm();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          alert("Your admin session has expired. Please log in again.");
          handleLogout();
        } else {
          alert(data.error || "Failed to save product. Please try again.");
        }
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`http://localhost:5002/api/admin/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, model: p.model || "", serial_no: p.serial_no || "", description: p.description || "", stock: p.stock, price: p.price, warranty: p.warranty || "", distributor: p.distributor || "", category: p.category || "", image_url: p.image_url || "" }); setShowAddForm(true); };

  const resetCategoryForm = () => setCategoryForm({ name: "", description: "" });

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    const url = editCategory ? `http://localhost:5002/api/admin/categories/${editCategory.id}` : "http://localhost:5002/api/admin/categories";
    const method = editCategory ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(categoryForm),
      });
      if (res.ok) {
        fetchAll(); setShowAddCategoryForm(false); setEditCategory(null); resetCategoryForm();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save category. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category? Products in this category will have their category removed.")) return;
    await fetch(`http://localhost:5002/api/admin/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  const openEditCategory = (c) => { setEditCategory(c); setCategoryForm({ name: c.name, description: c.description || "" }); setShowAddCategoryForm(true); };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5002/api/admin/orders/${orderId}/status`, {
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

  const handleUpdateDeliveryStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5002/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setDeliveries((prev) =>
          prev.map((d) =>
            d.order_id === orderId ? { ...d, status: newStatus } : d
          )
        );
      }
    } catch (err) {
      console.error("Delivery status update failed:", err);
    }
  };

  const handleProcessReturn = async (returnId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5002/api/admin/returns/${returnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setReturns((prev) =>
          prev.map((r) => r.id === returnId ? { ...r, status: newStatus, resolved_at: new Date().toISOString() } : r)
        );
        fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to process return");
      }
    } catch (err) {
      console.error("Return processing failed:", err);
    }
  };

  const handleUpdateReviewStatus = async (reviewId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5002/api/admin/reviews/${reviewId}/status`, {
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
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      {/* Header */}
      <div style={{ background: "#b91c1c", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1 style={{ color: "#fff", fontWeight: "800", fontSize: "1.4rem", margin: 0 }}>
  {adminRole === "product_manager"
    ? "PazarYolu Product Manager"
    : adminRole === "sales_manager"
    ? "PazarYolu Sales Manager"
    : "PazarYolu Admin"}
</h1>
        <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "0.5rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", padding: "1.5rem 2rem 0" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "0.6rem 1.5rem", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer", fontWeight: "700", background: activeTab === t ? "#fff" : "#e5e7eb", color: activeTab === t ? "#b91c1c" : "#6b7280" }}>{t}</button>
        ))}
      </div>

      <div style={{ background: "#fff", margin: "0 2rem", borderRadius: "0 12px 12px 12px", padding: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>

        {/* PRODUCTS TAB */}
        {activeTab === "Products" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontWeight: "800" }}>Products ({products.length})</h2>
              {adminRole === "product_manager" && (
              <button onClick={() => { resetForm(); setEditProduct(null); setShowAddForm(true); }} style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>+ Add Product</button>
            )}
            </div>
            {adminRole === "product_manager" && products.filter(p => Number(p.stock) <= 5).length > 0 && (
  <div
    style={{
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      color: "#c2410c",
      padding: "1rem",
      borderRadius: "12px",
      marginBottom: "1.5rem",
    }}
  >
    <h3 style={{ marginTop: 0, marginBottom: "0.8rem" }}>
      Low Stock Warning
    </h3>

    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {products
        .filter(p => Number(p.stock) <= 5)
        .map(p => (
          <div
            key={p.id}
            style={{
              background: "#fff",
              padding: "0.7rem 1rem",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #fed7aa"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
  <img
    src={p.image_url}
    alt={p.name}
    style={{
      width: "45px",
      height: "35px",
      objectFit: "cover",
      borderRadius: "6px",
      background: "#f3f4f6"
    }}
    onError={e => e.target.style.display = "none"}
  />

  <div style={{ display: "flex", flexDirection: "column" }}>
    <span style={{ fontWeight: "600" }}>
      {p.name}
    </span>

    <button
      onClick={() => openEdit(p)}
      style={{
        background: "#f3f4f6",
        border: "none",
        padding: "0.3rem 0.7rem",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "0.75rem",
        marginTop: "0.3rem",
        width: "fit-content"
      }}
    >
      Edit
    </button>
  </div>
</div>

            <span
              style={{
                background: Number(p.stock) === 0 ? "#fee2e2" : "#fef3c7",
                color: Number(p.stock) === 0 ? "#dc2626" : "#d97706",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: "700"
              }}
            >
              Stock: {p.stock}
            </span>
          </div>
        ))}
    </div>
  </div>
)}

            {/* Add/Edit Form */}
            {showAddForm && (
              <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem", border: "1px solid #e5e7eb" }}>
                <h3 style={{ marginTop: 0 }}>{editProduct ? "Edit Product" : "New Product"}</h3>
                <form onSubmit={handleSubmitProduct}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {[["name", "Name"], ["model", "Model"], ["serial_no", "Serial No"], ["category", "Category"], ["price", "Price"], ["stock", "Stock"], ["warranty", "Warranty"], ["distributor", "Distributor"]].map(([key, label]) => (
                      <div key={key}>
                        <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>{label}</label>
                        {key === 'category' ? (
                          <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", cursor: "pointer" }} required>
                            <option value="">Select Category</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box" }} required={['name', 'serial_no', 'price', 'stock'].includes(key)} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>Image URL</label>
                    <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://images.unsplash.com/..." style={{ ...fInputStyle, width: "100%", boxSizing: "border-box" }} />
                    {form.image_url && <img src={form.image_url} alt="preview" style={{ marginTop: "0.5rem", width: "120px", height: "80px", objectFit: "cover", borderRadius: "8px" }} onError={e => e.target.style.display = "none"} />}
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>Description</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...fInputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button type="submit" style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "0.7rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>{editProduct ? "Save Changes" : "Add Product"}</button>
                    <button type="button" onClick={() => { setShowAddForm(false); setEditProduct(null); resetForm(); }} style={{ background: "#e5e7eb", color: "#111", border: "none", padding: "0.7rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Product Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    {["Image", "Name", "Category", "Price", "Discount", "Stock", "Actions"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6b7280", fontWeight: "700", fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <img src={p.image_url} alt={p.name} style={{ width: "50px", height: "40px", objectFit: "cover", borderRadius: "6px", background: "#f3f4f6" }} onError={e => e.target.style.display = "none"} />
                      </td>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "600" }}>{p.name}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>{p.category}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        {p.is_on_discount ? (
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "700", color: "#b91c1c" }}>${parseFloat(p.effective_price).toFixed(2)}</span>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af", textDecoration: "line-through" }}>${parseFloat(p.price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: "700", color: "#b91c1c" }}>${parseFloat(p.price).toFixed(2)}</span>
                        )}
                      </td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        {Number(p.discount_percentage) > 0 ? (
                          <span style={{ background: p.is_on_discount ? "#fee2e2" : "#f3f4f6", color: p.is_on_discount ? "#dc2626" : "#9ca3af", padding: "2px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700" }}>
                            -{parseFloat(p.discount_percentage).toFixed(0)}%{!p.is_on_discount ? " (scheduled)" : ""}
                          </span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <span style={{ background: p.stock <= 0 ? "#fee2e2" : p.stock <= 5 ? "#fef3c7" : "#dcfce7", color: p.stock <= 0 ? "#dc2626" : p.stock <= 5 ? "#d97706" : "#16a34a", padding: "2px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700" }}>{p.stock}</span>
                      </td>
                      <td style={{ padding: "0.7rem 1rem", whiteSpace: "nowrap" }}>
                      {adminRole === "product_manager" && (
  <>
    <button onClick={() => openEdit(p)} style={{ background: "#f3f4f6", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700", marginRight: "0.4rem" }}>Edit</button>
    <button onClick={() => handleDelete(p.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Delete</button>
  </>
)}

{adminRole === "sales_manager" && (
  <button onClick={() => openDiscount(p)} style={{ background: "#fef3c7", color: "#d97706", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Discount</button>
)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === "Categories" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontWeight: "800" }}>Categories ({categories.length})</h2>
              {adminRole === "product_manager" && (
                <button onClick={() => { resetCategoryForm(); setEditCategory(null); setShowAddCategoryForm(true); }} style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>+ Add Category</button>
              )}
            </div>

            {/* Add/Edit Category Form */}
            {showAddCategoryForm && (
              <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem", border: "1px solid #e5e7eb" }}>
                <h3 style={{ marginTop: 0 }}>{editCategory ? "Edit Category" : "New Category"}</h3>
                <form onSubmit={handleSubmitCategory}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>Name</label>
                      <input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box" }} required />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>Description</label>
                      <textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", resize: "vertical" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button type="submit" style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "0.7rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>{editCategory ? "Save Changes" : "Add Category"}</button>
                    <button type="button" onClick={() => { setShowAddCategoryForm(false); setEditCategory(null); resetCategoryForm(); }} style={{ background: "#e5e7eb", color: "#111", border: "none", padding: "0.7rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Category Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    {["ID", "Name", "Description", "Actions"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6b7280", fontWeight: "700", fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>#{c.id}</td>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "600" }}>{c.name}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#374151" }}>{c.description || "—"}</td>
                      <td style={{ padding: "0.7rem 1rem", whiteSpace: "nowrap" }}>
                        {adminRole === "product_manager" && (
                          <>
                            <button onClick={() => openEditCategory(c)} style={{ background: "#f3f4f6", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700", marginRight: "0.4rem" }}>Edit</button>
                            <button onClick={() => handleDeleteCategory(c.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "0.4rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>No categories yet.</p>}
            </div>
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === "Orders" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontWeight: "800" }}>Orders & Invoices ({orders.length})</h2>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                <input type="date" value={dateFilter.startDate} onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })} style={fInputStyle} />
                <input type="date" value={dateFilter.endDate} onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })} style={fInputStyle} />
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <button onClick={() => setDateFilter({ startDate: "", endDate: "" })} style={{ background: "#e5e7eb", color: "#111", border: "none", padding: "0.6rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>Clear</button>
                )}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  {["ID", "User", "Items", "Delivery Address", "Total", "Status", "Date", "Invoice"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6b7280", fontWeight: "700", fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>#{o.id}</td>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "600" }}>{o.user_email || o.email || "-"}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#374151" }}>
  {o.items && o.items.length > 0
    ? o.items.map((item, index) => (
        <div key={index}>
          {item.product_name} x {item.quantity}
        </div>
      ))
    : "-"}
</td>

<td style={{ padding: "0.7rem 1rem", color: "#6b7280", maxWidth: "240px" }}>
  {o.full_address
    ? `${o.full_address}${o.district ? ", " + o.district : ""}${o.city ? ", " + o.city : ""}`
    : "-"}
</td>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "700", color: "#b91c1c" }}>${parseFloat(o.total_amount || 0).toFixed(2)}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                      {adminRole === "product_manager" ? (
  <select
    value={o.status}
    onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
    style={{
      padding: "0.45rem 0.7rem",
      borderRadius: "10px",
      border: "1px solid #D1D5DB",
      background: "#fff",
      fontWeight: "600",
      cursor: "pointer"
    }}
  >
    <option value="processing">Processing</option>
    <option value="in-transit">In Transit</option>
    <option value="delivered">Delivered</option>
    <option value="cancelled">Cancelled</option>
  </select>
) : (
  <span
    style={{
      background: "#f3f4f6",
      padding: "0.45rem 0.8rem",
      borderRadius: "10px",
      fontWeight: "600",
      display: "inline-block"
    }}
  >
    {o.status}
  </span>
)}
                      </td>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : "-"}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <button
                          onClick={() => window.open(`http://localhost:5001/api/orders/${o.id}/invoice`, "_blank", "noopener,noreferrer")}
                          style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>No orders yet.</p>}
            </div>
          </>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === "Deliveries" && (
          <>
            <h2 style={{ marginTop: 0, fontWeight: "800" }}>Delivery List ({deliveries.length})</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  {["Delivery ID", "Customer ID", "Product", "Qty", "Total Price", "Delivery Address", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6b7280", fontWeight: "700", fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map(d => (
                    <tr key={d.delivery_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>#{d.delivery_id}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>User #{d.customer_id}</td>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "600" }}>{d.product_name || `Product #${d.product_id}`}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>{d.quantity}</td>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "700", color: "#b91c1c" }}>${parseFloat(d.total_price || 0).toFixed(2)}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280", maxWidth: "240px" }}>
                        {d.full_address ? `${d.full_address}${d.district ? ", " + d.district : ""}${d.city ? ", " + d.city : ""}` : "-"}
                      </td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <select
                          value={d.status}
                          onChange={(e) => handleUpdateDeliveryStatus(d.order_id, e.target.value)}
                          style={{
                            padding: "0.45rem 0.7rem",
                            borderRadius: "10px",
                            border: "1px solid #D1D5DB",
                            background: "#fff",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          <option value="processing">Processing</option>
                          <option value="in-transit">In Transit</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deliveries.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>No deliveries yet.</p>}
            </div>
          </>
        )}

        {/* REVENUE TAB */}
{activeTab === "Revenue" && (
  <>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <h2 style={{ margin: 0, fontWeight: "800" }}>Sales Analytics</h2>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        <input type="date" value={dateFilter.startDate} onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })} style={fInputStyle} />
        <input type="date" value={dateFilter.endDate} onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })} style={fInputStyle} />
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1rem",
        marginTop: "1.5rem"
      }}
    >
      <div style={analyticsCard}>
        <h3>Total Revenue</h3>
        <p style={analyticsValue}>
          ${grossRevenue.toFixed(2)}
        </p>
      </div>

      <div style={analyticsCard}>
        <h3>Refund Loss</h3>
        <p style={analyticsValue}>
          ${approvedRefunds.toFixed(2)}
        </p>
      </div>

      <div style={analyticsCard}>
        <h3>Net Profit</h3>
        <p style={analyticsValue}>
          ${netProfit.toFixed(2)}
        </p>
      </div>

      <div style={analyticsCard}>
        <h3>Total Orders</h3>
        <p style={analyticsValue}>
          {orders.length}
        </p>
      </div>
    </div>
    <div style={{ marginTop: "2rem", height: "300px" }}>
  <h3 style={{ marginBottom: "1rem" }}>
    Revenue by Order
  </h3>

  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={revenueChartData}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="total" />
    </BarChart>
  </ResponsiveContainer>
</div>
  </>
)}
        {/* USERS TAB */}
        {activeTab === "Users" && (
          <>
            <h2 style={{ marginTop: 0, fontWeight: "800" }}>Users ({users.length})</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    {["ID", "Name", "Email", "Joined"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6b7280", fontWeight: "700", fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>#{u.id}</td>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "600" }}>{u.name}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>{u.email}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>No users yet.</p>}
            </div>
          </>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "Reviews" && (
          <>
            <h2 style={{ marginTop: 0, fontWeight: "800" }}>Reviews ({reviews.length})</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    {["Product", "User", "Rating", "Comment", "Date", "Status", "Action"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6b7280", fontWeight: "700", fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "600", maxWidth: "150px" }}>{r.product_name}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>{r.user_name}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#fbbf24", fontWeight: "700" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                      <td style={{ padding: "0.7rem 1rem", maxWidth: "300px", color: "#374151" }}>{r.comment}</td>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <span style={{
                          background: r.status === 'approved' ? "#dcfce7" : r.status === 'rejected' ? "#fee2e2" : "#fef3c7",
                          color: r.status === 'approved' ? "#16a34a" : r.status === 'rejected' ? "#dc2626" : "#d97706",
                          padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", textTransform: "capitalize"
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.7rem 1rem" }}>
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
              {reviews.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>No reviews to moderate.</p>}
            </div>
          </>
        )}

        {/* RETURNS TAB */}
        {activeTab === "Returns" && (
          <>
            <h2 style={{ marginTop: 0, fontWeight: "800" }}>
              Return Requests ({returns.length})
              {returns.filter(r => r.status === "pending").length > 0 && (
                <span style={{ marginLeft: "0.6rem", background: "#fef3c7", color: "#d97706", padding: "2px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700" }}>
                  {returns.filter(r => r.status === "pending").length} pending
                </span>
              )}
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                    {["Order", "Product", "Customer", "Qty", "Reason", "Date", "Status", "Action"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6b7280", fontWeight: "700", fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returns.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>#{r.order_id}</td>
                      <td style={{ padding: "0.7rem 1rem", fontWeight: "600", maxWidth: "160px" }}>{r.product_name || "—"}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <div style={{ fontWeight: "600" }}>{r.user_name}</div>
                        <div style={{ color: "#9ca3af", fontSize: "0.78rem" }}>{r.user_email}</div>
                      </td>
                      <td style={{ padding: "0.7rem 1rem" }}>{r.quantity}</td>
                      <td style={{ padding: "0.7rem 1rem", maxWidth: "240px", color: "#374151" }}>
                        {r.reason || <span style={{ color: "#9ca3af" }}>—</span>}
                        <div style={{ marginTop: "4px", color: "#b91c1c", fontWeight: "700", fontSize: "0.78rem" }}>
                          Refund ${Number(r.refund_amount || (Number(r.price_at_purchase || 0) * Number(r.quantity || 0))).toFixed(2)}
                        </div>
                      </td>
                      <td style={{ padding: "0.7rem 1rem", color: "#6b7280" }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        <span style={{
                          background: r.status === 'approved' ? "#dcfce7" : r.status === 'rejected' ? "#fee2e2" : "#fef3c7",
                          color: r.status === 'approved' ? "#16a34a" : r.status === 'rejected' ? "#dc2626" : "#d97706",
                          padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", textTransform: "capitalize"
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.7rem 1rem" }}>
                        {r.status === 'pending' ? (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button onClick={() => handleProcessReturn(r.id, 'approved')} style={{ background: "#dcfce7", color: "#16a34a", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Approve</button>
                            <button onClick={() => handleProcessReturn(r.id, 'rejected')} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
                            {r.resolved_at ? `Resolved ${new Date(r.resolved_at).toLocaleDateString()}` : "Resolved"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {returns.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>No return requests.</p>}
            </div>
            <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "1rem" }}>
              Approving a return automatically restocks the product.
            </p>
          </>
        )}
      </div>

      {/* Discount Modal */}
      {discountProduct && (
        <div
          onClick={() => setDiscountProduct(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "16px", padding: "1.75rem", width: "100%", maxWidth: "480px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}
          >
            <h3 style={{ margin: "0 0 4px", fontWeight: "800" }}>Set Discount</h3>
            <p style={{ margin: "0 0 1.25rem", color: "#6b7280", fontSize: "0.85rem" }}>{discountProduct.name}</p>

            <form onSubmit={handleSaveDiscount}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>Base Price</label>
                <input
                  type="number" min="0" step="0.01"
                  value={discountForm.price}
                  onChange={(e) => setDiscountForm({ ...discountForm, price: e.target.value })}
                  required
                  style={fInputStyle}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>Percentage (0–99)</label>
                <input
                  type="number" min="0" max="99" step="0.01"
                  value={discountForm.discount_percentage}
                  onChange={(e) => setDiscountForm({ ...discountForm, discount_percentage: e.target.value })}
                  required
                  style={fInputStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>Starts (optional)</label>
                  <input
                    type="datetime-local"
                    value={discountForm.discount_start}
                    onChange={(e) => setDiscountForm({ ...discountForm, discount_start: e.target.value })}
                    style={fInputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#6b7280", display: "block", marginBottom: "4px" }}>Ends (optional)</label>
                  <input
                    type="datetime-local"
                    value={discountForm.discount_end}
                    onChange={(e) => setDiscountForm({ ...discountForm, discount_end: e.target.value })}
                    style={fInputStyle}
                  />
                </div>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 1.25rem" }}>
                Leaving dates empty makes the discount active immediately and indefinitely.
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                <button
                  type="button" onClick={handleClearDiscount}
                  style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "0.65rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
                >
                  Remove Discount
                </button>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button" onClick={() => setDiscountProduct(null)}
                    style={{ background: "#e5e7eb", color: "#111", border: "none", padding: "0.65rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "0.65rem 1.4rem", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const analyticsCard = {
  background: "#f9fafb",
  padding: "1.5rem",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
};

const analyticsValue = {
  fontSize: "2rem",
  fontWeight: "800",
  color: "#b91c1c",
  marginTop: "1rem",
};
const fInputStyle = { padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" };

export default AdminDashboard;
