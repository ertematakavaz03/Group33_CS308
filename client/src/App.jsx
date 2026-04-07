import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import './App.css';
const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/dashboard';

  const handleSignOut = () => {
    navigate('/login');
  };

  return (
    <header className="navbar" style={{ 
      backgroundColor: 'var(--pazaryolu-red)',
      borderBottom: 'none'
    }}>
      <div className="navbar-logo-container">
        <Link to={isDashboard ? "/dashboard" : "/"}>
          <img 
            src="/logo.png" 
            alt="PazarYolu Logo" 
            className="navbar-logo" 
          />
        </Link>
      </div>
      
      <div className="navbar-links">
        {isDashboard ? (
          <button onClick={handleSignOut} className="nav-button" style={{ backgroundColor: '#fff', color: 'var(--pazaryolu-red)' }}>Sign Out</button>
        ) : (
          <>
            <Link to="/" className="nav-link" style={{ color: '#fff' }}>Home</Link>
            <Link to="/login" className="nav-button">Login</Link>
            <Link to="/signup" className="nav-button nav-button-primary">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
};

function AppContent() {
  return (
    <div className="App">
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
