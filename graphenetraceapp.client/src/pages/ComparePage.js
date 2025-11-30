// src/pages/ComparePage.js

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
            setError('Failed to load allocated patients');
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
            setError('Failed to load snapshots');
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = () => {
        if (!firstSnapshotId || !secondSnapshotId) {
            alert('Please select both snapshots to compare.');
            return;
        }
        if (firstSnapshotId === secondSnapshotId) {
            alert('Please select two different snapshots.');
            return;
        }

        const snap1 = snapshots.find(s => s.historyID == firstSnapshotId);
        const snap2 = snapshots.find(s => s.historyID == secondSnapshotId);

        if (!snap1 || !snap2) return;

        const measurement1 = snap1.measurement;
        const measurement2 = snap2.measurement;

        const difference = {
            peakPressure: measurement2.peakPressure - measurement1.peakPressure,
            contactArea: measurement2.contactArea - measurement1.contactArea,
            lowPressure: measurement2.lowPressure - measurement1.lowPressure,
            avgPressure: measurement2.avgPressure - measurement1.avgPressure,
        };

        setComparisonResult({ snap1, snap2, difference });
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
        doc.text(`Comparing snapshots:`, 14, 42);
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

    return (
        <div className="d-flex">
            <Sidebar role="clinician" />
            <main className="flex-grow-1 p-4">
                <h2>Compare Patient Data</h2>
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-3">
                    <label htmlFor="patient-select" className="form-label">Choose Patient</label>
                    <select
                        id="patient-select"
                        className="form-select"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        disabled={loading}
                    >
                        <option value="">-- Select Patient --</option>
                        {allocatedPatients.map(patient => (
                            <option key={patient.patientID} value={patient.patientID}>{patient.name}</option>
                        ))}
                    </select>
                </div>

                {loading && <p>Loading snapshots...</p>}

                {snapshots.length > 0 && (
                    <>
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label htmlFor="first-snapshot" className="form-label">First Snapshot</label>
                                <select
                                    id="first-snapshot"
                                    className="form-select"
                                    value={firstSnapshotId}
                                    onChange={(e) => setFirstSnapshotId(e.target.value)}
                                >
                                    <option value="">-- Select First Snapshot --</option>
                                    {snapshots.map(s => (
                                        <option key={s.historyID} value={s.historyID}>{new Date(s.snapshotAt).toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="second-snapshot" className="form-label">Second Snapshot</label>
                                <select
                                    id="second-snapshot"
                                    className="form-select"
                                    value={secondSnapshotId}
                                    onChange={(e) => setSecondSnapshotId(e.target.value)}
                                >
                                    <option value="">-- Select Second Snapshot --</option>
                                    {snapshots.map(s => (
                                        <option key={s.historyID} value={s.historyID}>{new Date(s.snapshotAt).toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary mb-4" onClick={handleCompare}>Compare</button>
                    </>
                )}

                {comparisonResult && (
                    <div>
                        <h3>Comparison Result</h3>
                        <table className="table table-bordered text-center">
                            <thead>
                                <tr>
                                    <th>KPI</th>
                                    <th>{new Date(comparisonResult.snap1.snapshotAt).toLocaleString()}</th>
                                    <th>{new Date(comparisonResult.snap2.snapshotAt).toLocaleString()}</th>
                                    <th>Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['peakPressure', 'contactArea', 'lowPressure', 'avgPressure'].map(kpi => (
                                    <tr key={kpi}>
                                        <td>{kpi.charAt(0).toUpperCase() + kpi.slice(1).replace(/([A-Z])/g, ' $1')}</td>
                                        <td>{comparisonResult.snap1.measurement[kpi]}</td>
                                        <td>{comparisonResult.snap2.measurement[kpi]}</td>
                                        <td>{comparisonResult.difference[kpi] > 0 ? '+' : ''}{comparisonResult.difference[kpi]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="row">
                            <div className="col-md-6">
                                <h5>Heatmap 1</h5>
                                {comparisonResult.snap1.measurement.heatmapData ? (
                                    <Heatmap values={JSON.parse(comparisonResult.snap1.measurement.heatmapData)} size={320} />
                                ) : <p>No heatmap data</p>}
                            </div>
                            <div className="col-md-6">
                                <h5>Heatmap 2</h5>
                                {comparisonResult.snap2.measurement.heatmapData ? (
                                    <Heatmap values={JSON.parse(comparisonResult.snap2.measurement.heatmapData)} size={320} />
                                ) : <p>No heatmap data</p>}
                            </div>
                        </div>
                        <button className="btn btn-success" onClick={downloadPDF}>Download as PDF</button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClinicianComparePage;
