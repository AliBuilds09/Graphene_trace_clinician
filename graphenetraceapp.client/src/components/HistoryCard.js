import React from 'react';
import Heatmap from '../components/Heatmap.js';

const HistoryCard = ({ historyItem, onSave, onDelete, onDownload, onClick }) => {
    const parseFrameData = (frameDataJson) => {
        try {
            const frames = JSON.parse(frameDataJson);
            if (frames && frames.length > 0) {
                const values = frames[0].values || [];
                const peakPressure = frames[0].peakPressure || 0;
                return { values, peakPressure };
            }
        } catch (e) {
            console.error('Error parsing FrameData:', e);
        }
        return { values: [], peakPressure: 0 };
    };

    const parsed = historyItem.measurement ? parseFrameData(historyItem.measurement.frameData) : { values: [], peakPressure: 0 };

    return (
        <div className="card h-100 shadow-lg" onClick={onClick} style={{ cursor: 'pointer', borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff, #f8f9fa)', transition: 'transform 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="card-header bg-primary text-white text-center fw-bold" style={{ borderRadius: '15px 15px 0 0' }}>
                <i className="bi bi-calendar-event me-2"></i>
                {new Date(historyItem.snapshotAt).toLocaleString()}
            </div>
            <div className="card-body d-flex flex-column">
                <div className="mb-3">
                    <small className="text-muted fw-semibold">Quick Heatmap View</small>
                    <div className="mt-2 d-flex justify-content-center">
                        {parsed.values.length > 0 ? (
                            <Heatmap values={parsed.values} size={150} />
                        ) : (
                            <div className="d-flex align-items-center justify-content-center" style={{ width: '150px', height: '150px', background: '#e9ecef', borderRadius: '10px' }}>
                                <i className="bi bi-graph-up fs-2 text-muted"></i>
                            </div>
                        )}
                    </div>
                    <div className="mt-2 text-center">
                        <small className="text-muted">Peak Pressure: <strong>{parsed.peakPressure.toFixed(2)} mmHg</strong></small>
                    </div>
                </div>
                <div className="mt-auto d-flex gap-2 flex-wrap">
                    <button className="btn btn-danger btn-sm rounded-pill flex-fill" onClick={(e) => { e.stopPropagation(); onDelete(historyItem.historyID); }}>
                        <i className="bi bi-trash me-1"></i>Delete
                    </button>
                    <button className="btn btn-primary btn-sm rounded-pill flex-fill" onClick={(e) => { e.stopPropagation(); onDownload(historyItem); }}>
                        <i className="bi bi-download me-1"></i>Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HistoryCard;