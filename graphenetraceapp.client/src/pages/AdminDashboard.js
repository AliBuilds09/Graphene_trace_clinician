// src/pages/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.js';
import { Table, Button, Modal, Form, Tab, Tabs } from 'react-bootstrap'; // Added Tab, Tabs for history tab
import axios from 'axios';
import HistoryCard from '../components/HistoryCard.js'; // Added for history display
import KPICard from '../components/KPICards.js'; // Added for modal KPIs
import Heatmap from '../components/Heatmap.js'; // Added for modal heatmap
import LineChart from '../components/LineChart.js'; // Added for modal line chart
import jsPDF from 'jspdf'; // Added for PDF generation

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [patients, setPatients] = useState([]);
    const [clinicians, setClinicians] = useState([]);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '' });
    const [activeTab, setActiveTab] = useState('overview'); // Added for tab management
    const [selectedPatientId, setSelectedPatientId] = useState(''); // Added for history patient selection
    const [history, setHistory] = useState([]); // Added for history data
    const [selectedHistory, setSelectedHistory] = useState(null); // Added for modal
    const [showHistoryModal, setShowHistoryModal] = useState(false); // Added for modal
    const [historyLoading, setHistoryLoading] = useState(false); // Added for loading
    const [userName, setUserName] = useState('Admin'); // Static value to avoid API call
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchData();
        // Removed fetchUserName to avoid 404 error
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, patientsRes, cliniciansRes] = await Promise.all([
                axios.get('http://localhost:5033/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5033/api/admin/patients', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5033/api/admin/clinicians', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setUsers(usersRes.data);
            setPatients(patientsRes.data);
            setClinicians(cliniciansRes.data);
            setError('');
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        }
    };

    const handlePatientSelect = async (patientId) => {
        setSelectedPatientId(patientId);
        if (patientId) {
            setHistoryLoading(true);
            try {
                const response = await axios.get(`http://localhost:5033/api/admin/history/${patientId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setHistory(response.data);
                setError('');
            } catch (err) {
                setError('Failed to load history');
                console.error(err);
            } finally {
                setHistoryLoading(false);
            }
        } else {
            setHistory([]);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5033/api/admin/user/${editingUser.userId}`, editForm, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShowEditModal(false);
            fetchData();
        } catch (err) {
            setError('Failed to update user');
            console.error(err);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`http://localhost:5033/api/admin/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchData();
        } catch (err) {
            setError('Failed to delete user');
            console.error(err);
        }
    };

    const handleDeleteHistory = async (historyId) => {
        if (!window.confirm('Are you sure you want to delete this history item?')) return;
        try {
            await axios.delete(`http://localhost:5033/api/admin/history/${historyId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Refresh history after deletion
            handlePatientSelect(selectedPatientId);
        } catch (err) {
            setError('Failed to delete history');
            console.error(err);
        }
    };

    const openHistoryModal = (historyItem) => {
        setSelectedHistory(historyItem);
        setShowHistoryModal(true);
    };

    const closeHistoryModal = () => {
        setShowHistoryModal(false);
        setSelectedHistory(null);
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
        try {
            return JSON.parse(lineChartDataJson) || [];
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

    return (
        <div className="d-flex">
            <Sidebar role="admin" />
            <main className="flex-grow-1 p-4">
                {/* Greeting Message */}
                <div className="alert alert-info text-center mb-4" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {getGreeting(userName)}
                </div>

                <h2>Admin Dashboard</h2>

                {error && <div className="alert alert-danger mb-3">{error}</div>}

                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                    <Tab eventKey="overview" title="Overview">
                        {/* All Users Table */}
                        <h3>All Users</h3>
                        <Table striped bordered hover responsive>
                            <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.userId}>
                                        <td>{user.userId}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.phone}</td>
                                        <td>{user.role}</td>
                                        <td>
                                            <Button variant="warning" size="sm" onClick={() => handleEdit(user)}>Edit</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {/* Patients Table */}
                        <h3>Patients</h3>
                        <Table striped bordered hover responsive>
                            <thead><tr><th>Patient ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Age</th><th>Gender</th></tr></thead>
                            <tbody>
                                {patients.map(patient => (
                                    <tr key={patient.patientId}>
                                        <td>{patient.patientId}</td>
                                        <td>{patient.name || 'N/A'}</td>
                                        <td>{patient.email || 'N/A'}</td>
                                        <td>{patient.phone || 'N/A'}</td>
                                        <td>{patient.age}</td>
                                        <td>{patient.gender}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {/* Clinicians Table */}
                        <h3>Clinicians</h3>
                        <Table striped bordered hover responsive>
                            <thead><tr><th>Clinician ID</th><th>Name</th><th>Email</th><th>Phone</th><th>License Number</th><th>Hospital Name</th><th>Specialization</th></tr></thead>
                            <tbody>
                                {clinicians.map(clinician => (
                                    <tr key={clinician.clinicianId}>
                                        <td>{clinician.clinicianId}</td>
                                        <td>{clinician.name || 'N/A'}</td>
                                        <td>{clinician.email || 'N/A'}</td>
                                        <td>{clinician.phone || 'N/A'}</td>
                                        <td>{clinician.licenseNumber}</td>
                                        <td>{clinician.hospitalName}</td>
                                        <td>{clinician.specialization}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Tab>

                    <Tab eventKey="history" title="History">
                        <h3>Patient History</h3>
                        <div className="mb-3">
                            <label htmlFor="patient-select" className="form-label">Select Patient</label>
                            <select
                                id="patient-select"
                                className="form-select"
                                value={selectedPatientId}
                                onChange={(e) => handlePatientSelect(e.target.value)}
                            >
                                <option value="">-- Select Patient --</option>
                                {patients.map(patient => (
                                    <option key={patient.patientId} value={patient.patientId}>{patient.name || 'N/A'} (ID: {patient.patientId})</option>
                                ))}
                            </select>
                        </div>

                        {historyLoading && <p>Loading history...</p>}

                        {selectedPatientId && !historyLoading && (
                            <div className="row">
                                {history.length > 0 ? (
                                    history.map(h => (
                                        <div key={h.historyID} className="col-md-4 mb-4">
                                            <HistoryCard
                                                historyItem={h}
                                                onClick={() => openHistoryModal(h)}
                                                onSave={() => alert('Save not implemented for admin')}
                                                onDelete={() => handleDeleteHistory(h.historyID)} // Now calls delete function
                                                onDownload={() => {
                                                    const doc = new jsPDF();

                                                    // Title
                                                    doc.setFontSize(20);
                                                    doc.text('History Snapshot', 20, 30);

                                                    // Timestamp
                                                    doc.setFontSize(12);
                                                    doc.text(`Timestamp: ${new Date(h.snapshotAt).toLocaleString()}`, 20, 50);

                                                    // KPIs
                                                    if (h.measurement) {
                                                        doc.text(`Peak Pressure: ${h.measurement.peakPressure?.toFixed(2) || '0.00'} mmHg`, 20, 70);
                                                        doc.text(`Contact Area: ${h.measurement.contactArea?.toFixed(2) || '0.00'} %`, 20, 80);
                                                        doc.text(`Average Pressure: ${h.measurement.avgPressure?.toFixed(2) || '0.00'} mmHg`, 20, 90);
                                                    }

                                                    // Note for visuals
                                                    doc.text('Heatmap and Line Chart: Visual data not included in PDF. View in the app for details.', 20, 110);

                                                    // Save the PDF
                                                    doc.save(`history_${h.historyID}.pdf`);
                                                }}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p>No history available for this patient.</p>
                                )}
                            </div>
                        )}
                    </Tab>
                </Tabs>

                {/* Edit Modal */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit User</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleEditSubmit}>
                        <Modal.Body>
                            <Form.Group className="mb-3" controlId="formName">
                                <Form.Label>Name</Form.Label>
                                <Form.Control type="text" name="name" value={editForm.name} onChange={handleEditChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" name="email" value={editForm.email} onChange={handleEditChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formPhone">
                                <Form.Label>Phone</Form.Label>
                                <Form.Control type="text" name="phone" value={editForm.phone} onChange={handleEditChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formRole">
                                <Form.Label>Role</Form.Label>
                                <Form.Select name="role" value={editForm.role} onChange={handleEditChange} disabled> {/* Disabled to prevent role changes */}
                                    <option value="patient">Patient</option>
                                    <option value="clinician">Clinician</option>
                                    <option value="admin">Admin</option>
                                </Form.Select>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                            <Button variant="primary" type="submit">Save</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>

                {/* History Modal */}
                {showHistoryModal && selectedHistory && (
                    <Modal show={showHistoryModal} onHide={closeHistoryModal} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>{new Date(selectedHistory.snapshotAt).toLocaleString()}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
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
                                    {parseLineChartData(selectedHistory.measurement.lineChartData).length > 0 ? (
                                        <LineChart labels={parseLineChartData(selectedHistory.measurement.lineChartData).map((_, i) => i)} dataPoints={parseLineChartData(selectedHistory.measurement.lineChartData)} />
                                    ) : (
                                        <p>No line chart data available</p>
                                    )}
                                </>
                            ) : (
                                <p>No measurement data available</p>
                            )}
                        </Modal.Body>
                    </Modal>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;