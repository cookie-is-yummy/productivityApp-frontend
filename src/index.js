// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your App.js component
import './App.css'; // Import your App.css styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);