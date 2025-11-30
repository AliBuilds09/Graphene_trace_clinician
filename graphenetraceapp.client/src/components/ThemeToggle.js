// src/components/ThemeToggle.js
import React from 'react';

const ThemeToggle = ({ isDarkMode, onToggle }) => {
    return (
        <div className="form-check form-switch">
            <input
                className="form-check-input"
                type="checkbox"
                id="themeToggle"
                checked={isDarkMode}
                onChange={onToggle}
            />
            <label className="form-check-label" htmlFor="themeToggle">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </label>
        </div>
    );
};

export default ThemeToggle;
