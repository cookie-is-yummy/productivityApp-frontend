import React from 'react';

const Home = () => (
  <div className="home-content">
    <h1>Welcome to Dashboard</h1>
    <div className="cards-container">
      <div className="card">
        <h3>Overview</h3>
        <p>Your current status and activities</p>
      </div>
      <div className="card">
        <h3>Statistics</h3>
        <p>Monthly performance metrics</p>
      </div>
      <div className="card">
        <h3>Recent Activity</h3>
        <p>Latest system updates</p>
      </div>
    </div>
  </div>
);

export default Home;