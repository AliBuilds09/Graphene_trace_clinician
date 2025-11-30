// src/pages/ClinicianDashboard.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.js';
import KPICard from '../components/KPICards.js';
import Heatmap from '../components/Heatmap.js';
import LineChart from '../components/LineChart.js';
import HistoryCard from '../components/HistoryCard.js';
import axios from 'axios';

const ClinicianDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientData, setPatientData] = useState(null);
    const [patientHistory, setPatientHistory] = useState(null);
    const [patientLoading, setPatientLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [userName, setUserName] = useState(''); // Added for user name
    const [selectedHistory, setSelectedHistory] = useState(null); // Added for history modal
    const [showHistoryModal, setShowHistoryModal] = useState(false); // Added for history modal
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!userId || !token) {
            setError('User not authenticated. Please log in.');
            setLoading(false);
            return;
        }
        fetchClinicianData();
        fetchUserName(); // Added to fetch user name
    }, []);

    const fetchClinicianData = async () => {
        try {
            const response = await axios.get(`http://localhost:5033/api/clinician/dashboard/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
            console.log('Clinician data received:', response.data); // Debug log
            console.log('allocatedPatients in response:', response.data?.allocatedPatients); // Debug log
            console.log('Number of allocatedPatients:', response.data?.allocatedPatients?.length || 0); // Debug log
            setLoading(false);
        } catch (err) {
            console.error('Error fetching clinician data:', err); // Debug log
            setError('Failed to load clinician dashboard data');
            setLoading(false);
        }
    };

    const fetchUserName = async () => {
        try {
            const response = await axios.get(`http://localhost:5033/api/clinician/user/${userId}`, {  // Updated URL to match backend
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserName(response.data.name || 'Clinician');
        } catch (err) {
            console.error('Error fetching user name:', err);
            setUserName('Clinician'); // Default
        }
    };

    const handlePatientClick = async (patient) => {
        setSelectedPatient(patient);
        setActiveTab('dashboard');
        setPatientLoading(true);
        try {
            const [dashboardRes, historyRes] = await Promise.all([
                axios.get(`http://localhost:5033/api/clinician/patient-dashboard/${patient.patientID}`, { // Note: patientID is lowercase in response
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`http://localhost:5033/api/clinician/patient-history/${patient.patientID}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setPatientData(dashboardRes.data);
            setPatientHistory(historyRes.data);
            console.log('Patient data received:', dashboardRes.data, historyRes.data); // Debug log
        } catch (err) {
            console.error('Error fetching patient data:', err);
            setError('Failed to load patient data');
        } finally {
            setPatientLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedPatient(null);
        setPatientData(null);
        setPatientHistory(null);
        setPatientLoading(false);
        setSelectedHistory(null);
        setShowHistoryModal(false);
    };

    const openHistoryModal = (historyItem) => {
        setSelectedHistory(historyItem);
        setShowHistoryModal(true);
    };

    const closeHistoryModal = () => {
        setShowHistoryModal(false);
        setSelectedHistory(null);
    };

    // Added: Handler for deleting patient history
    const handleDelete = async (historyId) => {
        try {
            await axios.delete(`http://localhost:5033/api/clinician/patient-history/${historyId}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            // Update local state to remove the deleted item
            setPatientHistory(patientHistory.filter(h => h.historyID !== historyId));
            alert('History deleted successfully!');
        } catch (err) {
            console.error('Error deleting history:', err);
            alert('Failed to delete history.');
        }
    };

    // Added: Handler for downloading patient history (client-side)
    const handleDownload = (historyItem) => {
        const dataStr = JSON.stringify(historyItem, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `history_${historyItem.historyID}.json`);
        linkElement.click();
    };

    const parseHeatmapData = (heatmapDataJson) => {
        try {
            return JSON.parse(heatmapDataJson) || [];
        } catch (e) {
            console.error('Error parsing HeatmapData:', e);
            return [];
        }
    };

    const parseLineChartData = (lineChartDataJson) => {
        console.log('parseLineChartData: Input JSON:', lineChartDataJson); // Debug log
        try {
            const parsed = JSON.parse(lineChartDataJson) || [];
            console.log('parseLineChartData: Parsed result:', parsed); // Debug log
            return parsed;
        } catch (e) {
            console.error('Error parsing LineChartData:', e);
            return [];
        }
    };

    const getGreeting = (userName) => {
        const hour = new Date().getHours();
        let timeGreeting = '';
        if (hour >= 5 && hour < 12) timeGreeting = 'Good Morning';
        else if (hour >= 12 && hour < 14) timeGreeting = 'Good Noon';
        else if (hour >= 14 && hour < 18) timeGreeting = 'Good Afternoon';
        else timeGreeting = 'Good Evening';
        return `Hello! ${timeGreeting}, ${userName}!`;
    };

    if (loading) return <div className="text-center mt-5">Loading...</div>;
    if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

    const patients = data?.allocatedPatients || []; // Use camelCase
    const alerts = data?.alerts || []; // Use camelCase
    console.log('Alerts received:', alerts); // Debug log
    console.log('Patients received:', patients); // Debug log

    return (
        <div className="d-flex vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa, #c9e6ff)' }}>
            <Sidebar role="clinician" />
            <main className="flex-grow-1 p-4">
                {/* Greeting Message */}
                <div className="alert alert-info text-center mb-4" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {getGreeting(userName)}
                </div>

                <h2>Clinician Dashboard</h2>

                {/* Alerts Section - Styled like Patient Dashboard */}
                <div className="mb-4">
                    <h4>Alerts</h4>
                    <ul className="list-group">
                        {alerts.length > 0 ? (
                            alerts.map((alert, index) => (
                                <li className={`list-group-item ${alert.isCritical ? "list-group-item-danger" : ""}`} key={index}>
                                    <div dangerouslySetInnerHTML={{ __html: alert.message }}></div> {/* Note: message is lowercase */}
                                    <small className="text-muted">{new Date(alert.createdAt).toLocaleString()}</small>
                                </li>
                            ))
                        ) : (
                            <li className="list-group-item">No alerts</li>
                        )}
                    </ul>
                </div>

                {/* Allocated Patients Table - Always show, with fallback row if empty */}
                <h4>Allocated Patients</h4>
                {patients.length === 0 && (
                    <div className="alert alert-info">
                        <strong>Note:</strong> No patients are currently allocated to you. Allocations must be added by an admin or via the database. Check the console logs for details.
                    </div>
                )}
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>Patient ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Latest Peak Pressure</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.length > 0 ? (
                            patients.map(patient => (
                                <tr key={patient.patientID} onClick={() => handlePatientClick(patient)} style={{ cursor: 'pointer' }}>
                                    <td>{patient.patientID}</td><td>{patient.name}</td><td>{patient.age}</td><td>{patient.gender}</td><td>{patient.latestMeasurement ? patient.latestMeasurement.peakPressure.toFixed(2) : 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center">No patients allocated.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Patient Modal */}
                {selectedPatient && (
                    <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Patient: {selectedPatient.name}</h5> {/* Note: name is lowercase */}
                                    <button type="button" className="btn-close" onClick={closeModal}></button>
                                </div>
                                <div className="modal-body">
                                    {patientLoading ? (
                                        <div className="text-center">Loading patient data...</div>
                                    ) : (
                                        <>
                                            <ul className="nav nav-tabs">
                                                <li className="nav-item">
                                                    <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                                                </li>
                                                <li className="nav-item">
                                                    <button className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
                                                </li>
                                            </ul>
                                            <div className="tab-content mt-3">
                                                {activeTab === 'dashboard' && patientData && (
                                                    <div>
                                                        <div className="d-flex flex-wrap gap-3 mb-4">
                                                            <KPICard title="Peak Pressure" value={patientData.latestMeasurement?.peakPressure?.toFixed(2) || 0} unit="mmHg" /> {/* Note: latestMeasurement and peakPressure are lowercase */}
                                                            <KPICard title="Contact Area" value={patientData.latestMeasurement?.contactArea?.toFixed(2) || 0} unit="%" />
                                                            <KPICard title="Low Pressure" value={patientData.latestMeasurement?.lowPressure?.toFixed(2) || 0} unit="mmHg" />
                                                            <KPICard title="Average Pressure" value={patientData.latestMeasurement?.avgPressure?.toFixed(2) || 0} unit="mmHg" />
                                                        </div>
                                                        <h5>Live Heatmap</h5>
                                                        {patientData.csvData && patientData.csvData.length > 0 && patientData.csvData[0].frames && patientData.csvData[0].frames.length > 0 ? (
                                                            <Heatmap values={patientData.csvData[0].frames[0].values} size={320} />
                                                        ) : <p>No heatmap data available</p>}
                                                        <h5>Pressure Over Time</h5>
                                                        {patientData.csvData && patientData.csvData.length > 0 && patientData.csvData[0].frames ? (
                                                            <LineChart
                                                                labels={patientData.csvData[0].frames.map((_, i) => `Frame ${i + 1}`)}
                                                                dataPoints={patientData.csvData[0].frames.map(f => f.peakPressure)}
                                                            />
                                                        ) : <p>No line chart data available</p>}
                                                    </div>
                                                )}
                                                {activeTab === 'history' && patientHistory && (
                                                    <div>
                                                        <h5>Measurement History</h5>
                                                        {patientHistory.length > 0 ? (
                                                            patientHistory.map(item => (
                                                                <HistoryCard
                                                                    key={item.historyID}
                                                                    historyItem={item}
                                                                    onClick={() => openHistoryModal(item)}
                                                                    onDelete={handleDelete}  // Updated: Pass the delete handler
                                                                    onDownload={handleDownload}  // Updated: Pass the download handler
                                                                />
                                                            ))
                                                        ) : <p>No history available</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Modal */}
                {showHistoryModal && selectedHistory && (
                    <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{new Date(selectedHistory.snapshotAt).toLocaleString()}</h5>
                                    <button type="button" className="btn-close" onClick={closeHistoryModal}></button>
                                </div>
                                <div className="modal-body">
                                    {selectedHistory.measurement ? (
                                        <>
                                            <div className="d-flex flex-wrap gap-3 mb-3">
                                                <KPICard title="Peak Pressure" value={selectedHistory.measurement.peakPressure?.toFixed(2) || '0.00'} unit="mmHg" />
                                                <KPICard title="Contact Area" value={selectedHistory.measurement.contactArea?.toFixed(2) || '0.00'} unit="%" />
                                                <KPICard title="Average Pressure" value={selectedHistory.measurement.avgPressure?.toFixed(2) || '0.00'} unit="mmHg" />
                                            </div>
                                            {parseHeatmapData(selectedHistory.measurement.heatmapData).length > 0 ? (
                                                <Heatmap values={parseHeatmapData(selectedHistory.measurement.heatmapData)} size={320} />
                                            ) : (
                                                <p>No heatmap data available</p>
                                            )}
                                            {(() => {
                                                const lineData = parseLineChartData(selectedHistory.measurement.lineChartData);
                                                console.log('History Modal: Parsed line chart data:', lineData); // Debug log
                                                return lineData.length > 0 ? (
                                                    <LineChart labels={lineData.map((_, i) => `Frame ${i + 1}`)} dataPoints={lineData} />
                                                ) : (
                                                    <p>No line chart data available</p>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        <p>No measurement data available</p>
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

export default ClinicianDashboard;