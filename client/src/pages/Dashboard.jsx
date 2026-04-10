import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cartAnimating, setCartAnimating] = useState(false);
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

const handleSignOut = () => {
  localStorage.removeItem('user');
  setUser(null);
  window.dispatchEvent(new Event('userChanged'));
  navigate('/');
};

  const getCartKey = () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return 'guest_cart';
    const user = JSON.parse(savedUser);
    return `cart_user_${user.id}`;
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

  const handleAddToCart = (product) => {
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
  };

  const topSellersIds = [...products]
    .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
    .slice(0, 4)
    .filter(p => (p.sales_count || 0) > 0)
    .map(p => p.id);

  const filteredProducts = products.filter((product) => {
    const categoryMatches = 
      activeCategory === "All Categories" ? true :
      activeCategory === "Top Sellers" ? topSellersIds.includes(product.id) :
      product.category === activeCategory;
    const nameMatches = product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatches && nameMatches;
  });

  return (
    <div className="main-page-wrapper" style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="navbar" style={{ backgroundColor: 'var(--pazaryolu-red)', borderBottom: 'none' }}>
        
        <div className="navbar-logo-container">
          <Link to="/">
            <img 
              src="/logo.png" 
              alt="PazarYolu Logo" 
              className="navbar-logo" 
            />
          </Link>
        </div>
        
        <div className="navbar-links" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
      {user ? (
        <>
          <Link
            to="/profile"
            className="nav-button nav-button-primary"
            style={{ textDecoration: 'none' }}
          >
            Profile ({user?.user?.name || "User"})
          </Link>

          <Link
            to ="/"
            onClick={handleSignOut}
            className="nav-button nav-button-primary"
          >
            Sign Out
          </Link>
        </>
      ) : (
        <>
          <Link to="/login" className="nav-button nav-button-primary">Login</Link>
          <Link to="/signup" className="nav-button nav-button-primary">Sign Up</Link>
        </>
      )}

      <Link to="/cart" style={{ display: 'flex', alignItems: 'flex-end', textDecoration: 'none', marginLeft: '5px' }} title="Go to Cart">
        <img 
          src="/cart-icon.png" 
          alt="Cart" 
          style={{ 
            height: '42px', 
            objectFit: 'contain', 
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', 
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: cartAnimating ? 'scale(1.4) rotate(-10deg)' : 'scale(1)'
          }} 
          onMouseOver={(e) => { if (!cartAnimating) e.target.style.transform = 'scale(1.08)' }}
          onMouseOut={(e) => { if (!cartAnimating) e.target.style.transform = 'scale(1)' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span style={{ 
            color: 'white', 
            fontWeight: '800', 
            fontSize: '1.25rem', 
            marginLeft: '6px', 
            marginBottom: '2px', 
            textShadow: '0 2px 4px rgba(0,0,0,0.15)',
            transition: 'color 0.3s',
            color: cartAnimating ? '#ffd700' : 'white'
          }}>
          ({cart.reduce((total, item) => total + item.quantity, 0)})
        </span>
      </Link>
          
        </div>
      </header>

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
              {/* Slide 1: Original */}
              <div className="hero-card-featured" style={{ width: '50%', flexShrink: 0, borderRadius: 0 }}>
                <div className="hero-featured-text" style={{ alignItems: 'center', textAlign: 'center' }}>
                  <img src="/logo.png" alt="PazarYolu Logo" className="hero-featured-logo" style={{ marginBottom: '0.5rem' }} />
                  <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'white' }}>
                      Discover the <span style={{ background: 'linear-gradient(to right, #ffd700, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Best Deals</span>
                    </h2>
                    <p style={{ fontSize: '1.2rem', marginTop: '0.5rem', color: 'white', fontWeight: '600', opacity: 0.9 }}>
                      Find everything you need right here in our marketplace.
                    </p>
                  </div>
                </div>
                <div className="hero-mascot-container">
                  <img src="/camel-mascot.png" alt="PazarYolu Mascot" className="hero-mascot" />
                </div>
              </div>

              {/* Slide 2: Top Sellers */}
              <div className="hero-card-featured" style={{ width: '50%', flexShrink: 0, borderRadius: 0, backgroundColor: 'var(--pazaryolu-red)' }}>
                <div className="hero-featured-text" style={{ alignItems: 'center', textAlign: 'center' }}>
                  <img src="/logo.png" alt="PazarYolu Logo" className="hero-featured-logo" style={{ marginBottom: '0.5rem' }} />
                  <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'white' }}>
                      Shop From <span style={{ background: 'linear-gradient(to right, #ffd700, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Top Sellers</span>
                    </h2>
                    <p style={{ fontSize: '1.2rem', marginTop: '0.5rem', color: 'white', fontWeight: '600', opacity: 0.9 }}>
                      Discover our most selling products, carefully selected just for you.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setActiveCategory("Top Sellers"); document.querySelector('.search-container').scrollIntoView({behavior: 'smooth'}); }}
                    style={{ background: '#d4af37', color: '#1a1a1a', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '8px', fontWeight: 'bold', margin: '1.5rem auto 0 auto', cursor: 'pointer', width: 'fit-content', fontSize: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
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

          {/* Search Bar */}
          <div className="search-container">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24" style={{ color: 'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search for electronics, clothing, books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0', flex: 1, outline: 'none', fontSize: '1.1rem' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            )}
            <button className="search-button">Search</button>
          </div>

          {/* Category Pills */}
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
              {activeCategory === "All Categories" ? "Featured Items" : activeCategory}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '1rem', fontWeight: '500' }}>
                ({filteredProducts.length} results)
              </span>
            </h2>
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
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div key={product.id} className={`product-card fade-in ${topSellersIds.includes(product.id) ? 'top-seller' : ''}`}>
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
                        onClick={() => handleAddToCart(product)}
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