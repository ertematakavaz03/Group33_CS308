import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";

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

const renderReviewStars = (rating) => (
  <span className="my-review-stars" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= rating ? "filled" : "empty"}>
        {star <= rating ? "\u2605" : "\u2606"}
      </span>
    ))}
  </span>
);

const getStatusLabel = (status) => {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending review";
};

const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentUser = user?.user || user;

  useEffect(() => {
    if (!currentUser?.id) {
      navigate("/login");
      return;
    }

    fetch(`http://localhost:5001/api/reviews/user/${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching reviews:", err);
        setLoading(false);
      });

    const cartKey = currentUser?.id ? `cart_user_${currentUser.id}` : "guest_cart";
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      setCartCount(cartItems.reduce((acc, item) => acc + item.quantity, 0));
    }
  }, [currentUser?.id, navigate]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header cartCount={cartCount} onSearchChange={(val) => navigate(`/?search=${val}`)} />

      <div className="account-portal-container">
        <aside className="account-sidebar">
          <div className="sidebar-title">My Account</div>

          <Link to="/profile" className="sidebar-menu-item">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            User Information
          </Link>

          <Link to="/orders" className="sidebar-menu-item">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14v14m0-14L4 7m16 0v10l-8 4m0-14l-8 4M4 7v10l8 4"></path></svg>
            All Orders
          </Link>

          <Link to="/my-reviews" className="sidebar-menu-item active">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
            My Reviews
          </Link>

          <Link to="/addresses" className="sidebar-menu-item">
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            My Addresses
          </Link>

          <div
            className="sidebar-menu-item"
            style={{ cursor: "pointer", color: "#ef4444", marginTop: "10px" }}
            onClick={() => {
              localStorage.removeItem("user");
              window.dispatchEvent(new Event("userChanged"));
              navigate("/");
            }}
          >
            <svg className="sidebar-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </div>
        </aside>

        <main className="account-main-content">
          <div className="content-header">
            <h1>My Reviews</h1>
            <p>View and manage your product feedback</p>
          </div>

          {loading ? (
            <div className="my-reviews-loading">
              <div className="spinner"></div>
              <p>Loading your reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="portal-empty-state">
              <h3>No reviews yet</h3>
              <p>You haven't reviewed any products yet. Share your experience with others!</p>
              <button onClick={() => navigate("/")} className="my-reviews-primary-btn">
                Explore Products
              </button>
            </div>
          ) : (
            <div className="my-reviews-list">
              {reviews.map((review) => (
                <article key={review.id} className="my-review-card">
                  <div className="my-review-image-frame">
                    <img
                      src={review.image_url || "https://via.placeholder.com/100"}
                      alt={review.product_name}
                      className="my-review-image"
                    />
                  </div>

                  <div className="my-review-content">
                    <div className="my-review-header">
                      <div className="my-review-summary">
                        <h4 className="my-review-product-name">{review.product_name}</h4>
                        <div className="my-review-meta">
                          {renderReviewStars(review.rating)}
                          <span className="my-review-date">{getReviewDateLabel(review)}</span>
                        </div>
                      </div>

                      <span className={`my-review-status-badge ${review.status || "pending"}`}>
                        {getStatusLabel(review.status)}
                      </span>
                    </div>

                    <p className="my-review-comment">
                      {review.comment || "No written comment was added for this review."}
                    </p>

                    <div className="my-review-actions">
                      <button
                        type="button"
                        className="my-review-edit-btn"
                        onClick={() => navigate(`/product/${review.product_id}?editReview=${review.id}`)}
                      >
                        Edit Review
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyReviews;
