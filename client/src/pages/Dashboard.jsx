import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
  "All Categories",
  "Electronics",
  "Home & Kitchen",
  "Clothing",
  "Books",
  "Sports & Outdoors",
  "Automotive"
];

const mockProducts = [
  { id: 1, title: 'Wireless Noise-Canceling Headphones', price: '$150.00', stock: 'Only 1 left', category: 'Electronics', image: 'https://via.placeholder.com/300x200?text=Headphones' },
  { id: 2, title: 'Men\'s Running Shoes', price: '$85.00', stock: 'In Stock (5)', category: 'Clothing', image: 'https://via.placeholder.com/300x200?text=Shoes' },
  { id: 3, title: 'Stainless Steel Toaster', price: '$40.00', stock: 'In Stock (3)', category: 'Home & Kitchen', image: 'https://via.placeholder.com/300x200?text=Toaster' },
  { id: 4, title: 'Bestselling Fiction Novel', price: '$18.00', stock: 'In Stock (12)', category: 'Books', image: 'https://via.placeholder.com/300x200?text=Novel' },
  { id: 5, title: 'Yoga Mat', price: '$22.00', stock: 'In Stock (8)', category: 'Sports & Outdoors', image: 'https://via.placeholder.com/300x200?text=Yoga+Mat' },
  { id: 6, title: 'Smart LED Light Bulb', price: '$15.00', stock: 'In Stock (20)', category: 'Home & Kitchen', image: 'https://via.placeholder.com/300x200?text=Light+Bulb' }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState("All Categories");

  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory = activeCategory === "All Categories" || product.category === activeCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for electronics, clothing, books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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

      <h2 className="section-title">
        {activeCategory === "All Categories" ? "Featured Items" : activeCategory}
      </h2>

      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="image-container">
                <img src={product.image} alt={product.title} />
              </div>
              <h3 className="product-title">{product.title}</h3>
              <div className="product-price">{product.price}</div>
              <div className="product-stock">{product.stock}</div>
              <button className="add-to-cart-btn">Add to Cart</button>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No products found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
