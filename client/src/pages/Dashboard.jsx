import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    
    navigate('/login');
  };

  return (
    <div className="dashboard-wrapper">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        textAlign: 'center',
        padding: '0 1rem'
      }}>
        <h1 style={{ color: 'var(--pazaryolu-red)', fontSize: '3rem', fontWeight: 'bold' }}>Welcome to PazarYolu</h1>
      </div>
    </div>
  );
};

export default Dashboard;
