import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from '../components/Header';

const maskReviewerName = (name) => {
  const parts = String(name || "User").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U***";
  return parts.map((part) => `${part.charAt(0).toUpperCase()}***`).join(" ");
};

const getReviewerInitials = (name) => {
  const parts = String(name || "User").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
};

const formatReviewDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const getReviewDateLabel = (review) =>
  review?.updated_at
    ? `Updated on: ${formatReviewDate(review.updated_at)}`
    : formatReviewDate(review?.created_at);

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewStatus, setReviewStatus] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = user?.user?.id || user?.id;

  const getCartKey = () => {
    if (!user) return "guest_cart";
    const userId = user?.user?.id || user?.id;
    return `cart_user_${userId}`;
  };

  useEffect(() => {
    const updateCartCount = () => {
      const existing = JSON.parse(localStorage.getItem(getCartKey()) || "[]");
      setCartCount(existing.reduce((total, item) => total + item.quantity, 0));
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  useEffect(() => {
    setReviewStatus("");
    setEditingReviewId(null);
    setReviewForm({ rating: 5, comment: "" });

    fetch(`http://localhost:5001/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => { setProduct(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
      
    fetch(`http://localhost:5001/api/products/${id}/reviews`)
      .then((res) => res.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(console.error);

    if (!currentUserId) {
      setCanReview(false);
      return;
    }

    fetch(`http://localhost:5001/api/products/${id}/review-eligibility?userId=${currentUserId}`)
      .then((res) => res.json())
      .then((data) => setCanReview(Boolean(data?.canReview)))
      .catch(() => setCanReview(false));
  }, [id, currentUserId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("review") === "true" || searchParams.has("editReview")) {
      setActiveTab("reviews");
    }
  }, [location.search]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId || !canReview) {
        return;
    }
    try {
        const isEditingReview = Boolean(editingReviewId);
        const res = await fetch(
            isEditingReview
              ? `http://localhost:5001/api/products/${id}/reviews/${editingReviewId}`
              : `http://localhost:5001/api/products/${id}/reviews`,
            {
            method: isEditingReview ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId, ...reviewForm })
            }
        );
        const data = await res.json();
        if (res.ok) {
            setReviews((prev) =>
              isEditingReview
                ? prev.map((review) => (review.id === data.id ? data : review))
                : [data, ...prev.filter((review) => review.id !== data.id)]
            );
            setReviewStatus(
              isEditingReview
                ? "Your review has been updated and sent for approval."
                : "Your review has been submitted and is shown below."
            );
            setReviewForm({ rating: 5, comment: "" });
            setEditingReviewId(null);
        } else {
            setReviewStatus(data.error || "Failed to submit review.");
        }
    } catch {
        setReviewStatus("An error occurred. Please try again.");
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;
    const cartKey = getCartKey();
    const existing = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const found = existing.find((item) => item.id === product.id);
    let updatedCart;
    if (found) {
      if (found.quantity + quantity > product.stock) return;
      updatedCart = existing.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      updatedCart = [...existing, { ...product, quantity }];
    }
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    setCartCount(updatedCart.reduce((total, item) => total + item.quantity, 0));
    const userId = user?.user?.id || user?.id;
    if (userId) {
      try {
        await fetch(`http://localhost:5001/api/cart/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity }),
        });
      } catch (err) { console.error(err); }
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const approvedReviews = useMemo(() => reviews.filter(r => r.status === 'approved'), [reviews]);
  const visibleReviews = useMemo(() => reviews.filter(r => r.status === 'approved' || r.user_id === currentUserId), [reviews, currentUserId]);
  const userReview = useMemo(() => reviews.find((r) => r.user_id === currentUserId) || null, [reviews, currentUserId]);
  const hasUserReview = useMemo(() => Boolean(userReview), [userReview]);
  const isEditingUserReview = useMemo(
    () => Boolean(userReview && editingReviewId === userReview.id),
    [editingReviewId, userReview]
  );

  useEffect(() => {
    if (!userReview) {
      return;
    }

    const reviewIdToEdit = Number(new URLSearchParams(location.search).get("editReview"));
    if (!reviewIdToEdit || reviewIdToEdit !== userReview.id) {
      return;
    }

    setEditingReviewId(userReview.id);
    setReviewForm({ rating: userReview.rating, comment: userReview.comment || "" });
    navigate(`/product/${id}?review=true`, { replace: true });
  }, [id, location.search, navigate, userReview]);

  const avgRating = useMemo(() => {
    if (approvedReviews.length === 0) return 0;
    return (approvedReviews.reduce((a, b) => a + b.rating, 0) / approvedReviews.length).toFixed(1);
  }, [approvedReviews]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    approvedReviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
    return dist;
  }, [approvedReviews]);

  const renderStars = (rating, size = '1rem') => {
    return (
      <span className="pd-stars" style={{ fontSize: size }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={i <= Math.round(rating) ? 'pd-star filled' : 'pd-star empty'}>★</span>
        ))}
      </span>
    );
  };

  const beginReviewEdit = (review) => {
    if (!review || review.user_id !== currentUserId) {
      return;
    }

    setEditingReviewId(review.id);
    setReviewStatus("");
    setReviewForm({ rating: review.rating, comment: review.comment || "" });
    setActiveTab("reviews");
    navigate(`/product/${id}?review=true`, { replace: true });

    window.requestAnimationFrame(() => {
      document.querySelector(".pd-write-review")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const cancelReviewEdit = () => {
    setEditingReviewId(null);
    setReviewStatus("");
    setReviewForm({ rating: 5, comment: "" });
  };

  if (isLoading) return (
    <div className="main-page-wrapper">
      <Header searchTerm={""} onSearchChange={() => navigate('/')} cartCount={cartCount} cartAnimating={false} />
      <div className="pd-loading">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="main-page-wrapper">
      <Header searchTerm={""} onSearchChange={() => navigate('/')} cartCount={cartCount} cartAnimating={false} />
      <div className="pd-loading">
        <h2>Product not found.</h2>
        <button className="pd-back-btn" onClick={() => navigate("/")}>← Back to Home</button>
      </div>
    </div>
  );

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const scrollToReviews = () => {
    setActiveTab('reviews');
    document.getElementById('pd-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Build specs dynamically from product data
  const specifications = [];
  if (product.warranty) specifications.push({ label: 'Warranty', value: product.warranty });
  if (product.distributor) specifications.push({ label: 'Distributor', value: product.distributor });
  if (product.serial_no) specifications.push({ label: 'Serial No / SKU', value: product.serial_no });
  if (product.model) specifications.push({ label: 'Model', value: product.model });
  if (product.category) specifications.push({ label: 'Category', value: product.category });

  return (
    <div className="main-page-wrapper">
      <Header 
        searchTerm={""} 
        onSearchChange={() => navigate('/')} 
        cartCount={cartCount}
        cartAnimating={added}
      />

      <nav className="category-navbar">
        <div className="category-nav-container">
          <div className="category-nav-all" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            <span>All Categories</span>
          </div>
          {["Top Sellers", "Clothing", "Home & Kitchen", "Books", "Sports & Outdoors", "Electronics"].map((cat) => (
            <a
              key={cat}
              className="category-nav-link"
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            >
              {cat}
            </a>
          ))}
        </div>
      </nav>

      <div className="pd-container">
        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <span className="pd-breadcrumb-link" onClick={() => navigate('/')}>Home</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          {product.category && (
            <>
              <span className="pd-breadcrumb-link" onClick={() => navigate('/')}>{product.category}</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </>
          )}
          <span className="pd-breadcrumb-current">{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="pd-main-card">
          {/* Left: Product Image */}
          <div className="pd-image-section">
            {product.category && (
              <span className="pd-category-badge">{product.category}</span>
            )}
            <img
              className="pd-product-image"
              src={product.image_url || `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              onError={(e) => { e.target.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.name)}`; }}
            />
          </div>

          {/* Right: Product Info */}
          <div className="pd-info-section">
            <h1 className="pd-title">{product.name}</h1>
            
            {/* Rating & Reviews link */}
            <div className="pd-rating-row">
              {renderStars(avgRating, '1.15rem')}
              <span className="pd-rating-score">
                {approvedReviews.length > 0 ? avgRating : 'No ratings yet'}
              </span>
              <span className="pd-rating-count" onClick={scrollToReviews}>
                ({approvedReviews.length} {approvedReviews.length === 1 ? 'review' : 'reviews'})
              </span>
              {approvedReviews.length > 0 && (
                <span className="pd-see-reviews" onClick={scrollToReviews}>See reviews</span>
              )}
            </div>

            {/* Price */}
            <div className="pd-price-row">
              <span className="pd-price">${parseFloat(product.price).toFixed(2)}</span>
            </div>

            {/* Stock */}
            <div className="pd-stock-row">
              {isOutOfStock ? (
                <span className="pd-stock-badge out-of-stock">Out of Stock</span>
              ) : isLowStock ? (
                <span className="pd-stock-badge low-stock">Only {product.stock} left in stock!</span>
              ) : (
                <span className="pd-stock-badge in-stock">In Stock ({product.stock})</span>
              )}
            </div>

            {/* Short description */}
            {product.description && (
              <p className="pd-short-desc">{product.description}</p>
            )}

            {/* Key highlights / Meta */}
            {specifications.length > 0 && (
              <div className="pd-highlights">
                {specifications.slice(0, 3).map((spec, i) => (
                  <div className="pd-highlight-item" key={i}>
                    <span className="pd-highlight-label">{spec.label}</span>
                    <span className="pd-highlight-value">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="pd-quantity-section">
                <label className="pd-quantity-label">Quantity</label>
                <div className="pd-quantity-controls">
                  <button 
                    className="pd-qty-btn" 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >−</button>
                  <span className="pd-qty-value">{quantity}</span>
                  <button 
                    className="pd-qty-btn" 
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                  >+</button>
                </div>
              </div>
            )}

            {/* Add to Cart / Buy Now Buttons */}
            <div className="pd-action-buttons">
              <button
                className={`pd-add-to-cart-btn ${added ? 'added' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  <>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    Unavailable
                  </>
                ) : added ? (
                  <>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="pd-tabs-section" id="pd-tabs-section">
          <div className="pd-tabs-header">
            <button 
              className={`pd-tab ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button 
              className={`pd-tab ${activeTab === 'specifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('specifications')}
            >
              Specifications
            </button>
            <button 
              className={`pd-tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({approvedReviews.length})
            </button>
          </div>

          <div className="pd-tab-content">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="pd-tab-panel">
                {product.description ? (
                  <div className="pd-description-content">
                    <p>{product.description}</p>
                  </div>
                ) : (
                  <p className="pd-no-content">No description available for this product.</p>
                )}
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specifications' && (
              <div className="pd-tab-panel">
                {specifications.length > 0 ? (
                  <table className="pd-specs-table">
                    <tbody>
                      {specifications.map((spec, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'even' : 'odd'}>
                          <td className="pd-spec-label">{spec.label}</td>
                          <td className="pd-spec-value">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="pd-no-content">No specifications available for this product.</p>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="pd-tab-panel">
                {/* Rating Summary */}
                <div className="pd-reviews-summary">
                  <div className="pd-rating-overview">
                    <div className="pd-rating-big">
                      <span className="pd-rating-number">{approvedReviews.length > 0 ? avgRating : '—'}</span>
                      <span className="pd-rating-outof">/5</span>
                    </div>
                    {renderStars(avgRating, '1.5rem')}
                    <span className="pd-total-reviews">{approvedReviews.length} {approvedReviews.length === 1 ? 'review' : 'reviews'}</span>
                  </div>
                  <div className="pd-rating-bars">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = ratingDistribution[star - 1];
                      const pct = approvedReviews.length > 0 ? (count / approvedReviews.length) * 100 : 0;
                      return (
                        <div className="pd-rating-bar-row" key={star}>
                          <span className="pd-bar-label">{star} ★</span>
                          <div className="pd-bar-track">
                            <div className="pd-bar-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="pd-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write a Review */}
                {canReview && (!hasUserReview || isEditingUserReview) && (
                  <div className="pd-write-review">
                    <h3 className="pd-review-form-title">
                      {isEditingUserReview ? "Edit Your Review" : "Write a Review"}
                    </h3>
                    <form onSubmit={handleReviewSubmit} className="pd-review-form">
                      <div className="pd-form-group">
                        <label>Rating</label>
                        <div className="pd-star-select">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button 
                              key={star} 
                              type="button"
                              className={`pd-star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
                              onClick={() => setReviewForm({...reviewForm, rating: star})}
                            >★</button>
                          ))}
                          <span className="pd-star-text">{reviewForm.rating}/5</span>
                        </div>
                      </div>
                      <div className="pd-form-group">
                        <label>Your Review</label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                          rows="4"
                          className="pd-review-textarea"
                          placeholder={isEditingUserReview ? "Update your review..." : "Share your experience with this product..."}
                        />
                      </div>
                      {reviewStatus && (
                        <p className={`pd-review-status ${reviewStatus.includes("error") || reviewStatus.includes("already") || reviewStatus.includes("Failed") || reviewStatus.includes("must be logged") ? 'error' : 'success'}`}>
                          {reviewStatus}
                        </p>
                      )}
                      <div className="pd-review-form-actions">
                        <button type="submit" className="pd-submit-review-btn">
                          {isEditingUserReview ? "Update Review" : "Submit Review"}
                        </button>
                        {isEditingUserReview && (
                          <button type="button" className="pd-secondary-review-btn" onClick={cancelReviewEdit}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {/* Reviews List */}
                <div className="pd-reviews-list">
                  {visibleReviews.length === 0 ? (
                    <div className="pd-no-reviews">
                      <svg width="48" height="48" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      <p>No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    visibleReviews.map(r => (
                      <div className="pd-review-card" key={r.id}>
                        <div className="pd-reviewer-avatar">
                          {getReviewerInitials(r.user_name)}
                        </div>
                        <div className="pd-review-body">
                          <div className="pd-review-header">
                            <div className="pd-reviewer-info">
                              <div className="pd-reviewer-meta">
                                <div className="pd-reviewer-line">
                                  <span className="pd-reviewer-name">{maskReviewerName(r.user_name)}</span>
                                  <span className="pd-review-inline-date">{getReviewDateLabel(r)}</span>
                                  {r.status && r.status !== "approved" && (
                                    <span className={`pd-review-status-badge ${r.status}`}>
                                      {r.status}
                                    </span>
                                  )}
                                  {r.user_id === currentUserId && (
                                    <button
                                      type="button"
                                      className={`pd-edit-review-btn ${editingReviewId === r.id ? "active" : ""}`}
                                      onClick={() => beginReviewEdit(r)}
                                    >
                                      {editingReviewId === r.id ? "Editing..." : "Edit Review"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="pd-review-stars">
                              {renderStars(r.rating, '1rem')}
                            </div>
                          </div>
                          {r.comment && <p className="pd-review-comment">{r.comment}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
