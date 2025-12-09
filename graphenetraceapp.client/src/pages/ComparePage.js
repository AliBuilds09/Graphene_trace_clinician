// src/pages/ClinicianComparePage.js

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.js';
import Heatmap from '../components/Heatmap.js';
import jsPDF from 'jspdf';
import axios from 'axios';

const ClinicianComparePage = () => {
    const [allocatedPatients, setAllocatedPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [snapshots, setSnapshots] = useState([]);
    const [firstSnapshotId, setFirstSnapshotId] = useState('');
    const [secondSnapshotId, setSecondSnapshotId] = useState('');
    const [comparisonResult, setComparisonResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [comparing, setComparing] = useState(false);

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchAllocatedPatients();
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            fetchSnapshots();
        } else {
            setSnapshots([]);
            setFirstSnapshotId('');
            setSecondSnapshotId('');
            setComparisonResult(null);
        }
    }, [selectedPatientId]);

    const fetchAllocatedPatients = async () => {
        try {
            const response = await axios.get(`http://localhost:5033/api/clinician/allocated-patients/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllocatedPatients(response.data);
        } catch (err) {
            setError('Failed to load allocated patients. Please try again.');
        }
    };

    const fetchSnapshots = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5033/api/clinician/patient-history/${selectedPatientId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSnapshots(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load snapshots. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = async () => {
        if (!firstSnapshotId || !secondSnapshotId) {
            setError('Please select both snapshots to compare.');
            return;
        }
        if (firstSnapshotId === secondSnapshotId) {
            setError('Please select two different snapshots.');
            return;
        }

        setComparing(true);
        setError('');

        // Simulate a brief loading for comparison
        setTimeout(() => {
            const snap1 = snapshots.find(s => s.historyID == firstSnapshotId);
            const snap2 = snapshots.find(s => s.historyID == secondSnapshotId);

            if (!snap1 || !snap2) {
                setError('Selected snapshots not found.');
                setComparing(false);
                return;
            }

            const measurement1 = snap1.measurement;
            const measurement2 = snap2.measurement;

            const difference = {
                peakPressure: measurement2.peakPressure - measurement1.peakPressure,
                contactArea: measurement2.contactArea - measurement1.contactArea,
                lowPressure: measurement2.lowPressure - measurement1.lowPressure,
                avgPressure: measurement2.avgPressure - measurement1.avgPressure,
            };

            setComparisonResult({ snap1, snap2, difference });
            setComparing(false);
        }, 1000); // Brief delay for UX
    };

    const downloadPDF = () => {
        if (!comparisonResult) return;

        const { snap1, snap2, difference } = comparisonResult;
        const patientName = allocatedPatients.find(p => p.patientID == selectedPatientId)?.name || 'Patient';
        const currentDate = new Date().toISOString().slice(0, 10);

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(`${patientName}`, 14, 22);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Comparison Report - ${currentDate}`, 14, 32);
        doc.text('Comparing snapshots:', 14, 42);
        doc.text(`- ${new Date(snap1.snapshotAt).toLocaleString()}`, 14, 50);
        doc.text(`- ${new Date(snap2.snapshotAt).toLocaleString()}`, 14, 58);

        const startY = 70;
        doc.setFontSize(12);
        doc.text('KPI', 14, startY);
        doc.text('Snapshot 1', 70, startY);
        doc.text('Snapshot 2', 120, startY);
        doc.text('Difference', 170, startY);

        const kpis = ['peakPressure', 'contactArea', 'lowPressure', 'avgPressure'];
        const labels = {
            peakPressure: 'Peak Pressure (mmHg)',
            contactArea: 'Contact Area (%)',
            lowPressure: 'Low Pressure (mmHg)',
            avgPressure: 'Average Pressure (mmHg)',
        };

        kpis.forEach((key, i) => {
            const y = startY + 10 + i * 10;
            doc.text(labels[key], 14, y);
            doc.text(String(snap1.measurement[key]), 70, y);
            doc.text(String(snap2.measurement[key]), 120, y);
            const diffStr = difference[key] > 0 ? `+${difference[key]}` : String(difference[key]);
            doc.text(diffStr, 170, y);
        });

        // Add heatmap descriptions (placeholders; enhance with images if needed)
        doc.text('Heatmap 1: [Placeholder - Add image here]', 14, startY + 60);
        doc.text('Heatmap 2: [Placeholder - Add image here]', 14, startY + 70);

        const filename = `${patientName}_${currentDate}.pdf`;
        doc.save(filename);
    };

    // Helper function to parse heatmap data (assuming it's a JSON string of values array)
    const parseHeatmapData = (heatmapDataJson) => {
        try {
            return JSON.parse(heatmapDataJson) || [];
        } catch (e) {
            console.error('Error parsing heatmap data:', e);
            return [];
        }
    };

    return (
        <div className="d-flex vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa, #c9e6ff)', overflow: 'hidden' }}>
            <Sidebar role="clinician" />
            <main className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-primary" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)', animation: 'fadeIn 1s ease-in' }}>
                        <i className="bi bi-bar-chart-line me-3"></i>Patient Data Comparison
                    </h1>
                    <p className="lead text-muted" style={{ animation: 'fadeIn 1.5s ease-in' }}>Analyze and compare pressure snapshots for better insights.</p>
                </div>

                {error && (
                    <div className="alert alert-danger text-center shadow-lg mb-4" style={{ borderRadius: '20px', maxWidth: '600px', margin: '0 auto' }}>
                        <i className="bi bi-exclamation-triangle-fill fs-1 mb-3"></i>
                        <h5>Oops!</h5>
                        <p>{error}</p>
                    </div>
                )}

                <div className="card shadow-lg p-4 mb-4" style={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                    <h5 className="fw-bold text-primary mb-3">
                        <i className="bi bi-person-lines-fill me-2"></i>Select Patient & Snapshots
                    </h5>
                    <div className="row g-3">
                        <div className="col-md-12 mb-3">
                            <label htmlFor="patient-select" className="form-label fw-semibold">
                                <i className="bi bi-person me-2"></i>Choose Patient
                            </label>
                            <select
                                id="patient-select"
                                className="form-select rounded-pill shadow-sm"
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                disabled={loading}
                                style={{ transition: 'box-shadow 0.3s ease' }}
                            >
                                <option value="">-- Select Patient --</option>
                                {allocatedPatients.map(patient => (
                                    <option key={patient.patientID} value={patient.patientID}>{patient.name}</option>
                                ))}
                            </select>
                        </div>

                        {loading && (
                            <div className="col-12 text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading snapshots...</p>
                            </div>
                        )}

                        {snapshots.length > 0 && (
                            <>
                                <div className="col-md-6">
                                    <label htmlFor="first-snapshot" className="form-label fw-semibold">
                                        <i className="bi bi-calendar-event me-2"></i>First Snapshot
                                    </label>
                                    <select
                                        id="first-snapshot"
                                        className="form-select rounded-pill shadow-sm"
                                        value={firstSnapshotId}
                                        onChange={(e) => setFirstSnapshotId(e.target.value)}
                                        style={{ transition: 'box-shadow 0.3s ease' }}
                                    >
                                        <option value="">-- Select First Snapshot --</option>
                                        {snapshots.map(s => (
                                            <option key={s.historyID} value={s.historyID}>{new Date(s.snapshotAt).toLocaleString()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label htmlFor="second-snapshot" className="form-label fw-semibold">
                                        <i className="bi bi-calendar-check me-2"></i>Second Snapshot
                                    </label>
                                    <select
                                        id="second-snapshot"
                                        className="form-select rounded-pill shadow-sm"
                                        value={secondSnapshotId}
                                        onChange={(e) => setSecondSnapshotId(e.target.value)}
                                        style={{ transition: 'box-shadow 0.3s ease' }}
                                    >
                                        <option value="">-- Select Second Snapshot --</option>
                                        {snapshots.map(s => (
                                            <option key={s.historyID} value={s.historyID}>{new Date(s.snapshotAt).toLocaleString()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-12 text-center mt-3">
                                    <button
                                        className="btn btn-primary rounded-pill px-5 py-2 shadow-sm"
                                        onClick={handleCompare}
                                        disabled={comparing}
                                        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', transition: 'all 0.3s ease' }}
                                    >
                                        {comparing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Comparing...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-arrow-left-right me-2"></i>Compare Snapshots
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {comparisonResult && (
                    <div className="card shadow-lg p-4" style={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', animation: 'fadeIn 1s ease-in' }}>
                        <h3 className="fw-bold text-primary mb-4 text-center">
                            <i className="bi bi-graph-up me-2"></i>Comparison Results
                        </h3>

                        <div className="table-responsive mb-4">
                            <table className="table table-striped table-hover text-center shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                                <thead className="table-dark">
                                    <tr>
                                        <th className="fw-bold">KPI</th>
                                        <th className="fw-bold">{new Date(comparisonResult.snap1.snapshotAt).toLocaleString()}</th>
                                        <th className="fw-bold">{new Date(comparisonResult.snap2.snapshotAt).toLocaleString()}</th>
                                        <th className="fw-bold">Difference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {['peakPressure', 'contactArea', 'lowPressure', 'avgPressure'].map(kpi => (
                                        <tr key={kpi}>
                                            <td className="fw-semibold">{kpi.charAt(0).toUpperCase() + kpi.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                                            <td>{comparisonResult.snap1.measurement[kpi]}</td>
                                            <td>{comparisonResult.snap2.measurement[kpi]}</td>
                                            <td className={comparisonResult.difference[kpi] > 0 ? 'text-success' : comparisonResult.difference[kpi] < 0 ? 'text-danger' : 'text-muted'}>
                                                {comparisonResult.difference[kpi] > 0 ? '+' : ''}{comparisonResult.difference[kpi]}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <div className="card shadow-sm" style={{ borderRadius: '15px' }}>
                                    <div className="card-header bg-primary text-white text-center fw-bold" style={{ borderRadius: '15px 15px 0 0' }}>
                                        <i className="bi bi-thermometer-half me-2"></i>Heatmap 1
                                    </div>
                                    <div className="card-body text-center">
                                        {comparisonResult.snap1.measurement.heatmapData ? (
                                            <Heatmap values={parseHeatmapData(comparisonResult.snap1.measurement.heatmapData)} size={320} />
                                        ) : (
                                            <div className="alert alert-warning rounded-pill">
                                                <i className="bi bi-exclamation-triangle me-2"></i>No heatmap data available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card shadow-sm" style={{ borderRadius: '15px' }}>
                                    <div className="card-header bg-success text-white text-center fw-bold" style={{ borderRadius: '15px 15px 0 0' }}>
                                        <i className="bi bi-thermometer-high me-2"></i>Heatmap 2
                                    </div>
                                    <div className="card-body text-center">
                                        {comparisonResult.snap2.measurement.heatmapData ? (
                                            <Heatmap values={parseHeatmapData(comparisonResult.snap2.measurement.heatmapData)} size={320} />
                                        ) : (
                                            <div className="alert alert-warning rounded-pill">
                                                <i className="bi bi-exclamation-triangle me-2"></i>No heatmap data available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                className="btn btn-success rounded-pill px-5 py-2 shadow-sm"
                                onClick={downloadPDF}
                                style={{ background: 'linear-gradient(135deg, #28a745, #20c997)', border: 'none', transition: 'all 0.3s ease' }}
                            >
                                <i className="bi bi-download me-2"></i>Download Report as PDF
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClinicianComparePage;