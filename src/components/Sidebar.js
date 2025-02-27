import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faListCheck,
  faCalendar,
  faSyncAlt,
  faGear,
  faBook,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Sidebar.css';

const menuItems = [
    {
        category: 'MAIN',
        items: [
            { id: 'home', path: '/', label: 'Home', icon: <FontAwesomeIcon icon={faHouse} /> },
            { id: 'tasks', path: '/tasks', label: 'Tasks', icon: <FontAwesomeIcon icon={faListCheck} /> },
            { id: 'calendar', path: '/calendar', label: 'Calendar', icon: <FontAwesomeIcon icon={faCalendar} /> },
            { id: 'routine', path: '/routine', label: 'Routine', icon: <FontAwesomeIcon icon={faSyncAlt} /> },
        ]
    },
    {
        category: 'SETTINGS',
        items: [
            { id: 'settings', path: '/settings', label: 'Settings', icon: <FontAwesomeIcon icon={faGear} /> }
        ]
    }
];

const Sidebar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <>
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                <FontAwesomeIcon icon={faBars} />
            </button>

            <nav className={`sidebar ${mobileMenuOpen ? 'mobile-visible' : ''}`}>
                <div className="sidebar-header">
                    <FontAwesomeIcon icon={faBook} className="app-icon" />
                    <h2>Productivity App</h2>
                </div>
                <ul className="menu-items">
                    {menuItems.map((group) => (
                        <div key={group.category}>
                            <div className="menu-category">{group.category}</div>
                            {group.items.map((item) => (
                                <li key={item.id} className="menu-item">
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) => isActive ? 'active' : ''}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <span className="menu-icon">{item.icon}</span>
                                        {item.label}
                                    </NavLink>
                                </li>
                            ))}
                        </div>
                    ))}
                </ul>
            </nav>
        </>
    );
};

export default Sidebar;