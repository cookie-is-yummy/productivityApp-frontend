import React from 'react';

function Sidebar({ selectedMenu, setSelectedMenu }) {
  return (
    <aside className="sidebar">
      <ul>
        <li onClick={() => setSelectedMenu('home')} className={selectedMenu === 'home' ? 'active' : ''}>
          <i className="fa-solid fa-house"></i>
          <span>Home</span>
        </li>
        <li onClick={() => setSelectedMenu('todos')} className={selectedMenu === 'todos' ? 'active' : ''}>
          <i className="fa-solid fa-check-to-slot"></i>
          <span>Todos</span>
        </li>
        <li onClick={() => setSelectedMenu('goals')} className={selectedMenu === 'goals' ? 'active' : ''}>
          <i className="fa-solid fa-clipboard-list"></i>
          <span>Goals</span>
        </li>
        <li onClick={() => setSelectedMenu('routine')} className={selectedMenu === 'routine' ? 'active' : ''}>
          <i className="fa-solid fa-calendar-week"></i>
          <span>Routine</span>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;