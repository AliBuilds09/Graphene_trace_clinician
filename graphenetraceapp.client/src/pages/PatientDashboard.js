import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar.js';
import Heatmap from '../components/Heatmap.js';
import LineChart from '../components/LineChart.js';
import KPICard from '../components/KPICards.js';

const PatientDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentCsvIndex, setCurrentCsvIndex] = useState(0);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const [lineChartLabels, setLineChartLabels] = useState([]);
    const [lineChartDataPoints, setLineChartDataPoints] = useState([]);
    const [lastSavedData, setLastSavedData] = useState(null);
    const [showTooltip, setShowTooltip] = useState(null); // For advanced tooltips

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    // Advanced: Memoized fetch function for performance
    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:5033/api/patient/dashboard/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            setData(response.data);
            setLoading(false);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                navigate('/login');
            } else {
                setError('Failed to load dashboard data. Please try again.');
            }
            setLoading(false);
        }
    }, [token, userId, navigate]);

    useEffect(() => {
        if (!token || !userId) {
            navigate('/login');
            return;
        }
        fetchDashboardData();
    }, [token, userId, navigate, fetchDashboardData]);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(async () => {
                await performRefresh();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, data, currentCsvIndex, currentFrameIndex]);

    const performRefresh = async () => {
        if (data && data.csvData && data.csvData.length > 0) {
            const currentCsv = data.csvData[currentCsvIndex];
            if (currentCsv && currentCsv.frames && currentCsv.frames.length > 0) {
                const nextFrameIndex = (currentFrameIndex + 1) % currentCsv.frames.length;
                setCurrentFrameIndex(nextFrameIndex);

                if (nextFrameIndex === 0) {
                    const nextCsvIndex = (currentCsvIndex + 1) % data.csvData.length;
                    setCurrentCsvIndex(nextCsvIndex);
                    console.log(`Switched to CSV ${nextCsvIndex + 1}`);
                }
            }
        }

        await saveHistoryIfChanged();
        setLastRefreshTime(new Date());

        const currentFrame = getCurrentFrame();
        if (currentFrame) {
            const peakPressure = currentFrame.peakPressure || 0;
            setLineChartLabels(prev => [...prev.slice(-19), new Date()]); // Keep last 20 points for simplicity
            setLineChartDataPoints(prev => [...prev.slice(-19), peakPressure]);
        }
    };

    const getCurrentFrame = () => {
        if (!data || !data.csvData || data.csvData.length === 0) return null;
        const currentCsv = data.csvData[currentCsvIndex];
        if (!currentCsv || !currentCsv.frames || currentCsv.frames.length === 0) return null;
        return currentCsv.frames[currentFrameIndex];
    };

    const saveHistoryIfChanged = async () => {
        const currentFrame = getCurrentFrame();
        if (!currentFrame) return;

        const currentData = {
            peakPressure: currentFrame.peakPressure,
            contactArea: currentFrame.contactArea,
            avgPressure: currentFrame.avgPressure,
            values: currentFrame.values
        };

        if (lastSavedData &&
            Math.abs(lastSavedData.peakPressure - currentData.peakPressure) < 1 &&
            Math.abs(lastSavedData.contactArea - currentData.contactArea) < 1 &&
            Math.abs(lastSavedData.avgPressure - currentData.avgPressure) < 1) {
            return;
        }

        try {
            const historyData = {
                userId: parseInt(userId),
                data: {
                    csvData: [{
                        fileName: data.csvData[currentCsvIndex].fileName,
                        frames: [currentFrame],
                        totalFrames: data.csvData[currentCsvIndex].totalFrames,
                        totalTime: data.csvData[currentCsvIndex].totalTime,
                        refreshMs: data.csvData[currentCsvIndex].refreshMs
                    }]
                }
            };

            await axios.post('http://localhost:5033/api/patient/history', historyData, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            setLastSavedData(currentData);
            console.log('History saved during auto-refresh');
        } catch (err) {
            console.error('Failed to save history during refresh:', err);
        }
    };

    const handleNewMeasure = async () => {
        if (autoRefresh) return;
        const currentFrame = getCurrentFrame();
        if (!currentFrame) return;

        try {
            const historyData = {
                userId: parseInt(userId),
                data: {
                    csvData: [{
                        fileName: data.csvData[currentCsvIndex].fileName,
                        frames: [currentFrame],
                        totalFrames: data.csvData[currentCsvIndex].totalFrames,
                        totalTime: data.csvData[currentCsvIndex].totalTime,
                        refreshMs: data.csvData[currentCsvIndex].refreshMs
                    }]
                }
            };

            await axios.post('http://localhost:5033/api/patient/history', historyData, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            setLastSavedData({
                peakPressure: currentFrame.peakPressure,
                contactArea: currentFrame.contactArea,
                avgPressure: currentFrame.avgPressure,
                values: currentFrame.values
            });
            alert('New measure saved!');
        } catch (err) {
            alert('Failed to save new measure.');
        }
    };

    const currentFrame = getCurrentFrame();
    const kpis = currentFrame ? {
        peakPressure: currentFrame.peakPressure,
        contactArea: currentFrame.contactArea,
        avgPressure: currentFrame.avgPressure
    } : { peakPressure: 0, contactArea: 0, avgPressure: 0 };

    const getGreeting = (userName) => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return `Good Morning, ${userName}!`;
        if (hour >= 12 && hour < 14) return `Good Noon, ${userName}!`;
        if (hour >= 14 && hour < 18) return `Good Afternoon, ${userName}!`;
        return `Good Evening, ${userName}!`;
    };

    // Advanced: Tooltip handler for informative popups
    const handleTooltip = (id) => setShowTooltip(showTooltip === id ? null : id);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div> Loading dashboard data...</div>;
    if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

    return (
        <div className="d-flex vh-100">
            <Sidebar role="patient" />
            <main className="flex-grow-1 p-3 overflow-auto">
                <div className="alert alert-info text-center mb-3" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {getGreeting(data.patient?.name || 'Patient')}
                </div>

                <h2 className="mb-3">Patient Dashboard</h2>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="autoRefreshToggle"
                            checked={autoRefresh}
                            onChange={() => setAutoRefresh(!autoRefresh)}
                        />
                        <label className="form-check-label" htmlFor="autoRefreshToggle">
                            Auto Refresh
                            <i className="bi bi-info-circle ms-1" onClick={() => handleTooltip('autoRefresh')} style={{ cursor: 'pointer' }}></i>
                        </label>
                        {showTooltip === 'autoRefresh' && <div className="tooltip show bs-tooltip-bottom" style={{ position: 'absolute', zIndex: 1000 }}>Automatically refreshes data every 3 seconds and cycles through frames.</div>}
                    </div>
                    <button className="btn btn-primary" onClick={handleNewMeasure} disabled={autoRefresh}>
                        New Measure
                        <i className="bi bi-save ms-1"></i>
                    </button>
                </div>
                <p className="text-muted small">Last Refresh: {lastRefreshTime?.toLocaleString()}</p>

                {data && (
                    <div className="row g-3">
                        {/* Clinician Info - Compact */}
                        <div className="col-12 col-md-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">Allocated Clinician</h5>
                                </div>
                                <div className="card-body">
                                    <table className="table table-sm table-striped">
                                        <tbody>
                                            <tr><th>Name</th><td>{data.clinician?.name || "N/A"}</td></tr>
                                            <tr><th>Hospital</th><td>{data.clinician?.hospitalName || "N/A"}</td></tr>
                                            <tr><th>Contact</th><td>{data.clinician?.phone || "N/A"}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Alerts - Compact */}
                        <div className="col-12 col-md-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">Alerts</h5>
                                </div>
                                <div className="card-body">
                                    <ul className="list-group list-group-flush">
                                        {data.alerts && data.alerts.length > 0 ? data.alerts.map(alert => (
                                            <li className={`list-group-item ${alert.isCritical ? "list-group-item-danger" : ""}`} key={alert.alertID}>
                                                {alert.message} <br />
                                                <small className="text-muted">{new Date(alert.createdAt).toLocaleString()}</small>
                                            </li>
                                        )) : <li className="list-group-item">No alerts</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* KPIs - Compact */}
                        <div className="col-12 col-md-4">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">Key Performance Indicators</h5>
                                </div>
                                <div className="card-body d-flex flex-wrap gap-2">
                                    <KPICard title="Peak Pressure" value={kpis.peakPressure} unit="mmHg" showPressureLevel={true} />
                                    <KPICard title="Contact Area" value={kpis.contactArea} unit="%" showPressureLevel={false} />
                                    <KPICard title="Average Pressure" value={kpis.avgPressure} unit="mmHg" showPressureLevel={false} />
                                </div>
                            </div>
                        </div>

                        {/* Heatmap - Optimized for space, no legend */}
                        <div className="col-12 col-md-6">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">Live Heatmap</h5>
                                </div>
                                <div className="card-body d-flex justify-content-center">
                                    {currentFrame ? <Heatmap values={currentFrame.values} size={320} /> : <p>No heatmap available</p>}
                                </div>
                            </div>
                        </div>

                        {/* Line Chart - Optimized for space */}
                        <div className="col-12 col-md-6">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="mb-0">Pressure Over Time (Peak Pressure)</h5>
                                </div>
                                <div className="card-body">
                                    <LineChart labels={lineChartLabels} dataPoints={lineChartDataPoints} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PatientDashboard;