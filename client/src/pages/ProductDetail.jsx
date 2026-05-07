import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [stockAlert, setStockAlert] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewStatus, setReviewStatus] = useState("");
  const [hasPurchased, setHasPurchased] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const getCartKey = () => {
    if (!user) return "guest_cart";
    const userId = user?.user?.id || user?.id;
    return `cart_user_${userId}`;
  };

  useEffect(() => {
    fetch(`http://localhost:5001/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => { setProduct(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
      
    fetch(`http://localhost:5001/api/products/${id}/reviews`)
      .then((res) => res.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(console.error);

    const userId = user?.user?.id || user?.id;
    if (userId) {
      fetch(`http://localhost:5001/api/orders/my-orders/${userId}`)
        .then((res) => res.json())
        .then((orders) => {
          const purchased = Array.isArray(orders) && orders.some((order) =>
            order.items?.some((item) => String(item.product_id || item.id) === String(id))
          );
          setHasPurchased(purchased);
        })
        .catch(console.error);
    }
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        setReviewStatus("You must be logged in to leave a review.");
        return;
    }
    const userId = user?.user?.id || user?.id;
    try {
        const res = await fetch(`http://localhost:5001/api/products/${id}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, ...reviewForm })
        });
        const data = await res.json();
        if (res.ok) {
            setReviews((prev) => [data, ...prev.filter((r) => r.id !== data.id)]);
            setReviewStatus("Your review has been submitted and is shown below.");
            setReviewForm({ rating: 5, comment: "" });
        } else {
            setReviewStatus(data.error || "Failed to submit review.");
        }
    } catch {
        setReviewStatus("An error occurred. Please try again.");
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) {
      setStockAlert('This product is out of stock.');
      setTimeout(() => setStockAlert(''), 3000);
      return;
    }
    const cartKey = getCartKey();
    const existing = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const found = existing.find((item) => item.id === product.id);
    let updatedCart;
    if (found) {
      if (found.quantity >= product.stock) {
        setStockAlert(`No more stock available. Only ${product.stock} in stock.`);
        setTimeout(() => setStockAlert(''), 3000);
        return;
      }
      updatedCart = existing.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...existing, { ...product, quantity: 1 }];
    }
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    const userId = user?.user?.id || user?.id;
    if (userId) {
      try {
        await fetch(`http://localhost:5001/api/cart/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
      } catch (err) { console.error(err); }
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <p>Loading...</p>
    </div>
  );

  if (!product) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <h2>Product not found.</h2>
      <button onClick={() => navigate("/")}>← Back to Home</button>
    </div>
  );

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  
  const currentUserId = user?.user?.id || user?.id;
  const visibleReviews = reviews.filter(r => r.status === 'approved' || r.user_id === currentUserId);
  const approvedReviews = reviews.filter(r => r.status === 'approved');

  return (
    <div style={{ maxWidth:"1100px", margin:"2rem auto", padding:"0 2rem 4rem" }}>
      {stockAlert && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <div style={{
            background: '#1a1a1a',
            color: '#fff',
            padding: '1.2rem 2rem',
            borderRadius: '16px',
            fontWeight: '700',
            fontSize: '1rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            border: '2px solid #b22222',
            maxWidth: '380px',
            textAlign: 'center'
          }}>
            🚫 {stockAlert}
          </div>
        </div>
      )}

      <button onClick={() => navigate(-1)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1rem", fontWeight:"700", color:"#111", marginBottom:"1.5rem", display:"inline-flex", alignItems:"center", gap:"6px" }}>
        ← Back
      </button>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3rem", background:"#fff", borderRadius:"20px", boxShadow:"0 10px 40px rgba(0,0,0,0.08)", padding:"2.5rem" }}>
        
        <div style={{ position:"relative", borderRadius:"16px", overflow:"hidden", background:"#f9fafb", aspectRatio:"1/1", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {product.category && (
            <span style={{ position:"absolute", top:"12px", left:"12px", background:"rgba(0,0,0,0.6)", color:"#fff", fontSize:"0.75rem", fontWeight:"700", padding:"4px 10px", borderRadius:"20px", zIndex:10 }}>
              {product.category}
            </span>
          )}
          <img
            src={product.image_url || `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={(e) => { e.target.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`; }}
          />
        </div>

        <div style={{ display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <h1 style={{ fontSize:"1.9rem", fontWeight:"800", color:"#111", marginBottom:"0.4rem", lineHeight:1.2 }}>{product.name}</h1>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "0.8rem" }}>
             <span style={{ color: "#fbbf24", fontSize: "1.2rem", fontWeight: "800" }}>★ {approvedReviews.length > 0 ? (approvedReviews.reduce((a,b) => a+b.rating, 0) / approvedReviews.length).toFixed(1) : "No ratings yet"}</span>
             <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>({approvedReviews.length} reviews)</span>
          </div>
          {product.model && <p style={{ fontSize:"0.9rem", color:"#6b7280", marginBottom:"0.8rem" }}>Model: <strong>{product.model}</strong></p>}
          <p style={{ fontSize:"2rem", fontWeight:"800", color:"#b91c1c", marginBottom:"1rem" }}>${parseFloat(product.price).toFixed(2)}</p>

          <div style={{ marginBottom:"1.2rem" }}>
            {isOutOfStock ? (
              <span style={{ background:"#fee2e2", color:"#dc2626", padding:"4px 14px", borderRadius:"20px", fontSize:"0.85rem", fontWeight:"700" }}>Out of Stock</span>
            ) : isLowStock ? (
              <span style={{ background:"#fef3c7", color:"#d97706", padding:"4px 14px", borderRadius:"20px", fontSize:"0.85rem", fontWeight:"700" }}>Only {product.stock} left!</span>
            ) : (
              <span style={{ background:"#dcfce7", color:"#16a34a", padding:"4px 14px", borderRadius:"20px", fontSize:"0.85rem", fontWeight:"700" }}>In Stock ({product.stock})</span>
            )}
          </div>

          {product.description && (
            <div style={{ background:"#f9fafb", borderRadius:"12px", padding:"1rem 1.2rem", marginBottom:"1.5rem" }}>
              <p style={{ fontSize:"0.7rem", fontWeight:"700", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.5rem" }}>Description</p>
              <p style={{ fontSize:"0.95rem", color:"#374151", lineHeight:1.7, margin:0 }}>{product.description}</p>
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", marginBottom:"1.8rem" }}>
            {product.warranty && (
              <div style={{ display:"flex", justifyContent:"space-between", padding:"0.5rem 0", borderBottom:"1px solid #f3f4f6" }}>
                <span style={{ fontSize:"0.85rem", color:"#6b7280", fontWeight:"600" }}>Warranty</span>
                <span style={{ fontSize:"0.9rem", color:"#111", fontWeight:"700" }}>{product.warranty}</span>
              </div>
            )}
            {product.distributor && (
              <div style={{ display:"flex", justifyContent:"space-between", padding:"0.5rem 0", borderBottom:"1px solid #f3f4f6" }}>
                <span style={{ fontSize:"0.85rem", color:"#6b7280", fontWeight:"600" }}>Distributor</span>
                <span style={{ fontSize:"0.9rem", color:"#111", fontWeight:"700" }}>{product.distributor}</span>
              </div>
            )}
            {product.serial_no && (
              <div style={{ display:"flex", justifyContent:"space-between", padding:"0.5rem 0", borderBottom:"1px solid #f3f4f6" }}>
                <span style={{ fontSize:"0.85rem", color:"#6b7280", fontWeight:"600" }}>Serial No</span>
                <span style={{ fontSize:"0.9rem", color:"#111", fontWeight:"700" }}>{product.serial_no}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            style={{
              width:"100%", padding:"1rem", border:"none", borderRadius:"12px",
              fontSize:"1rem", fontWeight:"800", cursor: isOutOfStock ? "not-allowed" : "pointer",
              background: isOutOfStock ? "#e5e7eb" : added ? "#16a34a" : "#b91c1c",
              color: isOutOfStock ? "#9ca3af" : "#fff",
              transition:"all 0.2s ease"
            }}
          >
            {isOutOfStock ? "Unavailable" : added ? "Added to Cart!" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ marginTop: "3rem", background: "#fff", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", padding: "2.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1.5rem", borderBottom: "2px solid #f3f4f6", paddingBottom: "1rem" }}>Reviews & Ratings</h2>
        
        {/* Write a Review */}
        <div style={{ marginBottom: "3rem", background: "#f9fafb", padding: "1.5rem", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem" }}>Leave a Review</h3>
            {!user ? (
                <p style={{ color: "#6b7280" }}>Please <a href="/login" style={{ color: "#b91c1c", fontWeight: "700", textDecoration: "none" }}>login</a> to leave a review.</p>
            ) : !hasPurchased ? (
                <p style={{ color: "#6b7280", fontStyle: "italic" }}>You can only review products you have purchased.</p>
            ) : (
                <form onSubmit={handleReviewSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem" }}>Rating</label>
                        <select
                            value={reviewForm.rating}
                            onChange={(e) => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                            style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", width: "100%", maxWidth: "200px" }}
                        >
                            <option value="5">★★★★★ (5/5)</option>
                            <option value="4">★★★★☆ (4/5)</option>
                            <option value="3">★★★☆☆ (3/5)</option>
                            <option value="2">★★☆☆☆ (2/5)</option>
                            <option value="1">★☆☆☆☆ (1/5)</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem" }}>Comment</label>
                        <textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                            rows="3"
                            style={{ padding: "0.8rem", borderRadius: "8px", border: "1px solid #e5e7eb", width: "100%", boxSizing: "border-box", resize: "vertical" }}
                            placeholder="Share your thoughts about this product..."
                        />
                    </div>
                    {reviewStatus && <p style={{ fontSize: "0.9rem", color: reviewStatus.includes("error") || reviewStatus.includes("already") || reviewStatus.includes("Failed") || reviewStatus.includes("purchased") ? "#dc2626" : "#16a34a", marginBottom: "1rem" }}>{reviewStatus}</p>}
                    <button type="submit" style={{ background: "#111", color: "#fff", border: "none", padding: "0.7rem 1.5rem", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Submit Review</button>
                </form>
            )}
        </div>

        {/* List of Reviews */}
        <div>
            {visibleReviews.length === 0 ? (
                <p style={{ color: "#6b7280", fontStyle: "italic" }}>No reviews yet. Be the first to review this product!</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {visibleReviews.map(r => (
                        <div key={r.id} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontWeight: "700", color: "#111" }}>{r.user_name || "User"}</span>
                                    {r.status && r.status !== "approved" && (
                                      <span style={{
                                        background: r.status === "pending" ? "#fef3c7" : "#fee2e2",
                                        color: r.status === "pending" ? "#d97706" : "#dc2626",
                                        borderRadius: "999px",
                                        padding: "2px 8px",
                                        fontSize: "0.7rem",
                                        fontWeight: "800",
                                        textTransform: "capitalize"
                                      }}>
                                        {r.status}
                                      </span>
                                    )}
                                </div>
                                <span style={{ color: "#fbbf24", fontSize: "1.1rem" }}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af", display: "block", marginBottom: "0.8rem" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                            <p style={{ fontSize: "0.95rem", color: "#374151", margin: 0, lineHeight: 1.5 }}>{r.comment}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
