import React from 'react';

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="hero-banner-v3">
        <div className="hero-content-wrapper">
          
          <div className="hero-card-featured">
            <div className="hero-featured-text">
              <img src="/logo.png" alt="PazarYolu Logo" className="hero-featured-logo" />
              <p>The Most Trusted Marketplace for Students</p>
            </div>
            <div className="hero-mascot-container">
              <img src="/camel-mascot.png" alt="PazarYolu Mascot" className="hero-mascot" />
            </div>
          </div>
          
          
          <div className="hero-cards-grid">
            <div className="hero-card-sub"></div>
            <div className="hero-card-sub"></div>
            <div className="hero-card-sub"></div>
            <div className="hero-card-sub"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
