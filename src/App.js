import React, { useState } from 'react';
import Routine from './components/Routine';
import GoalsTracker from './components/GoalsTracker';
import NextAction from './components/NextAction';
import DailyTodo from './components/DailyTodo';
import Journal from './components/Journal';
import Events from './components/Events';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("Routine");

  return (
    <div className="app-container">
      <header>
        <h1>My Routine &amp; Goals Tracker</h1>
        <nav>
          {["Routine", "Goals", "Next Action", "Daily Todos", "Journal", "Events"].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {activeTab === "Routine" && <Routine />}
        {activeTab === "Goals" && <GoalsTracker />}
        {activeTab === "Next Action" && <NextAction />}
        {activeTab === "Daily Todos" && <DailyTodo />}
        {activeTab === "Journal" && <Journal />}
        {activeTab === "Events" && <Events />}
      </main>
    </div>
  );
}

export default App;