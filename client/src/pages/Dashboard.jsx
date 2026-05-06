import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';

const defaultCategories = [
  "All Categories",
  "Electronics",
  "Home & Kitchen",
  "Clothing",
  "Books",
  "Sports & Outdoors",
  "Automotive"
];

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [sortOption, setSortOption] = useState("newest");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cartAnimating, setCartAnimating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('userChanged', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('userChanged', syncUser);
    };
  }, []);

  const handleSignOut = (e) => {
    if (e) e.preventDefault();
    localStorage.removeItem('user');
    setUser(null);
    const guestCart = localStorage.getItem('guest_cart');
    setCart(guestCart ? JSON.parse(guestCart) : []);
    window.dispatchEvent(new Event('userChanged'));
    // it solves the issue of not page refleshing after logout
    window.location.href = '/';
  };

  const getCartKey = () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return 'guest_cart';
    const user = JSON.parse(savedUser);
    const userId = user?.user?.id || user?.id;
    return `cart_user_${userId}`;
  };

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(getCartKey());
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const userId = user?.user?.id || user?.id;
    if (userId) {
      fetch(`http://localhost:5001/api/cart/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCart(data);
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem(getCartKey());
      setCart(savedCart ? JSON.parse(savedCart) : []);
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchedCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const categories = [
    "All Categories",
    "Top Sellers",
    ...(fetchedCategories.length > 0
      ? fetchedCategories
      : defaultCategories.filter(c => c !== "All Categories"))
  ];

  const handleAddToCart = async (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      if (existingProduct) {
        if (existingProduct.quantity >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 300);

    const userId = user?.user?.id || user?.id;
    if (userId) {
      try {
        await fetch(`http://localhost:5001/api/cart/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 1 })
        });
      } catch (err) {
        console.error('Error adding to DB cart:', err);
      }
    }
  };

  const getPopularityScore = (product) => {
    const rating = Number(product.average_rating || 0);
    const reviewCount = Number(product.review_count || 0);
    const salesCount = Number(product.sales_count || 0);

    if (reviewCount === 0) return salesCount;
    return (rating * 100) + (reviewCount * 10) + salesCount;
  };

  const compareByPopularity = (a, b) => {
    const scoreDiff = getPopularityScore(b) - getPopularityScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    const ratingDiff = Number(b.average_rating || 0) - Number(a.average_rating || 0);
    if (ratingDiff !== 0) return ratingDiff;

    const reviewDiff = Number(b.review_count || 0) - Number(a.review_count || 0);
    if (reviewDiff !== 0) return reviewDiff;

    return (a.name || "").localeCompare(b.name || "");
  };

  const topSellersIds = [...products]
    .filter(p => getPopularityScore(p) > 0)
    .sort(compareByPopularity)
    .slice(0, 6)
    .map(p => p.id);

  const renderRating = (product) => {
    const rating = Number(product.average_rating || 0);
    const reviewCount = Number(product.review_count || 0);
    const roundedRating = Math.round(rating);

    if (reviewCount === 0) {
      return (
        <div className="product-rating">
          <span className="stars muted">★★★★★</span>
          <span className="rating-text">No reviews</span>
        </div>
      );
    }

    return (
      <div className="product-rating" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        <span className="stars">
          {"★".repeat(roundedRating)}{"☆".repeat(5 - roundedRating)}
        </span>
        <span className="rating-text">{rating.toFixed(1)} ({reviewCount})</span>
      </div>
    );
  };

  const filteredProducts = products.filter((product) => {
    const categoryMatches =
      activeCategory === "All Categories" ? true :
        activeCategory === "Top Sellers" ? topSellersIds.includes(product.id) :
          product.category === activeCategory;

    const term = searchTerm.toLowerCase();

    const nameMatches =
      product.name && product.name.toLowerCase().includes(term);

    const descriptionMatches =
      product.description && product.description.toLowerCase().includes(term);

    return categoryMatches && (nameMatches || descriptionMatches);
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === "price-low") return Number(a.price) - Number(b.price);
    if (sortOption === "price-high") return Number(b.price) - Number(a.price);
    if (sortOption === "popularity" || activeCategory === "Top Sellers") return compareByPopularity(a, b);
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return (
    <div className={`main-page-wrapper ${isSidebarOpen ? 'no-scroll' : ''}`} style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar Drawer */}
      <div className={`sidebar-drawer ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <svg className="user-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path></svg>
          <h3>Hello, {user?.user?.first_name || user?.first_name || user?.user?.name?.split(' ')[0] || "Sign In"}</h3>
          <button className="sidebar-close" onClick={() => setIsSidebarOpen(false)}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Trending</div>
            <div className="sidebar-item" onClick={() => { setActiveCategory("Top Sellers"); setIsSidebarOpen(false); }}>
              Top Sellers
            </div>
            <div className="sidebar-item">New Releases</div>
            <div className="sidebar-item">Movers & Shakers</div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Shop By Category</div>
            {categories.filter(cat => cat !== 'All Categories' && cat !== 'Top Sellers').map(cat => (
              <div 
                key={cat} 
                className="sidebar-item" 
                onClick={() => { setActiveCategory(cat); setIsSidebarOpen(false); }}
              >
                {cat}
                <svg className="chevron" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Help & Settings</div>
            <Link to="/profile" className="sidebar-item" style={{ textDecoration: 'none' }}>Your Account</Link>
            <div className="sidebar-item">Customer Service</div>
            {user ? (
              <div className="sidebar-item" onClick={handleSignOut}>Sign Out</div>
            ) : (
              <Link to="/login" className="sidebar-item" style={{ textDecoration: 'none' }}>Sign In</Link>
            )}
          </div>
        </div>
      </div>

      {/* --- TOP NAVIGATION BAR --- */}
      {/* --- TOP NAVIGATION BAR --- */}
      <Header 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        cartCount={cart.reduce((total, item) => total + item.quantity, 0)}
        cartAnimating={cartAnimating}
      />



      <nav className="category-navbar">
        <div className="category-nav-container">
          <div className="category-nav-all" onClick={() => setIsSidebarOpen(true)} style={{ cursor: 'pointer' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            <span>All Categories</span>
          </div>
          {categories.filter(cat => cat !== 'All Categories').map((cat) => (
            <a
              key={cat}
              className={`category-nav-link ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </a>
          ))}
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '1400px', margin: '40px auto 0', padding: '0 40px' }}>

        {/* --- HERO BANNER CAROUSEL --- */}
        <div className="hero-banner-v3" style={{ marginBottom: '3rem', width: '100%', position: 'relative' }}>
          <div className="hero-content-wrapper" style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>

            <div
              style={{
                display: 'flex',
                transition: 'transform 0.5s ease-in-out',
                transform: `translateX(-${currentSlide * 50}%)`,
                width: '200%'
              }}
            >
              {/* Slide 1: Welcome Banner */}
              <div className="hero-card-featured" style={{ width: '50%', flexShrink: 0, borderRadius: 0, backgroundColor: 'var(--pazaryolu-red)' }}>
                <div className="hero-featured-text" style={{ alignItems: 'center', textAlign: 'center' }}>
                  <img src="/logo.png" alt="PazarYolu Logo" className="hero-featured-logo" style={{ marginBottom: '0.5rem' }} />
                  <h2 style={{ fontSize: '3.2rem', fontWeight: '900', margin: 0, color: 'white', whiteSpace: 'nowrap' }}>
                    Discover the <span style={{ color: '#ffd700' }}>Best Deals</span>
                  </h2>
                  <p style={{ fontSize: '1.4rem', marginTop: '0.8rem', color: 'white', opacity: 0.95, fontWeight: '600' }}>
                    Find everything you need right here in our marketplace.
                  </p>
                </div>
                <div className="hero-mascot-container">
                  <img src="/camel-mascot.png" alt="PazarYolu Mascot" className="hero-mascot" />
                </div>
              </div>

              {/* Slide 2: Top Sellers */}
              <div className="hero-card-featured" style={{ width: '50%', flexShrink: 0, borderRadius: 0, backgroundColor: 'var(--pazaryolu-red)' }}>
                <div className="hero-featured-text" style={{ alignItems: 'center', textAlign: 'center' }}>
                  <img src="/logo.png" alt="PazarYolu Logo" className="hero-featured-logo" style={{ marginBottom: '0.5rem' }} />
                  <h2 style={{ fontSize: '3.2rem', fontWeight: '900', margin: 0, color: 'white', whiteSpace: 'nowrap' }}>
                    Shop From <span style={{ color: '#ffd700' }}>Top Sellers</span>
                  </h2>
                  <p style={{ fontSize: '1.4rem', marginTop: '0.8rem', color: 'white', opacity: 0.95, fontWeight: '600' }}>
                    Discover our most selling products, carefully selected just for you.
                  </p>
                  <button
                    onClick={() => { setActiveCategory("Top Sellers"); }}
                    style={{ background: '#ffd700', color: '#1a1a1a', border: 'none', padding: '0.9rem 2.2rem', borderRadius: '10px', fontWeight: '800', marginTop: '1.5rem', cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 6px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }}>
                    View Top Sellers
                  </button>
                </div>
                <div className="hero-mascot-container">
                  <img
                    src="/top-sellers-mascot.png"
                    alt="Top Sellers Mascot"
                    className="hero-mascot"
                    onError={(e) => {
                      e.target.style.opacity = '0';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Carousel Dots */}
            <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCurrentSlide(0)}
                style={{ width: '12px', height: '12px', borderRadius: '50%', border: 'none', background: currentSlide === 0 ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, transition: 'background 0.3s' }}
                aria-label="Go to slide 1"
              />
              <button
                onClick={() => setCurrentSlide(1)}
                style={{ width: '12px', height: '12px', borderRadius: '50%', border: 'none', background: currentSlide === 1 ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, transition: 'background 0.3s' }}
                aria-label="Go to slide 2"
              />
            </div>
          </div>
        </div>



        {/* --- DASHBOARD CONTENT BELOW HERO --- */}
        <div className="dashboard-content">
          {/* --- SECTION HEADER --- */}
          {activeCategory !== "All Categories" && (
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 className="section-title" style={{ fontSize: '2.4rem', fontWeight: '800', color: '#1a1a1a', marginBottom: '0.8rem' }}>
                {activeCategory}
              </h2>
            </div>
          )}



          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              {activeCategory === "All Categories" ? "Featured Items" : activeCategory}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '1rem', fontWeight: '500' }}>
                ({sortedProducts.length} results)
              </span>
            </h2>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '0.65rem 0.9rem',
                background: '#fff',
                color: 'var(--text-dark)',
                fontWeight: 700,
                cursor: 'pointer',
                minWidth: '180px'
              }}
              aria-label="Sort products"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', flexDirection: 'column', alignItems: 'center' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Loading fresh deals...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--pazaryolu-red)', backgroundColor: '#fcebeb', borderRadius: '12px' }}>
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: '1rem' }}><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"></path></svg>
              <h3>Oops! Something went wrong.</h3>
              <p>{error}</p>
            </div>
          ) : (
            <div className="product-grid">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product) => (
                  <div key={product.id} className={`product-card fade-in ${topSellersIds.includes(product.id) ? 'top-seller' : ''}`} onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: "pointer" }}>
                    <div className="image-container">
                      {product.category && (
                        <span className="category-badge">{product.category}</span>
                      )}
                      {topSellersIds.includes(product.id) && (
                        <img
                          src="/top-sellers.png"
                          alt=""
                          className="top-seller-badge"
                          style={{ position: 'absolute', bottom: '8px', left: '8px', width: '65px', height: 'auto', zIndex: 15, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <img
                        src={product.image_url || `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}`}
                        alt={product.name}
                      />
                    </div>
                    <div className="product-info">
                      <h3 className="product-title" title={product.name}>{product.name}</h3>
                      {renderRating(product)}
                      <div className="product-meta">
                        <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                        {product.stock <= 0 ? (
                          <span className="stock-badge out">Out of Stock</span>
                        ) : product.stock <= 5 ? (
                          <span className="stock-badge low">Only {product.stock} Left!</span>
                        ) : (
                          <span className="stock-badge ok">In Stock ({product.stock})</span>
                        )}
                      </div>
                      <button
                        className="add-to-cart-btn"
                        disabled={product.stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        {product.stock <= 0 ? 'Unavailable' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <svg width="64" height="64" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <h3>No products found</h3>
                  <p>Try adjusting your search or category filter to find what you're looking for.</p>
                  <button className="nav-button-primary" style={{ marginTop: '1rem' }} onClick={() => { setSearchTerm(''); setActiveCategory('All Categories'); }}>Clear Filters</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
