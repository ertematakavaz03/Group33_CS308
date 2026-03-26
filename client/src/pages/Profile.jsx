import React, { useState } from 'react';

const Profile = () => {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = () => {
    console.log('Applying for Shop Owner Role...');
    
    setIsApplying(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Your Profile Dashboard</h2>
      
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
        <h3>Personal Information</h3>
        <p>Name: John Doe (Mock)</p>
        <p>Email: john@example.com</p>
        <p>Role: Customer</p>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
        <h3>Become a Shop Owner</h3>
        <p>Want to sell your own products? Apply to become a shop owner today.</p>
        <button onClick={handleApply} disabled={isApplying}>
          {isApplying ? 'Application Sent (Pending Admin Approval)' : 'Apply Now'}
        </button>
      </div>

    </div>
  );
};

export default Profile;
