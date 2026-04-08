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
  const navigate = useNavigate();

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
  const categories = fetchedCategories.length > 0
    ? ["All Categories", ...fetchedCategories]
    : defaultCategories;

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) return prevCart;
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const filteredProducts = products.filter((product) => {
    const categoryMatches = activeCategory === "All Categories" || product.category === activeCategory;
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
            {user.name}
          </Link>

          <button
            onClick={handleSignOut}
            className="nav-button nav-button-primary"
            style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="nav-button nav-button-primary">Login</Link>
          <Link to="/signup" className="nav-button nav-button-primary">Sign Up</Link>
        </>
      )}

      <Link to="/cart" className="nav-button nav-button-primary">
        Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
      </Link>
          
        </div>
      </header>

      <div className="container" style={{ maxWidth: '1400px', margin: '40px auto 0', padding: '0 40px' }}>

        {/* --- HERO BANNER (Grey Background Removed) --- */}
        <div className="hero-banner-v3" style={{ marginBottom: '3rem', width: '100%' }}>
          <div className="hero-content-wrapper">
            
            <div className="hero-card-featured">
              <div className="hero-featured-text">
                <img src="/logo.png" alt="PazarYolu Logo" className="hero-featured-logo" />
                <p>The Most Trusted Online Marketplace</p>
              </div>
              <div className="hero-mascot-container">
                <img src="/camel-mascot.png" alt="PazarYolu Mascot" className="hero-mascot" />
              </div>
            </div>
            
          </div>
        </div>

        {/* --- DASHBOARD CONTENT BELOW HERO --- */}
        <div className="dashboard-content">
          <div className="dashboard-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
              Discover the <span style={{ color: 'var(--pazaryolu-red)' }}>Best Deals</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Find everything you need right here in our marketplace.</p>
          </div>

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
                  <div key={product.id} className="product-card fade-in">
                    <div className="image-container">
                      {product.category && (
                        <span className="category-badge">{product.category}</span>
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