import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const defaultCategories = [
  "All Categories",
  "Electronics",
  "Home & Kitchen",
  "Clothing",
  "Books",
  "Sports & Outdoors",
  "Automotive"
];

const DISCOUNTED_CATEGORY = "Discounted Products";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [sortOption, setSortOption] = useState("newest");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cartAnimating, setCartAnimating] = useState(false);
  const [stockAlert, setStockAlert] = useState('');
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const authDropdownRef = useRef(null);
  const authCloseTimer = useRef(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  const userCloseTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) setActiveCategory(cat);
  }, [location.search]);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (authDropdownRef.current && !authDropdownRef.current.contains(e.target)) {
        setShowAuthDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const [wishlistBusyId, setWishlistBusyId] = useState(null);

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
    window.addEventListener('reviewUpdated', fetchProducts);
    return () => window.removeEventListener('reviewUpdated', fetchProducts);
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
    const userId = user?.user?.id || user?.id;
    if (!userId) {
      setWishlistIds(new Set());
      return undefined;
    }

    const fetchWishlist = () => {
      fetch(`http://localhost:5001/api/wishlist/${userId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch wishlist');
          return res.json();
        })
        .then(data => {
          const ids = Array.isArray(data) ? data.map(item => Number(item.id)) : [];
          setWishlistIds(new Set(ids));
        })
        .catch(console.error);
    };

    fetchWishlist();
    window.addEventListener('wishlistChanged', fetchWishlist);
    return () => window.removeEventListener('wishlistChanged', fetchWishlist);
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
    DISCOUNTED_CATEGORY,
    ...(fetchedCategories.length > 0
      ? fetchedCategories
      : defaultCategories.filter(c => c !== "All Categories"))
  ];

  const showStockAlert = (msg) => {
    setStockAlert(msg);
    setTimeout(() => setStockAlert(''), 3000);
  };

  const handleAddToCart = async (product) => {
    if (product.stock <= 0) {
      showStockAlert('This product is out of stock.');
      return;
    }
    const existing = cart.find((item) => item.id === product.id);
    if (existing && existing.quantity >= product.stock) {
      showStockAlert(`No more stock available for "${product.name}".`);
      return;
    }
    const cartProduct = {
      ...product,
      original_price: product.price,
      price: product.is_on_discount ? product.effective_price : product.price,
    };
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
      return [...prevCart, { ...cartProduct, quantity: 1 }];
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

  const handleToggleWishlist = async (product, event) => {
    event.stopPropagation();

    const userId = user?.user?.id || user?.id;
    if (!userId) {
      navigate('/login');
      return;
    }

    const productId = Number(product.id);
    if (wishlistBusyId === productId) return;

    const isWishlisted = wishlistIds.has(productId);
    setWishlistBusyId(productId);
    setWishlistIds(prev => {
      const next = new Set(prev);
      if (isWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });

    try {
      const response = isWishlisted
        ? await fetch(`http://localhost:5001/api/wishlist/${userId}/${productId}`, { method: 'DELETE' })
        : await fetch(`http://localhost:5001/api/wishlist/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
          });

      if (!response.ok && !(isWishlisted && response.status === 404)) {
        throw new Error('Failed to update wishlist');
      }

      window.dispatchEvent(new Event('wishlistChanged'));
    } catch (err) {
      console.error(err);
      setWishlistIds(prev => {
        const next = new Set(prev);
        if (isWishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
      showStockAlert('Could not update wishlist. Please try again.');
    } finally {
      setWishlistBusyId(null);
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
        activeCategory === DISCOUNTED_CATEGORY ? product.is_on_discount === true :
          product.category === activeCategory;

    const term = searchTerm.toLowerCase();

    const nameMatches =
      product.name && product.name.toLowerCase().includes(term);

    const descriptionMatches =
      product.description && product.description.toLowerCase().includes(term);

    return categoryMatches && (nameMatches || descriptionMatches);
  });

  const priceFor = (p) => Number(p.is_on_discount ? p.effective_price : p.price);
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === "price-low") return priceFor(a) - priceFor(b);
    if (sortOption === "price-high") return priceFor(b) - priceFor(a);
    if (sortOption === "popularity" || activeCategory === "Top Sellers") return compareByPopularity(a, b);
    if (activeCategory === DISCOUNTED_CATEGORY) {
      const discountDiff = Number(b.discount_percentage || 0) - Number(a.discount_percentage || 0);
      if (discountDiff !== 0) return discountDiff;
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return (
    <div className="main-page-wrapper" style={{ animation: 'fadeIn 0.5s ease-in-out' }}>

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
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease'
          }}>
            🚫 {stockAlert}
          </div>
        </div>
      )}

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
            <div
              ref={userDropdownRef}
              style={{ position: 'relative' }}
              onMouseEnter={() => {
                clearTimeout(userCloseTimer.current);
                setShowUserDropdown(true);
              }}
              onMouseLeave={() => {
                userCloseTimer.current = setTimeout(() => setShowUserDropdown(false), 200);
              }}
            >
              <button style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#fff', color: 'var(--pazaryolu-red)',
                border: '2px solid #fff', borderRadius: '12px',
                padding: '0.55rem 1.1rem', fontWeight: '700',
                fontSize: '0.95rem', cursor: 'pointer',
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                {user?.user?.name?.split(' ')[0] || 'Account'}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showUserDropdown && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#fff', borderRadius: '14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  minWidth: '220px', zIndex: 1000,
                  border: '1px solid rgba(0,0,0,0.07)',
                  overflow: 'hidden'
                }}>
                  {/* arrow */}
                  <div style={{
                    position: 'absolute', top: '-7px', right: '22px',
                    width: 0, height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderBottom: '7px solid #fff',
                    filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.07))'
                  }} />

                  {/* user info header */}
                  <div style={{
                    padding: '1rem 1.2rem 0.75rem',
                    borderBottom: '1px solid #f3f4f6',
                    background: '#fafafa'
                  }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111' }}>
                      {user?.user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                      {user?.user?.email || ''}
                    </div>
                  </div>

                  {/* menu items */}
                  {[
                    {
                      to: '/myaccount/info', label: 'Account Information',
                      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    },
                    {
                      to: '/myaccount/myorders', label: 'My Orders',
                      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    },
                    {
                      to: '/myaccount/myreviews', label: 'My Reviews',
                      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    },
                    {
                      to: '/myaccount/wishlist', label: 'My Wishlist',
                      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    },
                    {
                      to: '/myaccount/addresses', label: 'My Addresses',
                      svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    },
                  ].map(({ to, svg, label }) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => setShowUserDropdown(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '0.7rem 1.2rem',
                        color: '#374151', fontWeight: '600', fontSize: '0.875rem',
                        textDecoration: 'none', whiteSpace: 'nowrap',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background 0.12s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: '#9ca3af', flexShrink: 0 }}>{svg}</span>
                      {label}
                    </Link>
                  ))}

                  {/* sign out */}
                  <button
                    onClick={() => { setShowUserDropdown(false); handleSignOut(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '0.7rem 1.2rem',
                      background: 'transparent', border: 'none',
                      color: 'var(--pazaryolu-red)', fontWeight: '700',
                      fontSize: '0.875rem', cursor: 'pointer',
                      transition: 'background 0.12s', textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: 'var(--pazaryolu-red)', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              ref={authDropdownRef}
              style={{ position: 'relative' }}
              onMouseEnter={() => {
                clearTimeout(authCloseTimer.current);
                setShowAuthDropdown(true);
              }}
              onMouseLeave={() => {
                authCloseTimer.current = setTimeout(() => setShowAuthDropdown(false), 200);
              }}
            >
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fff',
                  color: 'var(--pazaryolu-red)',
                  border: '2px solid #fff',
                  borderRadius: '12px',
                  padding: '0.55rem 1.1rem',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Login
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: showAuthDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showAuthDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#fff',
                  borderRadius: '14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  minWidth: '180px',
                  zIndex: 1000,
                  border: '1px solid rgba(0,0,0,0.07)',
                  padding: '0.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  {/* arrow */}
                  <div style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '22px',
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderBottom: '7px solid #fff',
                    filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.07))'
                  }} />
                  <Link
                    to="/login"
                    onClick={() => setShowAuthDropdown(false)}
                    style={{
                      display: 'block',
                      padding: '0.7rem 1rem',
                      background: 'var(--pazaryolu-red)',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      textDecoration: 'none',
                      borderRadius: '9px',
                      textAlign: 'center',
                      transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setShowAuthDropdown(false)}
                    style={{
                      display: 'block',
                      padding: '0.7rem 1rem',
                      background: '#fff',
                      color: 'var(--pazaryolu-red)',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      textDecoration: 'none',
                      borderRadius: '9px',
                      textAlign: 'center',
                      border: '1.5px solid var(--pazaryolu-red)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
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
                    onClick={() => { setActiveCategory("Top Sellers"); document.querySelector('.search-container').scrollIntoView({ behavior: 'smooth' }); }}
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
          {/* Search Bar */}
          <div className="search-container">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24" style={{ color: 'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search for electronics, clothing, books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.slice(0, 100))}
              maxLength={100}
              style={{ border: 'none', background: 'transparent', padding: '0 1rem', flex: 1, outline: 'none', fontSize: '1.1rem' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                {activeCategory === "All Categories" ? "Featured Items" : activeCategory}
              </h2>
              <span style={{
                background: activeCategory === "Top Sellers"
                  ? 'linear-gradient(135deg, #d4af37, #f0d060)'
                  : activeCategory === DISCOUNTED_CATEGORY
                    ? '#dc2626'
                    : 'var(--pazaryolu-red)',
                color: '#fff',
                padding: '3px 10px', borderRadius: '999px',
                fontSize: '0.8rem', fontWeight: '700',
              }}>
                {sortedProducts.length} results
              </span>
            </div>
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
                sortedProducts.map((product) => {
                  const productId = Number(product.id);
                  const isWishlisted = wishlistIds.has(productId);
                  const wishlistBusy = wishlistBusyId === productId;

                  return (
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
                      <button
                        type="button"
                        className={`wishlist-image-btn ${isWishlisted ? 'active' : ''}`}
                        disabled={wishlistBusy}
                        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                        onClick={(e) => handleToggleWishlist(product, e)}
                      >
                        <svg width="21" height="21" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      {product.is_on_discount && (
                        <span style={{ position: 'absolute', top: '62px', right: '10px', background: '#dc2626', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', zIndex: 15, boxShadow: '0 2px 8px rgba(220,38,38,0.35)' }}>
                          -{parseFloat(product.discount_percentage).toFixed(0)}%
                        </span>
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
                        {product.is_on_discount ? (
                          <span className="product-price" style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                            <span>${parseFloat(product.effective_price).toFixed(2)}</span>
                            <span style={{ color: '#9ca3af', textDecoration: 'line-through', fontSize: '0.78rem', fontWeight: '600' }}>${parseFloat(product.price).toFixed(2)}</span>
                          </span>
                        ) : (
                          <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                        )}
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
                  );
                })
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
