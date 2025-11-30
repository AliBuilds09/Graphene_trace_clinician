// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public pages
import Login from './components/Login';
import Register from './components/Register';

// Patient pages
import PatientDashboard from './pages/PatientDashboard';
import PatientHistory from './pages/HistoryPage';
import PatientMessage from './components/MessageThread';
import PatientSetting from './pages/SettingsPage';

// Clinician pages
import ClinicianDashboard from './pages/ClinicianDashboard';
import ClinicianCompare from './pages/ComparePage';
import ClinicianMessage from './components/MessageThread';
import ClinicianSetting from './pages/SettingsPage';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminHistory from './pages/HistoryPage';
import AdminManage from './components/Manage';

// PrivateRoute component to guard protected pages based on user role and token
const PrivateRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Redirect to login if not authenticated
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to login if role is not authorized for this route
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Default redirection */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Patient protected routes */}
                <Route
                    path="/patient-dashboard/*"
                    element={
                        <PrivateRoute allowedRoles={['patient']}>
                            <PatientDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/patient-history"
                    element={
                        <PrivateRoute allowedRoles={['patient']}>
                            <PatientHistory />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/patient-message"
                    element={
                        <PrivateRoute allowedRoles={['patient']}>
                            <PatientMessage userRole="patient" />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/patient-settings"
                    element={
                        <PrivateRoute allowedRoles={['patient']}>
                            <PatientSetting />
                        </PrivateRoute>
                    }
                />

                {/* Clinician protected routes */}
                <Route
                    path="/clinician-dashboard/*"
                    element={
                        <PrivateRoute allowedRoles={['clinician']}>
                            <ClinicianDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/clinician-compare"
                    element={
                        <PrivateRoute allowedRoles={['clinician']}>
                            <ClinicianCompare />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/clinician-message"
                    element={
                        <PrivateRoute allowedRoles={['clinician']}>
                            <ClinicianMessage userRole="clinician" />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/clinician-settings"
                    element={
                        <PrivateRoute allowedRoles={['clinician']}>
                            <ClinicianSetting />
                        </PrivateRoute>
                    }
                />

                {/* Admin protected routes */}
                <Route
                    path="/admin-dashboard/*"
                    element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin-history"
                    element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <AdminHistory />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin-manage"
                    element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <AdminManage />
                        </PrivateRoute>
                    }
                />

                {/* Fallback for unmatched paths */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

export default App;