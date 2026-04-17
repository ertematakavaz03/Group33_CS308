import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [added, setAdded] = useState(false);

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
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;
    const cartKey = getCartKey();
    const existing = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const found = existing.find((item) => item.id === product.id);
    let updatedCart;
    if (found) {
      if (found.quantity >= product.stock) return;
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

  return (
    <div style={{ maxWidth:"1100px", margin:"2rem auto", padding:"0 2rem 4rem" }}>
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
            {isOutOfStock ? "Unavailable" : added ? "✓ Added to Cart!" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;