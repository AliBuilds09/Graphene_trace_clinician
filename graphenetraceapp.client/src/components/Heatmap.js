import React, { useState, useMemo } from 'react';

const Heatmap = ({ values, size = 320 }) => {
    if (!values || values.length !== 1024) return null; // 32x32 grid expected

    const cellSize = size / 32;

    // Color scale with RGBA for opacity intensity
    const getColor = (value) => {
        if (value === 0) return '#6A5ACD'; // SlateBlue (Very Low)
        else if (value <= 250) {
            // Low (green shades)
            const intensity = (value - 1) / 249;
            return `rgba(34, 139, 34, ${intensity.toFixed(2)})`; // ForestGreen with opacity
        } else if (value <= 420) {
            // Medium (orange-yellow shades)
            const intensity = (value - 251) / 169;
            return `rgba(255, 165, 0, ${intensity.toFixed(2)})`; // Orange
        } else {
            // High (red shades)
            const intensity = Math.min((value - 420) / 100, 1);
            return `rgba(220, 20, 60, ${intensity.toFixed(2)})`; // Crimson
        }
    };

    // Memoized tooltip content array for performance
    const tooltips = useMemo(() => {
        return values.map(v => `${v.toFixed(2)} mmHg`);
    }, [values]);

    // State for tooltip display
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

    // Mouse handlers to show tooltip with offset
    const showTooltip = (e, content) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            content
        });
    };
    const hideTooltip = () => setTooltip({ ...tooltip, visible: false });

    return (
        <div style={{ position: 'relative', width: size, userSelect: 'none' }}>
            <svg
                width={size}
                height={size}
                style={{
                    borderRadius: 12,
                    background: 'linear-gradient(145deg, #f0f0f5, #cacde1)', // subtle card background
                    boxShadow: 'inset 2px 2px 4px #d9d9e6, inset -2px -2px 4px #ffffff',
                    display: 'block',
                }}
                role="img"
                aria-label="Pressure distribution heatmap"
                tabIndex={0}
            >
                {/* X and Y axis labels */}
                <text x={size / 2} y={size + 20} textAnchor="middle" fill="#555" fontSize="10" fontFamily="Arial">X Coordinate</text>
                <text transform={`translate(-25, ${size / 2}) rotate(-90)`} fill="#555" fontSize="10" fontFamily="Arial" textAnchor="middle">Y Coordinate</text>

                {/* Render each cell */}
                {values.map((value, idx) => {
                    const x = (idx % 32) * cellSize;
                    const y = Math.floor(idx / 32) * cellSize;
                    return (
                        <rect
                            key={idx}
                            x={x}
                            y={y}
                            width={cellSize}
                            height={cellSize}
                            fill={getColor(value)}
                            stroke="#d7dde6"
                            strokeWidth="0.3"
                            tabIndex={0}
                            aria-label={`Pressure value: ${value.toFixed(2)} millimeters of mercury`}
                            onMouseEnter={e => showTooltip(e, tooltips[idx])}
                            onFocus={e => showTooltip(e, tooltips[idx])}
                            onMouseLeave={hideTooltip}
                            onBlur={hideTooltip}
                            style={{ transition: 'fill 0.3s ease' }}
                        />
                    );
                })}
            </svg>

            {/* Tooltip */}
            {tooltip.visible && (
                <div
                    style={{
                        position: 'fixed',
                        top: tooltip.y,
                        left: tooltip.x,
                        transform: 'translate(-50%, -100%)',
                        padding: '6px 10px',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        borderRadius: 6,
                        pointerEvents: 'none',
                        fontSize: 12,
                        fontFamily: 'Arial, sans-serif',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        zIndex: 1000,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                >
                    {tooltip.content}
                </div>
            )}

            {/* Legend */}
            <div style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 20,
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                color: '#444',
                userSelect: 'none',
            }}>
                <LegendItem color="#6A5ACD" label="Very Low (0 mmHg)" />
                <LegendItem color="rgba(34, 139, 34, 1)" label="Low (1–250 mmHg)" />
                <LegendItem color="rgba(255, 165, 0, 1)" label="Medium (251–420 mmHg)" />
                <LegendItem color="rgba(220, 20, 60, 1)" label="High (420+ mmHg)" />
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
            width: 18,
            height: 18,
            backgroundColor: color,
            borderRadius: 4,
            boxShadow: '0 0 5px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.1)'
        }} />
        <span>{label}</span>
    </div>
);

export default Heatmap;