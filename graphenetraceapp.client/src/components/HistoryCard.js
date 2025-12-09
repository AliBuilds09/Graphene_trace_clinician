import React from 'react';
import Heatmap from '../components/Heatmap.js';

const HistoryCard = ({ historyItem, onSave, onDelete, onDownload, onClick }) => {
    const parseFrameData = (frameDataJson) => {
        try {
            const frames = JSON.parse(frameDataJson);
            if (frames && frames.length > 0) {
                const values = frames[0].values || [];
                const peakPressure = frames[0].peakPressure || 0;
                const contactArea = frames[0].contactArea || 0;
                const avgPressure = frames[0].avgPressure || 0;
                return { values, peakPressure, contactArea, avgPressure };
            }
        } catch (e) {
            console.error('Error parsing FrameData:', e);
        }
        return { values: [], peakPressure: 0, contactArea: 0, avgPressure: 0 };
    };

    const parsed = historyItem.measurement ? parseFrameData(historyItem.measurement.frameData) : { values: [], peakPressure: 0, contactArea: 0, avgPressure: 0 };

    // Determine pressure level for color coding
    const getPressureColor = (pressure) => {
        if (pressure > 400) return 'text-danger';
        if (pressure > 200) return 'text-warning';
        return 'text-success';
    };

    return (
        <div
            className="card h-100 shadow-lg position-relative overflow-hidden"
            onClick={onClick}
            style={{
                cursor: 'pointer',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                border: 'none',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            }}
        >
            {/* Animated Background Gradient on Hover */}
            <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.4s ease',
                    borderRadius: '20px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            ></div>

            <div className="card-header bg-gradient-primary text-white text-center fw-bold position-relative" style={{
                borderRadius: '20px 20px 0 0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                zIndex: 2
            }}>
                <i className="bi bi-calendar-event me-2"></i>
                {new Date(historyItem.snapshotAt).toLocaleString()}
                {/* Status Badge */}
                <div className="position-absolute top-10 end-0 translate-middle">
                    <span className={`badge ${parsed.peakPressure > 400 ? 'bg-danger' : parsed.peakPressure > 200 ? 'bg-warning' : 'bg-success'} rounded-pill px-2 py-1`}>
                        <i className="bi bi-circle-fill me-1"></i>{parsed.peakPressure > 400 ? 'High' : parsed.peakPressure > 200 ? 'Medium' : 'Low'}
                    </span>
                </div>
            </div>

            <div className="card-body d-flex flex-column position-relative" style={{ zIndex: 2 }}>
                {/* Enhanced Heatmap Section */}
                <div className="mb-3">
                    <small className="text-muted fw-semibold d-block text-center mb-2">
                        <i className="bi bi-graph-up me-1"></i>Pressure Heatmap
                    </small>
                    <div className="mt-2 d-flex justify-content-center">
                        {parsed.values.length > 0 ? (
                            <div className="position-relative">
                                <Heatmap values={parsed.values} size={160} />
                                {/* Overlay for interactivity hint */}
                                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(255, 255, 255, 0.8)', borderRadius: '10px', opacity: 0, transition: 'opacity 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                                    <small className="text-primary fw-bold">Click for Details</small>
                                </div>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center" style={{ width: '160px', height: '160px', background: 'linear-gradient(135deg, #e9ecef, #dee2e6)', borderRadius: '15px', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}>
                                <i className="bi bi-graph-up fs-1 text-muted"></i>
                            </div>
                        )}
                    </div>
                </div>

                {/* KPIs Section */}
                <div className="mb-3">
                    <div className="row g-2 text-center">
                        <div className="col-4">
                            <small className="text-muted d-block">Peak</small>
                            <strong className={`fs-6 ${getPressureColor(parsed.peakPressure)}`}>{parsed.peakPressure.toFixed(2)} <small>mmHg</small></strong>
                        </div>
                        <div className="col-4">
                            <small className="text-muted d-block">Area</small>
                            <strong className="fs-6 text-info">{parsed.contactArea.toFixed(2)} <small>%</small></strong>
                        </div>
                        <div className="col-4">
                            <small className="text-muted d-block">Avg</small>
                            <strong className="fs-6 text-secondary">{parsed.avgPressure.toFixed(2)} <small>mmHg</small></strong>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto d-flex gap-2 flex-wrap">
                    <button
                        className="btn btn-outline-danger btn-sm rounded-pill flex-fill position-relative overflow-hidden"
                        onClick={(e) => { e.stopPropagation(); onDelete(historyItem.historyID); }}
                        style={{ transition: 'all 0.3s ease', border: 'none', background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <i className="bi bi-trash me-1"></i>Delete
                    </button>
                    <button
                        className="btn btn-outline-primary btn-sm rounded-pill flex-fill position-relative overflow-hidden"
                        onClick={(e) => { e.stopPropagation(); onDownload(historyItem); }}
                        style={{ transition: 'all 0.3s ease', border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <i className="bi bi-download me-1"></i>Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryCard;