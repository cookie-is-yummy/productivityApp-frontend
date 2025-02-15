import React from 'react';

function Sidebar({ selectedMenu, setSelectedMenu }) {
  return (
    <aside className="sidebar-container">
      <ul className="sidebar-menu">
        <li
          onClick={() => setSelectedMenu('home')}
          className={`menu-item ${selectedMenu === 'home' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-house menu-icon"></i>
          <span className="menu-text">Home</span>
        </li>
        <li
          onClick={() => setSelectedMenu('todos')}
          className={`menu-item ${selectedMenu === 'todos' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-check-to-slot menu-icon"></i>
          <span className="menu-text">Todos</span>
        </li>
        <li
          onClick={() => setSelectedMenu('goals')}
          className={`menu-item ${selectedMenu === 'goals' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-clipboard-list menu-icon"></i>
          <span className="menu-text">Goals</span>
        </li>
        <li
          onClick={() => setSelectedMenu('routine')}
          className={`menu-item ${selectedMenu === 'routine' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-calendar-week menu-icon"></i>
          <span className="menu-text">Routine</span>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;