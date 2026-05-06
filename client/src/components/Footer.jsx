import React from 'react';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bottom-bar">
      <div className="bottom-bar-left">
        <img src="/logo.png" alt="PazarYolu Logo" className="bottom-bar-logo" />
      </div>
      <button onClick={scrollToTop} className="go-top-button">
        ↑
      </button>
    </footer>
  );
};

export default Footer;
