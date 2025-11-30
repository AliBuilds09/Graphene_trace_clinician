import React from 'react';

const Heatmap = ({ values, size = 320 }) => {
    if (!values || values.length !== 1024) return null; // Ensure values length is 32x32

    const cellSize = size / 32;

    // Updated color scale based on new pressure ranges: 0 (Very Low/Purple), 1-250 (Low/Blue), 251-420 (Medium/Yellow), 420+ (High/Red)
    const getColor = (value) => {
        if (value === 0) {
            return '#0000FF'; // Blue for Very Low (0)
        } else if (value <= 250) {
            // Low: Green shades
            const intensity = (value - 1) / 249; // From 1 to 250
            return `rgba(0, 255, 0, ${intensity})`; // Green
        } else if (value <= 420) {
            // Medium: Yellow shades
            const intensity = (value - 251) / 169; // From 251 to 420
            return `rgba(255, 165, 0, ${intensity})`; // Yellow
        } else {
            // High: Red shades
            const intensity = Math.min((value - 420) / 100, 1); // Cap at 1
            return `rgba(220, 53, 69, ${intensity})`; // Red
        }
    };

    return (
        <div style={{ display: 'inline-block', padding: '10px', backgroundColor: '#ffffff', borderRadius: '15px', boxShadow: '0 6px 12px rgba(0,0,0,0.15)' }}>
            <svg width={size} height={size} style={{ borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
                {values.map((value, idx) => (
                    <rect
                        key={idx}
                        x={(idx % 32) * cellSize}
                        y={Math.floor(idx / 32) * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill={getColor(value)}
                        stroke="#e0e0e0"
                        strokeWidth="0.2"
                        title={`${value.toFixed(2)} mmHg`}
                    />
                ))}
            </svg>
        </div>
    );
};

export default Heatmap;