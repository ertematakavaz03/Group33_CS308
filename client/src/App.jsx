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

function App() {
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
            
            {/* You no longer need a separate '/dashboard' route */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;