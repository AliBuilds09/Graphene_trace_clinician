import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.js';
import { Table, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';

const Manage = () => {
    const [patients, setPatients] = useState([]);
    const [clinicians, setClinicians] = useState([]);
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedClinicians, setSelectedClinicians] = useState([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchPatients();
        fetchClinicians();
    }, []);

    useEffect(() => {
        setFilteredPatients(
            patients.filter(patient =>
                patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.patientId.toString().includes(searchTerm)
            )
        );
    }, [patients, searchTerm]);

    const fetchPatients = async () => {
        try {
            const response = await axios.get('http://localhost:5033/api/admin/patients', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPatients(response.data);
        } catch (err) {
            setError('Failed to load patients');
        }
    };

    const fetchClinicians = async () => {
        try {
            const response = await axios.get('http://localhost:5033/api/admin/clinicians', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClinicians(response.data);
        } catch (err) {
            setError('Failed to load clinicians');
        }
    };

    const toggleBlockPatient = async (patientId) => {
        try {
            await axios.post(`http://localhost:5033/api/admin/blockpatient/${patientId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPatients();
        } catch {
            setError('Failed to toggle block status');
        }
    };

    const deletePatient = async (patientId) => {
        if (!window.confirm('Are you sure you want to delete this patient?')) return;
        try {
            await axios.delete(`http://localhost:5033/api/admin/user/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchPatients();
        } catch (err) {
            setError('Failed to delete patient');
        }
    };

    const openAllocateModal = (patient) => {
        setSelectedPatient(patient);
        setSelectedClinicians([]);
        setShowAllocateModal(true);
    };

    const closeAllocateModal = () => {
        setShowAllocateModal(false);
        setSelectedPatient(null);
        setSelectedClinicians([]);
    };

    const toggleClinician = (clinicianId) => {
        setSelectedClinicians(prev =>
            prev.includes(clinicianId) ? prev.filter(id => id !== clinicianId) : [...prev, clinicianId]
        );
    };

    const allocateClinicians = async () => {
        if (!selectedPatient) {
            alert('No patient selected');
            return;
        }
        if (selectedClinicians.length === 0) {
            alert('Please select at least one clinician');
            return;
        }
        try {
            for (const clinicianId of selectedClinicians) {
                await axios.post('http://localhost:5033/api/admin/allocate', {
                    ClinicianID: clinicianId,
                    PatientID: selectedPatient.patientId || selectedPatient.PatientID,
                }, { headers: { Authorization: `Bearer ${token}` } });
            }
            closeAllocateModal();
            alert('Allocation successful');
            fetchPatients();
            fetchClinicians();
        } catch (err) {
            console.error('Allocation error:', err);
            setError('Failed to allocate patient. Check console for details.');
        }
    };

    return (
        <div className="d-flex vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa, #c9e6ff)' }}>
            <Sidebar role="admin" />
            <main className="flex-grow-1 p-4">
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-primary" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                        <i className="bi bi-people-fill me-3"></i>Manage Patients
                    </h1>
                    <p className="lead text-muted">Administer patient allocations and statuses efficiently.</p>
                </div>

                {error && <div className="alert alert-danger rounded-pill mb-4">{error}</div>}

                <div className="card shadow-lg p-4 mb-4" style={{ borderRadius: '15px', background: 'rgba(255, 255, 255, 0.9)' }}>
                    <h5 className="fw-bold text-primary mb-3">
                        <i className="bi bi-search me-2"></i>Search Patients
                    </h5>
                    <InputGroup className="mb-3">
                        <InputGroup.Text>
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="rounded-pill"
                        />
                    </InputGroup>
                </div>

                <div className="card shadow-lg" style={{ borderRadius: '15px', background: 'rgba(255, 255, 255, 0.9)' }}>
                    <div className="card-header bg-primary text-white" style={{ borderRadius: '15px 15px 0 0' }}>
                        <h5 className="mb-0">
                            <i className="bi bi-list-ul me-2"></i>Patient List
                        </h5>
                    </div>
                    <div className="card-body">
                        <Table striped bordered hover responsive className="mb-0">
                            <thead className="table-primary">
                                <tr>
                                    <th><i className="bi bi-hash me-1"></i>ID</th>
                                    <th><i className="bi bi-person me-1"></i>Name</th>
                                    <th><i className="bi bi-shield me-1"></i>Status</th>
                                    <th><i className="bi bi-toggle-on me-1"></i>Block</th>
                                    <th><i className="bi bi-trash me-1"></i>Delete</th>
                                    <th><i className="bi bi-link me-1"></i>Allocate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map(patient => (
                                    <tr key={patient.patientId || patient.PatientID}>
                                        <td>{patient.patientId || patient.PatientID}</td>
                                        <td>{patient.name}</td>
                                        <td>
                                            <span className={`badge ${patient.isActive !== false ? 'bg-success' : 'bg-danger'}`}>
                                                {patient.isActive !== false ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td>
                                            <Button
                                                variant={patient.isActive !== false ? "warning" : "success"}
                                                size="sm"
                                                className="rounded-pill"
                                                onClick={() => toggleBlockPatient(patient.patientId || patient.PatientID)}
                                            >
                                                {patient.isActive !== false ? 'Block' : 'Unblock'}
                                            </Button>
                                        </td>
                                        <td>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="rounded-pill"
                                                onClick={() => deletePatient(patient.patientId || patient.PatientID)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                        <td>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="rounded-pill"
                                                onClick={() => openAllocateModal(patient)}
                                            >
                                                <i className="bi bi-plus-circle"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>

                <Modal show={showAllocateModal} onHide={closeAllocateModal} centered size="lg">
                    <Modal.Header closeButton className="bg-primary text-white" style={{ borderRadius: '15px 15px 0 0' }}>
                        <Modal.Title>
                            <i className="bi bi-link-45deg me-2"></i>Allocate Clinician(s) to {selectedPatient?.name}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <h6 className="fw-bold mb-3">Select Clinicians:</h6>
                            {clinicians.map(clinician => (
                                <Form.Check
                                    key={clinician.clinicianId || clinician.ClinicianID}
                                    type="checkbox"
                                    label={
                                        <span>
                                            <i className="bi bi-person-badge me-2"></i>{clinician.name} ({clinician.hospitalName})
                                        </span>
                                    }
                                    checked={selectedClinicians.includes(clinician.clinicianId || clinician.ClinicianID)}
                                    onChange={() => toggleClinician(clinician.clinicianId || clinician.ClinicianID)}
                                    className="mb-2"
                                />
                            ))}
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" className="rounded-pill" onClick={closeAllocateModal}>
                            <i className="bi bi-x-circle me-1"></i>Cancel
                        </Button>
                        <Button variant="primary" className="rounded-pill" onClick={allocateClinicians}>
                            <i className="bi bi-check-circle me-1"></i>Allocate
                        </Button>
                    </Modal.Footer>
                </Modal>
            </main>
        </div>
    );
};

export default Manage;