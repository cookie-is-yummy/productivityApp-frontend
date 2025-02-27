import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, HashRouter } from 'react-router-dom';
import App from './App';
import './App.css';

// Using HashRouter instead of BrowserRouter for GitHub Pages compatibility
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);