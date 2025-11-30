import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar.js';
import KPICard from '../components/KPICards.js';
import Heatmap from '../components/Heatmap.js';
import LineChart from '../components/LineChart.js';
import HistoryCard from '../components/HistoryCard.js';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [selectedDate, setSelectedDate] = useState('');
    const [timeRange, setTimeRange] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!token || !userId || isTokenExpired(token)) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            navigate('/login');
            return;
        }
        fetchHistory();
    }, [token, userId, navigate]);

    useEffect(() => {
        applyFilters();
    }, [history, selectedDate, timeRange, customStart, customEnd]);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`http://localhost:5033/api/patient/history/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            setHistory(response.data);
            setLoading(false);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                navigate('/login');
            } else {
                setError('Failed to load history. Please try again.');
            }
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...history];

        if (selectedDate) {
            const filterDate = new Date(selectedDate).toDateString();
            filtered = filtered.filter(h => new Date(h.snapshotAt).toDateString() === filterDate);
        }

        const now = new Date();
        if (timeRange === '6hours') {
            const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            filtered = filtered.filter(h => new Date(h.snapshotAt) >= sixHoursAgo);
        } else if (timeRange === '24hours') {
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            filtered = filtered.filter(h => new Date(h.snapshotAt) >= twentyFourHoursAgo);
        } else if (timeRange === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(h => new Date(h.snapshotAt) >= sevenDaysAgo);
        } else if (timeRange === 'custom' && customStart && customEnd) {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            filtered = filtered.filter(h => {
                const historyDate = new Date(h.snapshotAt);
                return historyDate >= start && historyDate <= end;
            });
        }

        setFilteredHistory(filtered);
    };

    const resetFilters = () => {
        setSelectedDate('');
        setTimeRange('all');
        setCustomStart('');
        setCustomEnd('');
    };

    const handleDelete = async (historyId) => {
        try {
            await axios.delete(`http://localhost:5033/api/patient/history/${historyId}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            setHistory(history.filter(h => h.historyID !== historyId));
        } catch (err) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                navigate('/login');
            } else {
                alert('Failed to delete history.');
            }
        }
    };

    const handleSave = async (historyItem) => {
        try {
            await axios.post('http://localhost:5033/api/patient/history', {
                userId: parseInt(userId),
                data: historyItem
            }, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            alert('History saved successfully!');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                navigate('/login');
            } else {
                alert('Failed to save history.');
            }
        }
    };

    const handleDownload = (historyItem) => {
        const dataStr = JSON.stringify(historyItem, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `history_${historyItem.historyID}.json`);
        linkElement.click();
    };

    const openModal = (historyItem) => {
        setSelectedHistory(historyItem);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedHistory(null);
    };

    const parseFrameData = (frameDataJson) => {
        try {
            const frames = JSON.parse(frameDataJson);
            if (frames && frames.length > 0) {
                const peakPressure = frames[0].peakPressure || 0;
                const contactArea = frames[0].contactArea || 0;
                const avgPressure = frames[0].avgPressure || 0;
                const values = frames[0].values || [];
                return { peakPressure, contactArea, avgPressure, values };
            }
        } catch (e) {
            console.error('HistoryPage: Error parsing FrameData:', e);
        }
        return { peakPressure: 0, contactArea: 0, avgPressure: 0, values: [] };
    };

    const parseLineChartData = (lineChartDataJson) => {
        try {
            return JSON.parse(lineChartDataJson) || [];
        } catch (e) {
            console.error('HistoryPage: Error parsing LineChartData:', e);
            return [];
        }
    };

    const isTokenExpired = (token) => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (e) {
            return true;
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <div className="text-center text-white">
                <div className="spinner-border" role="status"></div>
                <p className="mt-3">Loading history...</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #ff9a9e, #fecfef)' }}>
            <div className="alert alert-danger text-center shadow-lg" style={{ maxWidth: '500px' }}>
                <i className="bi bi-exclamation-triangle-fill fs-1 mb-3"></i>
                <h4>Oops!</h4>
                <p>{error}</p>
                <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>Retry</button>
            </div>
        </div>
    );

    return (
        <div className="d-flex vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa, #c9e6ff)' }}>
            <Sidebar role="patient" />
            <main className="flex-grow-1 p-4">
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-primary" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                        <i className="bi bi-clock-history me-3"></i>Measurement History
                    </h1>
                    <p className="lead text-muted">Explore your past pressure readings with advanced filters.</p>
                </div>

                {/* Summary Stats */}
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card shadow-lg text-center" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
                            <div className="card-body">
                                <i className="bi bi-graph-up fs-1 text-primary mb-2"></i>
                                <h5 className="card-title">Total Records</h5>
                                <p className="card-text fs-4 fw-bold text-primary">{filteredHistory.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card shadow-lg text-center" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
                            <div className="card-body">
                                <i className="bi bi-thermometer-half fs-1 text-danger mb-2"></i>
                                <h5 className="card-title">Avg Peak Pressure</h5>
                                <p className="card-text fs-4 fw-bold text-danger">
                                    {filteredHistory.length > 0 ? (filteredHistory.reduce((sum, h) => sum + (h.measurement?.peakPressure || 0), 0) / filteredHistory.length).toFixed(2) : 0} mmHg
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card shadow-lg text-center" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
                            <div className="card-body">
                                <i className="bi bi-calendar-event fs-1 text-success mb-2"></i>
                                <h5 className="card-title">Latest Entry</h5>
                                <p className="card-text fs-6 fw-bold text-success">
                                    {filteredHistory.length > 0 ? new Date(filteredHistory[0].snapshotAt).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card shadow-lg text-center" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ffffff, #f8f9fa)' }}>
                            <div className="card-body">
                                <i className="bi bi-bell fs-1 text-warning mb-2"></i>
                                <h5 className="card-title">Alerts</h5>
                                <p className="card-text fs-4 fw-bold text-warning">
                                    {filteredHistory.filter(h => h.measurement?.peakPressure > 400).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-lg p-4 mb-4" style={{ borderRadius: '15px', background: 'rgba(255, 255, 255, 0.9)' }}>
                    <h5 className="fw-bold text-primary mb-3">
                        <i className="bi bi-funnel me-2"></i>Filters
                    </h5>
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-calendar me-2"></i>Specific Date
                            </label>
                            <input
                                type="date"
                                className="form-control rounded-pill"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-clock me-2"></i>Time Range
                            </label>
                            <select
                                className="form-select rounded-pill"
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="6hours">Last 6 Hours</option>
                                <option value="24hours">Last 24 Hours</option>
                                <option value="7days">Last 7 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        {timeRange === 'custom' && (
                            <>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-calendar-event me-2"></i>Start Date/Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="form-control rounded-pill"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-calendar-check me-2"></i>End Date/Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="form-control rounded-pill"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        <div className="col-md-3 d-flex align-items-end">
                            <button className="btn btn-secondary rounded-pill px-4" onClick={resetFilters}>
                                <i className="bi bi-arrow-counterclockwise me-2"></i>Reset
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {filteredHistory.map(h => (
                        <div key={h.historyID} className="col-md-6 col-lg-4">
                            <HistoryCard
                                historyItem={h}
                                onSave={handleSave} // Still passed for compatibility, but not used in HistoryCard
                                onDelete={handleDelete}
                                onDownload={handleDownload}
                                onClick={() => openModal(h)}
                            />
                        </div>
                    ))}
                </div>

                {showModal && selectedHistory && (
                    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content" style={{ borderRadius: '20px' }}>
                                <div className="modal-header bg-primary text-white" style={{ borderRadius: '20px 20px 0 0' }}>
                                    <h5 className="modal-title">
                                        <i className="bi bi-info-circle me-2"></i>{new Date(selectedHistory.snapshotAt).toLocaleString()}
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                                </div>
                                <div className="modal-body">
                                    {selectedHistory.measurement ? (
                                        <>
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-4">
                                                    <KPICard title="Peak Pressure" value={selectedHistory.measurement.peakPressure?.toFixed(2) || '0.00'} unit="mmHg" showPressureLevel={true} />
                                                </div>
                                                <div className="col-md-4">
                                                    <KPICard title="Contact Area" value={selectedHistory.measurement.contactArea?.toFixed(2) || '0.00'} unit="%" showPressureLevel={false} />
                                                </div>
                                                <div className="col-md-4">
                                                    <KPICard title="Avg Pressure" value={selectedHistory.measurement.avgPressure?.toFixed(2) || '0.00'} unit="mmHg" showPressureLevel={false} />
                                                </div>
                                            </div>
                                            {parseFrameData(selectedHistory.measurement.frameData).values.length > 0 ? (
                                                <Heatmap values={parseFrameData(selectedHistory.measurement.frameData).values} size={320} />
                                            ) : (
                                                <div className="alert alert-warning text-center">
                                                    <i className="bi bi-exclamation-triangle me-2"></i>No heatmap data available
                                                </div>
                                            )}
                                            {parseLineChartData(selectedHistory.measurement.lineChartData).length > 0 ? (
                                                <LineChart labels={parseLineChartData(selectedHistory.measurement.lineChartData).map((_, i) => i)} dataPoints={parseLineChartData(selectedHistory.measurement.lineChartData)} />
                                            ) : (
                                                <div className="alert alert-warning text-center">
                                                    <i className="bi bi-exclamation-triangle me-2"></i>No line chart data available
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="alert alert-info text-center">
                                            <i className="bi bi-info-circle me-2"></i>No measurement data available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryPage;