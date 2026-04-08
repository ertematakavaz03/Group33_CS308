import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const handleIncrease = (id) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrease = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemove = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [cart]);

  return (
    <div
      className="container"
      style={{
        maxWidth: '1400px',
        paddingTop: '2rem',
        paddingBottom: '3rem',
        animation: 'fadeIn 0.5s ease-in-out'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.3rem',
              fontWeight: '800',
              color: 'var(--text-dark)',
              marginBottom: '0.4rem'
            }}
          >
            Your <span style={{ color: 'var(--pazaryolu-red)' }}>Cart</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Review your selected items before checkout.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            padding: '0.9rem 1.2rem',
            cursor: 'pointer',
            fontWeight: '700',
            color: 'var(--text-dark)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {cart.length === 0 ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 10px 24px rgba(0,0,0,0.05)'
          }}
        >
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', color: 'var(--text-dark)' }}>
            Your cart is empty
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Add some products from the dashboard to see them here.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'var(--pazaryolu-red)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '1rem 1.4rem',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  borderRadius: '22px',
                  padding: '1rem',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr auto',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                <img
                  src={
                    item.image_url ||
                    `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name)}`
                  }
                  alt={item.name}
                  style={{
                    width: '140px',
                    height: '110px',
                    objectFit: 'cover',
                    borderRadius: '18px',
                    background: '#f3f4f6'
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '999px',
                      background: '#f8f8f8',
                      color: 'var(--text-dark)',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      marginBottom: '0.85rem'
                    }}
                  >
                    {item.category || 'Category'}
                  </div>

                  <h3
                    style={{
                      margin: '0 0 0.6rem 0',
                      fontSize: '1.35rem',
                      color: 'var(--text-dark)'
                    }}
                  >
                    {item.name}
                  </h3>

                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      color: 'var(--pazaryolu-red)'
                    }}
                  >
                    ${Number(item.price).toFixed(2)}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '180px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '0.6rem',
                      marginBottom: '0.9rem'
                    }}
                  >
                    <button
                      onClick={() => handleDecrease(item.id)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: '700'
                      }}
                    >
                      -
                    </button>

                    <span
                      style={{
                        minWidth: '28px',
                        textAlign: 'center',
                        fontWeight: '800',
                        fontSize: '1rem'
                      }}
                    >
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => handleIncrease(item.id)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: '700'
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: '800',
                      marginBottom: '0.9rem',
                      color: 'var(--text-dark)'
                    }}
                  >
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    style={{
                      background: '#fceaea',
                      color: 'var(--pazaryolu-red)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: '22px',
              padding: '1.4rem',
              boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
              height: 'fit-content',
              position: 'sticky',
              top: '1.5rem'
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: '1.25rem',
                color: 'var(--text-dark)',
                fontSize: '1.5rem'
              }}
            >
              Order Summary
            </h2>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>Total Items</span>
              <strong style={{ color: 'var(--text-dark)' }}>{totalItems}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1.2rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>Subtotal</span>
              <strong style={{ color: 'var(--text-dark)' }}>${totalPrice.toFixed(2)}</strong>
            </div>

            <div
              style={{
                borderTop: '1px solid #eee',
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1.4rem'
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                Total
              </span>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: 'var(--pazaryolu-red)'
                }}
              >
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              style={{
                width: '100%',
                background: 'var(--pazaryolu-red)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '1rem',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '1rem',
                marginBottom: '0.8rem'
              }}
            >
              Proceed to Checkout
            </button>

            <button
              onClick={handleClearCart}
              style={{
                width: '100%',
                background: '#f8f8f8',
                color: 'var(--text-dark)',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '0.95rem',
                cursor: 'pointer',
                fontWeight: '700'
              }}
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;