import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Tasks from './components/Tasks/index.js';
import Home from './components/Home';
// import Calendar from './components/Calendar';
// import Routine from './components/Routine';
// import Settings from './components/Settings';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          {/*<Route path="/calendar" element={<Calendar />} />*/}
          {/*<Route path="/routine" element={<Routine />} />*/}
          {/*<Route path="/settings" element={<Settings />} />*/}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;