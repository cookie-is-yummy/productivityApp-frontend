import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faListCheck,
  faCalendar,
  faSyncAlt,
  faGear,
  faBook
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Sidebar.css';

const menuItems = [
    {
        category: 'MAIN',
        items: [
            { id: 'home', label: 'Home', icon: <FontAwesomeIcon icon={faHouse} style={{ fontSize: '32px' }} /> },
            { id: 'tasks', label: 'Tasks', icon: <FontAwesomeIcon icon={faListCheck} style={{ fontSize: '32px' }} /> },
            { id: 'calendar', label: 'Calendar', icon: <FontAwesomeIcon icon={faCalendar} style={{ fontSize: '32px' }} /> },
            { id: 'routine', label: 'Routine', icon: <FontAwesomeIcon icon={faSyncAlt} style={{ fontSize: '32px' }} /> },
        ]
    },
    {
        category: 'SETTINGS',
        items: [
            { id: 'settings', label: 'Settings', icon: <FontAwesomeIcon icon={faGear} style={{ fontSize: '32px' }} /> }
        ]
    }
];

const Sidebar = ({ selectedMenu, setSelectedMenu }) => {
    return (
        <nav className="sidebar">
            <div className="sidebar-header">
                <FontAwesomeIcon icon={faBook} style={{ fontSize: '32px', marginRight: '8px' }} />
                <h2>Productivity App</h2>
            </div>
            <ul className="menu-items">
                {menuItems.map((group) => (
                    <div key={group.category}>
                        <div className="menu-category">{group.category}</div>
                        {group.items.map((item) => (
                            <li
                                key={item.id}
                                className={`menu-item ${selectedMenu === item.id ? 'active' : ''}`}
                                onClick={() => setSelectedMenu(item.id)}
                            >
                                <span className="menu-icon">{item.icon}</span>
                                {item.label}
                            </li>
                        ))}
                    </div>
                ))}
            </ul>
        </nav>
    );
};

export default Sidebar;