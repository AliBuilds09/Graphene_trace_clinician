// src/pages/SettingPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar.js';

const SettingPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        dateOfBirth: '',
        gender: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeSection, setActiveSection] = useState('profile');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (userId && token) {
            fetchUserProfile();
        }
    }, [userId, token]);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`http://localhost:5033/api/profile/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData(prev => ({ ...prev, ...response.data }));
        } catch (err) {
            setError('Failed to load profile data.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateForm = () => {
        if (!formData.name || !formData.email || !formData.phone) {
            return 'Please fill in all required fields.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return 'Please enter a valid email address.';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            await axios.put(`http://localhost:5033/api/profile/${userId}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Profile updated successfully!');
            fetchUserProfile();
        } catch (err) {
            setError('Failed to update profile. Try again later.');
        } finally {
            setSaving(false);
        }
    };

    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

    return (
        <div className="d-flex vh-100" style={{ background: 'linear-gradient(135deg, #e3f2fd, #ffffff)' }}>
            <div className={`d-${sidebarCollapsed ? 'none' : 'block'} d-md-block`}>
                <Sidebar role={role} />
            </div>
            <div className="d-flex flex-grow-1 flex-column">
                {/* Header with toggle for mobile */}
                <div className="d-md-none bg-primary text-white p-3 d-flex align-items-center shadow-sm">
                    <button className="btn btn-light me-3 rounded-circle" onClick={toggleSidebar}>
                        <i className="bi bi-list"></i>
                    </button>
                    <h4 className="mb-0 fw-bold">Settings</h4>
                </div>
                <div className="d-flex flex-grow-1">
                    {/* Settings Menu */}
                    <div className={`bg-white shadow-lg p-4 ${sidebarCollapsed ? 'd-none' : ''}`} style={{ width: '320px', minHeight: '100vh', borderRight: '2px solid #e3f2fd', background: 'linear-gradient(180deg, #ffffff, #f8f9fa)' }}>
                        <h4 className="text-primary mb-4 fw-bold">
                            <i className="bi bi-gear-fill me-2"></i>Settings
                        </h4>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item border-0 px-0 py-2">
                                <button
                                    className={`btn btn-link text-start w-100 fw-semibold fs-5 ${activeSection === 'profile' ? 'text-primary border-start border-primary border-4 ps-3' : 'text-dark'}`}
                                    onClick={() => setActiveSection('profile')}
                                    style={{ textDecoration: 'none', transition: 'all 0.3s ease' }}
                                >
                                    <i className="bi bi-person-circle-fill me-3"></i>Edit Profile
                                </button>
                            </li>
                            <li className="list-group-item border-0 px-0 py-2">
                                <button
                                    className={`btn btn-link text-start w-100 fw-semibold fs-5 ${activeSection === 'security' ? 'text-primary border-start border-primary border-4 ps-3' : 'text-dark'}`}
                                    onClick={() => setActiveSection('security')}
                                    style={{ textDecoration: 'none', transition: 'all 0.3s ease' }}
                                >
                                    <i className="bi bi-shield-lock-fill me-3"></i>Security
                                </button>
                            </li>
                            <li className="list-group-item border-0 px-0 py-2">
                                <button
                                    className={`btn btn-link text-start w-100 fw-semibold fs-5 ${activeSection === 'notifications' ? 'text-primary border-start border-primary border-4 ps-3' : 'text-dark'}`}
                                    onClick={() => setActiveSection('notifications')}
                                    style={{ textDecoration: 'none', transition: 'all 0.3s ease' }}
                                >
                                    <i className="bi bi-bell-fill me-3"></i>Notifications
                                </button>
                            </li>
                        </ul>
                    </div>
                    {/* Main Content */}
                    <div className="flex-grow-1 p-5 overflow-auto" style={{ background: 'linear-gradient(135deg, #f5f7fa, #ffffff)' }}>
                        {activeSection === 'profile' && (
                            <div className="container-fluid">
                                <div className="row justify-content-center">
                                    <div className="col-12 col-xl-10">
                                        <div className="card shadow-xl border-0 rounded-4" style={{ background: 'linear-gradient(135deg, #ffffff, #f8f9fa)', boxShadow: '0 10px 30px rgba(0,123,255,0.1)' }}>
                                            <div className="card-header bg-primary text-white rounded-top-4 py-4" style={{ background: 'linear-gradient(90deg, #007bff, #0056b3)' }}>
                                                <h2 className="mb-0 fw-bold">
                                                    <i className="bi bi-person-fill-add me-3"></i>Edit Profile
                                                </h2>
                                                <p className="mb-0 opacity-75">Update your personal information</p>
                                            </div>
                                            <div className="card-body p-5">
                                                <form onSubmit={handleSubmit} noValidate>
                                                    <div className="row g-4">
                                                        <div className="col-md-6">
                                                            <label className="form-label fw-bold text-primary" htmlFor="name">
                                                                <i className="bi bi-person me-2"></i>Name *
                                                            </label>
                                                            <input
                                                                className="form-control form-control-lg rounded-pill shadow-sm"
                                                                id="name"
                                                                name="name"
                                                                type="text"
                                                                placeholder="Enter your full name"
                                                                value={formData.name || ''}
                                                                onChange={handleChange}
                                                                disabled={saving}
                                                                required
                                                                style={{ border: '2px solid #e9ecef', transition: 'border-color 0.3s ease' }}
                                                                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                                                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label fw-bold text-primary" htmlFor="email">
                                                                <i className="bi bi-envelope me-2"></i>Email *
                                                            </label>
                                                            <input
                                                                className="form-control form-control-lg rounded-pill shadow-sm"
                                                                id="email"
                                                                name="email"
                                                                type="email"
                                                                placeholder="Enter your email"
                                                                value={formData.email || ''}
                                                                onChange={handleChange}
                                                                disabled={saving}
                                                                required
                                                                style={{ border: '2px solid #e9ecef', transition: 'border-color 0.3s ease' }}
                                                                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                                                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label fw-bold text-primary" htmlFor="phone">
                                                                <i className="bi bi-telephone me-2"></i>Phone Number *
                                                            </label>
                                                            <input
                                                                className="form-control form-control-lg rounded-pill shadow-sm"
                                                                id="phone"
                                                                name="phone"
                                                                type="tel"
                                                                placeholder="Enter your phone number"
                                                                value={formData.phone || ''}
                                                                onChange={handleChange}
                                                                disabled={saving}
                                                                required
                                                                style={{ border: '2px solid #e9ecef', transition: 'border-color 0.3s ease' }}
                                                                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                                                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label fw-bold text-primary" htmlFor="dateOfBirth">
                                                                <i className="bi bi-calendar me-2"></i>Date of Birth
                                                            </label>
                                                            <input
                                                                className="form-control form-control-lg rounded-pill shadow-sm"
                                                                id="dateOfBirth"
                                                                name="dateOfBirth"
                                                                type="date"
                                                                value={formData.dateOfBirth || ''}
                                                                onChange={handleChange}
                                                                disabled={saving}
                                                                style={{ border: '2px solid #e9ecef', transition: 'border-color 0.3s ease' }}
                                                                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                                                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label fw-bold text-primary" htmlFor="gender">
                                                                <i className="bi bi-gender-ambiguous me-2"></i>Gender
                                                            </label>
                                                            <select
                                                                className="form-select form-select-lg rounded-pill shadow-sm"
                                                                id="gender"
                                                                name="gender"
                                                                value={formData.gender || ''}
                                                                onChange={handleChange}
                                                                disabled={saving}
                                                                style={{ border: '2px solid #e9ecef', transition: 'border-color 0.3s ease' }}
                                                                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                                                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                                            >
                                                                <option value="">Select Gender</option>
                                                                <option value="male">Male</option>
                                                                <option value="female">Female</option>
                                                                <option value="other">Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-12">
                                                            <label className="form-label fw-bold text-primary" htmlFor="bio">
                                                                <i className="bi bi-file-text me-2"></i>Bio
                                                            </label>
                                                            <textarea
                                                                className="form-control form-control-lg rounded-3 shadow-sm"
                                                                id="bio"
                                                                name="bio"
                                                                rows="4"
                                                                placeholder="Tell us about yourself..."
                                                                value={formData.bio || ''}
                                                                onChange={handleChange}
                                                                disabled={saving}
                                                                style={{ border: '2px solid #e9ecef', transition: 'border-color 0.3s ease', resize: 'none' }}
                                                                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                                                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                                            />
                                                        </div>
                                                    </div>
                                                    {error && <div className="alert alert-danger rounded-3 mt-4 shadow-sm"><i className="bi bi-exclamation-triangle me-2"></i>{error}</div>}
                                                    {success && <div className="alert alert-success rounded-3 mt-4 shadow-sm"><i className="bi bi-check-circle me-2"></i>{success}</div>}
                                                    <div className="d-flex justify-content-end mt-4">
                                                        <button type="submit" className="btn btn-primary btn-lg rounded-pill px-5 py-3 shadow-lg" disabled={saving} style={{ transition: 'all 0.3s ease', transform: saving ? 'scale(0.95)' : 'scale(1)' }}>
                                                            {saving ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="bi bi-check-circle-fill me-2"></i>Update Profile
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeSection === 'security' && (
                            <div className="container-fluid">
                                <div className="row justify-content-center">
                                    <div className="col-12 col-xl-10">
                                        <div className="card shadow-xl border-0 rounded-4" style={{ background: 'linear-gradient(135deg, #ffffff, #f8f9fa)', boxShadow: '0 10px 30px rgba(0,123,255,0.1)' }}>
                                            <div className="card-header text-white rounded-top-4 py-4" style={{ background: 'linear-gradient(90deg, #007bff, #0056b3)' }}>
                                                <h2 className="mb-0 fw-bold">
                                                    <i className="bi bi-shield-lock-fill me-3"></i>Security Settings
                                                </h2>
                                                <p className="mb-0 opacity-75">Manage your account security</p>
                                            </div>
                                            <div className="card-body p-5">
                                                <p className="text-muted">Change password and security options here. (Feature to be implemented)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeSection === 'notifications' && (
                            <div className="container-fluid">
                                <div className="row justify-content-center">
                                    <div className="col-12 col-xl-10">
                                        <div className="card shadow-xl border-0 rounded-4" style={{ background: 'linear-gradient(135deg, #ffffff, #f8f9fa)', boxShadow: '0 10px 30px rgba(0,123,255,0.1)' }}>
                                            <div className="card-header text-white rounded-top-4 py-4" style={{ background: 'linear-gradient(90deg, #007bff, #0056b3)' }}>
                                                <h2 className="mb-0 fw-bold">
                                                    <i className="bi bi-bell-fill me-3"></i>Notification Preferences
                                                </h2>
                                                <p className="mb-0 opacity-75">Customize your notifications</p>
                                            </div>
                                            <div className="card-body p-5">
                                                <p className="text-muted">Manage your notification settings here. (Feature to be implemented)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingPage;