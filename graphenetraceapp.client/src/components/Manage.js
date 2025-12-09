import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.js';
import { Table, Button, Modal, Form, InputGroup, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';

const Manage = () => {
    const [patients, setPatients] = useState([]);
    const [clinicians, setClinicians] = useState([]);
    const [allocations, setAllocations] = useState([]); // New state for allocations
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedClinicians, setSelectedClinicians] = useState([]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [blockedPatients, setBlockedPatients] = useState(new Set()); // Frontend-only state for blocked patients
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchPatients();
        fetchClinicians();
        fetchAllocations(); // Fetch allocations on load
    }, []);

    useEffect(() => {
        setFilteredPatients(
            patients.filter(patient =>
                patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (patient.patientId || patient.PatientID).toString().includes(searchTerm)
            )
        );
    }, [patients, searchTerm]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5033/api/admin/patients', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPatients(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load patients. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchClinicians = async () => {
        try {
            const response = await axios.get('http://localhost:5033/api/admin/clinicians', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClinicians(response.data);
        } catch (err) {
            setError('Failed to load clinicians.');
        }
    };

    const fetchAllocations = async () => {
        try {
            const response = await axios.get('http://localhost:5033/api/admin/allocations', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllocations(response.data);
        } catch (err) {
            setError('Failed to load allocations.');
        }
    };

    const deletePatient = async (patientId) => {
        if (!window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return;
        try {
            await axios.delete(`http://localhost:5033/api/admin/user/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchPatients();
            fetchAllocations(); // Refresh allocations after deletion
            setError('');
        } catch (err) {
            setError('Failed to delete patient. Please try again.');
        }
    };

    const openAllocateModal = (patient) => {
        const patientId = patient.patientId || patient.PatientID;
        const existingAllocation = allocations.find(a => a.patientId === patientId);
        if (existingAllocation) {
            // Patient is already allocated, show message
            window.alert(`Allocation is already done and allocated Clinician is ${existingAllocation.clinicianName}`);
            return;
        }
        // Not allocated, proceed to open modal
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
            fetchAllocations(); // Refresh allocations after allocation
            setError('');
        } catch (err) {
            console.error('Allocation error:', err);
            setError('Failed to allocate patient. Check console for details.');
        }
    };

    const toggleBlock = (patientId) => {
        setBlockedPatients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(patientId)) {
                newSet.delete(patientId);
            } else {
                newSet.add(patientId);
            }
            return newSet;
        });
    };

    return (
        <div className="d-flex vh-100" style={{ background: 'linear-gradient(135deg, #f5f7fa, #c9e6ff)', overflow: 'hidden' }}>
            <Sidebar role="admin" />
            <main className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold text-primary" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)', animation: 'fadeIn 1s ease-in' }}>
                        <i className="bi bi-people-fill me-3"></i>Manage Patients
                    </h1>
                    <p className="lead text-muted" style={{ animation: 'fadeIn 1.5s ease-in' }}>Administer patient allocations and statuses with ease and elegance.</p>
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
                        <i className="bi bi-search me-2"></i>Search Patients
                    </h5>
                    <InputGroup className="mb-3">
                        <InputGroup.Text style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none' }}>
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="rounded-pill shadow-sm"
                            style={{ border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        />
                    </InputGroup>
                </div>

                <div className="card shadow-lg" style={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                    <div className="card-header bg-gradient-primary text-white" style={{ borderRadius: '20px 20px 0 0', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                        <h5 className="mb-0">
                            <i className="bi bi-list-ul me-2"></i>Patient List
                        </h5>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" size="lg" />
                                <p className="mt-3">Loading patients...</p>
                            </div>
                        ) : (
                            <Table striped bordered hover responsive className="mb-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                                <thead className="table-primary" style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}>
                                    <tr>
                                        <th className="fw-bold"><i className="bi bi-hash me-1"></i>ID</th>
                                        <th className="fw-bold"><i className="bi bi-person me-1"></i>Name</th>
                                        <th className="fw-bold"><i className="bi bi-shield me-1"></i>Status</th>
                                        <th className="fw-bold"><i className="bi bi-toggle-on me-1"></i>Block</th>
                                        <th className="fw-bold"><i className="bi bi-trash me-1"></i>Delete</th>
                                        <th className="fw-bold"><i className="bi bi-link me-1"></i>Allocate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPatients.map(patient => {
                                        const patientId = patient.patientId || patient.PatientID;
                                        const isBlocked = blockedPatients.has(patientId);
                                        return (
                                            <tr key={patientId} style={{ transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}>
                                                <td className="fw-semibold">{patientId}</td>
                                                <td className="fw-semibold">{patient.name}</td>
                                                <td>
                                                    <Badge bg={isBlocked ? 'danger' : 'success'} className="rounded-pill px-3 py-2">
                                                        {isBlocked ? 'Inactive' : 'Active'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button
                                                        variant={isBlocked ? "success" : "warning"}
                                                        size="sm"
                                                        className="rounded-pill shadow-sm"
                                                        onClick={() => toggleBlock(patientId)}
                                                        style={{ transition: 'all 0.3s ease', border: 'none' }}
                                                    >
                                                        <i className={`bi ${isBlocked ? 'bi-unlock' : 'bi-lock'} me-1`}></i>
                                                        {isBlocked ? 'Unblock' : 'Block'}
                                                    </Button>
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="rounded-pill shadow-sm"
                                                        onClick={() => deletePatient(patientId)}
                                                        style={{ transition: 'all 0.3s ease', border: 'none' }}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </Button>
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="rounded-pill shadow-sm"
                                                        disabled={isBlocked}
                                                        onClick={() => openAllocateModal(patient)}
                                                        style={{ transition: 'all 0.3s ease', border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                                                    >
                                                        <i className="bi bi-plus-circle"></i>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                    </div>
                </div>

                <Modal show={showAllocateModal} onHide={closeAllocateModal} centered size="lg" style={{ borderRadius: '20px' }}>
                    <Modal.Header closeButton className="bg-gradient-primary text-white" style={{ borderRadius: '20px 20px 0 0', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                        <Modal.Title>
                            <i className="bi bi-link-45deg me-2"></i>Allocate Clinician(s) to {selectedPatient?.name}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <Form>
                            <h6 className="fw-bold mb-3 text-primary">
                                <i className="bi bi-person-badge me-2"></i>Select Clinicians:
                            </h6>
                            <div className="row">
                                {clinicians.map(clinician => (
                                    <div key={clinician.clinicianId || clinician.ClinicianID} className="col-md-6 mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label={
                                                <span className="fw-semibold">
                                                    <i className="bi bi-person-circle me-2"></i>{clinician.name} ({clinician.hospitalName})
                                                </span>
                                            }
                                            checked={selectedClinicians.includes(clinician.clinicianId || clinician.ClinicianID)}
                                            onChange={() => toggleClinician(clinician.clinicianId || clinician.ClinicianID)}
                                            className="p-3 rounded shadow-sm"
                                            style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #dee2e6' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="bg-light" style={{ borderRadius: '0 0 20px 20px' }}>
                        <Button variant="secondary" className="rounded-pill px-4" onClick={closeAllocateModal} style={{ transition: 'all 0.3s ease' }}>
                            <i className="bi bi-x-circle me-1"></i>Cancel
                        </Button>
                        <Button variant="primary" className="rounded-pill px-4" onClick={allocateClinicians} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', transition: 'all 0.3s ease' }}>
                            <i className="bi bi-check-circle me-1"></i>Allocate
                        </Button>
                    </Modal.Footer>
                </Modal>
            </main>
        </div>
    );
};

export default Manage;