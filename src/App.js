import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';

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

function App() {
  const [selectedMenu, setSelectedMenu] = useState('home');

  const renderContent = () => {
    switch (selectedMenu) {
      case 'home':
        return <Home />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;