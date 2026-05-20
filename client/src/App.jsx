import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard'; // This is now your unified Main Page
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from "./pages/Orders";
import Footer from './components/Footer';
import './App.css';
import ProductDetail from './pages/ProductDetail';
import MyAccount from './pages/myaccount/MyAccount';
import AccountInfo from './pages/myaccount/AccountInfo';
import MyOrders from './pages/myaccount/MyOrders';
import MyReviews from './pages/myaccount/MyReviews';
import MyAddresses from './pages/myaccount/MyAddresses';

function App() {
  useEffect(() => {
    const verifyUser = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          const userId = userObj?.user?.id || userObj?.id;
          if (userId) {
            const res = await fetch(`http://localhost:5001/api/auth/verify/${userId}`);
            if (!res.ok) {
              // User doesn't exist anymore, clear localStorage
              localStorage.removeItem('user');
              window.dispatchEvent(new Event('userChanged'));
            }
          }
        } catch (err) {
          console.error('Error verifying user:', err);
        }
      }
    };
    verifyUser();
  }, []);

  return (
    <Router>
      <div className="App">
        {/* Notice we removed the <Navigation /> component from here 
            because your Dashboard.jsx now handles its own smart header! */}
        <main>
          <Routes>
            {/* Set the combined Dashboard as the absolute main page */}
            <Route path="/" element={<Dashboard />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/product/:id" element={<ProductDetail />} />

            <Route path="/myaccount" element={<MyAccount />}>
              <Route path="info" element={<AccountInfo />} />
              <Route path="myorders" element={<MyOrders />} />
              <Route path="myreviews" element={<MyReviews />} />
              <Route path="addresses" element={<MyAddresses />} />
            </Route>
            
            {/* You no longer need a separate '/dashboard' route */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;