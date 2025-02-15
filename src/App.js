import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Todos from './components/Todos';
import Goals from './components/Goals';
import Routine from './components/Routine';
import './styles/output.css';
import './App.css';

function App() {
  const [selectedMenu, setSelectedMenu] = useState('home');

  const renderContent = () => {
    switch (selectedMenu) {
      case 'home':
        return <Home />;
      case 'todos':
        return <Todos />;
      case 'goals':
        return <Goals />;
      case 'routine':
        return <Routine />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="app">
      <Sidebar selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;