// src/pages/SettingPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar.js';

const SettingPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [activeSection, setActiveSection] = useState('profile');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    useEffect(() => {
        console.log('SettingPage: useEffect called');
        console.log('SettingPage: userId:', userId);
        console.log('SettingPage: token:', !!token);
        console.log('SettingPage: role:', role);
        if (userId && token) {
            fetchUserProfile();
        }
    }, [userId, token]);

    const fetchUserProfile = async () => {
        console.log('SettingPage: Fetching profile for userId:', userId, 'role:', role);
        try {
            const response = await axios.get(`http://localhost:5033/api/profile/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('SettingPage: Profile response:', response.data);
            setFormData(response.data);
        } catch (err) {
            console.error('SettingPage: Error fetching profile:', err);
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
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
            alert('Profile updated successfully!');
            fetchUserProfile(); // Refresh data
        } catch (err) {
            console.error('SettingPage: Error updating profile:', err);
            setError('Failed to update profile. Try again later.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="d-flex">
            <Sidebar role={role} />  {/* Role-based sidebar */}
            <div className="d-flex flex-grow-1">
                <div className="bg-light p-3" style={{ width: '300px', height: '100vh' }}>
                    <h4>Settings</h4>
                    <ul className="list-group">
                        <li className="list-group-item">
                            <button
                                className={`btn btn-link ${activeSection === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveSection('profile')}
                            >
                                Edit Profile
                            </button>
                        </li>
                        {/* Add more sections if needed */}
                    </ul>
                </div>
                <div className="flex-grow-1 p-3">
                    {activeSection === 'profile' && (
                        <div className="container py-4">
                            <h2>Edit Profile</h2>
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="name">Name *</label>
                                    <input
                                        className="form-control"
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={handleChange}
                                        disabled={saving}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label" htmlFor="email">Email *</label>
                                    <input
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        disabled={saving}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label" htmlFor="phone">Phone Number *</label>
                                    <input
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        disabled={saving}
                                        required
                                    />
                                </div>

                                {error && <div className="alert alert-danger">{error}</div>}

                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Update Profile'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingPage;