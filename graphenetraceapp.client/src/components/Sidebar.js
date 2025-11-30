// src/components/Sidebar.js

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ role }) => {
    const location = useLocation();

    const menuItems = {
        patient: [
            { path: '/patient-dashboard', label: 'Dashboard', icon: 'bi-house-door' },
            { path: '/patient-history', label: 'History', icon: 'bi-clock-history' },
            { path: '/patient-message', label: 'Messages', icon: 'bi-chat-dots' },
            { path: '/patient-settings', label: 'Settings', icon: 'bi-gear' },
        ],
        clinician: [
            { path: '/clinician-dashboard', label: 'Dashboard', icon: 'bi-house-door' },
            { path: '/clinician-compare', label: 'Compare', icon: 'bi-bar-chart' },
            { path: '/clinician-message', label: 'Messages', icon: 'bi-chat-dots' },
            { path: '/clinician-settings', label: 'Settings', icon: 'bi-gear' },
        ],
        admin: [
            { path: '/admin-dashboard', label: 'Dashboard', icon: 'bi-house-door' },
            { path: '/admin-manage', label: 'Manage', icon: 'bi-people' },
        ],
    };

    const items = menuItems[role] || [];

    return (
        <nav className="vh-100 p-3 shadow-lg position-sticky top-0" style={{ width: '280px', background: '#87CEEB', position: 'relative' }}>
            <div className="text-center mb-4 position-relative" style={{ zIndex: 1 }}>
                <i className="bi bi-heart-pulse-fill fs-2 text-white mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}></i>
                <h4 className="text-white fw-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{role.charAt(0).toUpperCase() + role.slice(1)} Panel</h4>
                <hr className="bg-white opacity-50" />
            </div>
            <ul className="nav flex-column position-relative" style={{ zIndex: 1 }}>
                {items.map(item => (
                    <li key={item.path} className="nav-item mb-2">
                        <Link
                            to={item.path}
                            className={`nav-link fw-semibold rounded-pill px-3 py-3 d-flex align-items-center transition-all ${location.pathname === item.path ? 'bg-primary text-white shadow-lg' : 'text-white'}`}
                            style={{
                                textDecoration: 'none',
                                transform: location.pathname === item.path ? 'scale(1.05)' : 'scale(1)',
                                backgroundColor: location.pathname === item.path ? '#000080' : 'transparent', // Navy blue for active
                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                            }}
                            onMouseEnter={(e) => { if (location.pathname !== item.path) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }}
                            onMouseLeave={(e) => { if (location.pathname !== item.path) e.target.style.backgroundColor = 'transparent'; }}
                        >
                            <i className={`bi ${item.icon} me-3 fs-5`}></i>
                            <span>{item.label}</span>
                            {location.pathname === item.path && <i className="bi bi-chevron-right ms-auto"></i>}
                        </Link>
                    </li>
                ))}
                <li className="nav-item mt-4">
                    <button
                        className="btn btn-outline-light w-100 rounded-pill fw-semibold py-2 position-relative text-white"
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/login';
                        }}
                        style={{ transition: 'all 0.3s ease', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                </li>
            </ul>
            <div className="mt-4 text-center text-white opacity-75 position-relative" style={{ zIndex: 1, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                <small>&copy; 2025 Graphene Trace</small>
            </div>
        </nav>
    );
};

export default Sidebar;
