import React, { useState, useEffect } from 'react';
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

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!token || !userId) {
            navigate('/login');
            return;
        }
        fetchDashboardData();
    }, [token, userId, navigate]);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(async () => {
                await performRefresh();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, data, currentCsvIndex]);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get(`http://localhost:5033/api/patient/dashboard/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            setData(response.data);
            setLoading(false);
            if (response.data.csvData && response.data.csvData.length > 0) {
                await saveHistory(response.data.csvData);
            }
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
    };

    const performRefresh = async () => {
        await fetchDashboardData();
        setLastRefreshTime(new Date());
        setCurrentFrameIndex(prev => {
            const maxFrames = data?.csvData?.[currentCsvIndex]?.frames?.length || 1;
            return (prev + 1) % maxFrames;
        });
        const currentTime = new Date();
        const peakPressure = data?.csvData?.[currentCsvIndex]?.frames?.[currentFrameIndex]?.peakPressure || 0;
        setLineChartLabels(prev => [...prev, currentTime]);
        setLineChartDataPoints(prev => [...prev, peakPressure]);
    };

    const calculateKPIs = (frames) => {
        if (!frames || frames.length === 0) return { peakPressure: 0, contactArea: 0, lowPressure: 0, avgPressure: 0 };
        const peakPressure = Math.max(...frames.map(f => f.peakPressure));
        const lowPressure = Math.min(...frames.map(f => f.lowPressure));
        const avgPressure = frames.reduce((sum, f) => sum + f.avgPressure, 0) / frames.length;
        const contactArea = frames.reduce((sum, f) => sum + f.contactArea, 0) / frames.length;
        return { peakPressure, contactArea, lowPressure, avgPressure };
    };

    const saveHistory = async (csvData) => {
        try {
            const currentCsv = csvData[currentCsvIndex];
            if (!currentCsv || !currentCsv.frames || currentCsv.frames.length === 0) return;

            const currentFrame = currentCsv.frames[currentFrameIndex];
            const historyData = {
                userId: parseInt(userId),
                data: {
                    csvData: [{
                        fileName: currentCsv.fileName,
                        frames: [currentFrame],
                        totalFrames: currentCsv.totalFrames,
                        totalTime: currentCsv.totalTime,
                        refreshMs: currentCsv.refreshMs
                    }]
                }
            };

            await axios.post('http://localhost:5033/api/patient/history', historyData, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
        } catch {
            // Silent fail to avoid user spam
        }
    };

    const handleNewMeasure = async () => {
        try {
            if (data && data.csvData && data.csvData.length > 0) {
                await saveHistory(data.csvData);
            }
            await performRefresh();
            alert('New measure saved and data refreshed!');
        } catch {
            alert('Failed to save new measure. Please try again.');
        }
    };

    const currentFrame = data?.csvData?.[currentCsvIndex]?.frames?.[currentFrameIndex];
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

    if (loading) return <div className="text-center mt-5">Loading dashboard data...</div>;
    if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

    return (
        <div className="d-flex">
            <Sidebar role="patient" />
            <main className="flex-grow-1 p-4">
                <div className="alert alert-info text-center mb-4" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {getGreeting(data.patient?.name || 'Patient')}
                </div>

                <h2>Patient Dashboard</h2>

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="form-check form-switch">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="autoRefreshToggle"
                            checked={autoRefresh}
                            onChange={() => setAutoRefresh(!autoRefresh)}
                        />
                        <label className="form-check-label" htmlFor="autoRefreshToggle">Auto Refresh</label>
                    </div>
                    <button className="btn btn-primary" onClick={handleNewMeasure} disabled={autoRefresh}>New Measure</button>
                </div>
                <p>Last Refresh: {lastRefreshTime?.toLocaleString()}</p>

                {data && (
                    <div className="row">
                        {/* Clinician Info */}
                        <div className="col-12 col-md-6 col-lg-4 mb-4">
                            <h5>Allocated Clinician</h5>
                            <table className="table table-striped table-bordered">
                                <thead>
                                    <tr><th>Name</th><th>Hospital</th><th>Contact</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{data.clinician?.name || "N/A"}</td>
                                        <td>{data.clinician?.hospitalName || "N/A"}</td>
                                        <td>{data.clinician?.phone || "N/A"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Alerts */}
                        <div className="col-12 col-md-6 col-lg-4 mb-4">
                            <h5>Alerts</h5>
                            <ul className="list-group">
                                {data.alerts && data.alerts.length > 0 ? data.alerts.map(alert => (
                                    <li className={`list-group-item ${alert.isCritical ? "list-group-item-danger" : ""}`} key={alert.alertID}>
                                        {alert.message} <br />
                                        <small className="text-muted">{new Date(alert.createdAt).toLocaleString()}</small>
                                    </li>
                                )) : <li className="list-group-item">No alerts</li>}
                            </ul>
                        </div>

                        {/* KPIs */}
                        <div className="col-12 col-md-6 col-lg-4 mb-4">
                            <h5>KPIs</h5>
                            <div className="d-flex flex-wrap gap-3">
                                <KPICard title="Peak Pressure" value={kpis.peakPressure} unit="mmHg" showPressureLevel={true} />
                                <KPICard title="Contact Area" value={kpis.contactArea} unit="%" showPressureLevel={false} />
                                <KPICard title="Average Pressure" value={kpis.avgPressure} unit="mmHg" showPressureLevel={false} />
                            </div>
                        </div>

                        {/* Heatmap with Legend */}
                        <div className="col-12 col-md-6 mb-4">
                            <h5>Live Heatmap</h5>
                            <div className="d-flex">
                                <div className="me-3">
                                    {currentFrame ? <Heatmap values={currentFrame.values} size={320} /> : <p>No heatmap available</p>}
                                </div>
                                <div>
                                    <h6>Heatmap Legend</h6>
                                    <p><strong>What it shows:</strong> This heatmap visualizes pressure distribution across the sensor grid with a colorful gradient for easy interpretation.</p>
                                    <ul>
                                        <li><span style={{ color: '#0000FF' }}>■</span> 0 mmHg (Very Low)</li>
                                        <li><span style={{ color: '#00ff00' }}>■</span> 1-250 mmHg (Low)</li>
                                        <li><span style={{ color: '#ffa500' }}>■</span> 251-420 mmHg (Medium)</li>
                                        <li><span style={{ color: '#dc3545' }}>■</span> 420+ mmHg (High)</li>
                                    </ul>
                                    <p><em>Space utilized for real-time pressure monitoring.</em></p>
                                </div>
                            </div>
                        </div>

                        {/* Line Chart */}
                        <div className="col-12 col-md-6 mb-4">
                            <h5>Pressure Over Time (Peak Pressure)</h5>
                            <LineChart labels={lineChartLabels} dataPoints={lineChartDataPoints} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PatientDashboard;