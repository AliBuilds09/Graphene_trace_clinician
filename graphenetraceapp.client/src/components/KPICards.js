import React from 'react';

// Utility function for pressure level (can be imported elsewhere)
export const getPressureLevel = (value) => {
    const numValue = Number(value); // Convert to number if string
    // No change needed here
    if (isNaN(numValue)) {
        return { level: 'Unknown', color: '#6c757d', bgColor: '#f8f9fa' }; // Gray for invalid
    }
    if (numValue === 0) return { level: 'Very Low', color: '#6f42c1', bgColor: '#e2d9f3' }; // Purple for Very Low
    if (numValue <= 250) return { level: 'Low', color: '#007bff', bgColor: '#cce5ff' }; // Blue for Low
    if (numValue <= 420) return { level: 'Medium', color: '#ffc107', bgColor: '#fff3cd' }; // Yellow for Medium
    return { level: 'High', color: '#dc3545', bgColor: '#f8d7da' }; // Red for High
};

const KPICard = ({ title, value, unit, showPressureLevel = true }) => {
    // showPressureLevel controls whether to show the pressure level label and colors

    const { level, color, bgColor } = showPressureLevel ? getPressureLevel(value) : {
        level: '',
        color: '#0d6efd',    // Bootstrap primary blue for Contact and Avg Pressure by default
        bgColor: '#cfe2ff'   // Light blue background for consistency
    };

    const displayValue = (() => {
        const numValue = Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
            return numValue.toFixed(2);
        }
        return 'N/A';
    })();

    return (
        <div
            className="card p-3 shadow-sm text-center flex-fill m-2"
            style={{ minWidth: '180px', backgroundColor: bgColor, borderColor: color }}
        >
            <h6 style={{ color }}>{title}</h6>
            <p className="display-6 m-0" style={{ color, fontWeight: 'bold' }}>
                {displayValue} {unit}
            </p>
            {showPressureLevel && <small style={{ color }}>{level} Pressure</small>}
        </div>
    );
};

export default KPICard;