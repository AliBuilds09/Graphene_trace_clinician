import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: '',
        state: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        licenseNumber: '',
        hospitalName: '',
        specialization: '',
        role: 'patient',
        acceptTerms: false
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (formData.role === 'patient' && !formData.age) newErrors.age = 'Age is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.phone) newErrors.phone = 'Phone is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (formData.role === 'clinician') {
            if (!formData.licenseNumber) newErrors.licenseNumber = 'License Number is required';
            if (!formData.hospitalName) newErrors.hospitalName = 'Hospital Name is required';
            if (!formData.specialization) newErrors.specialization = 'Specialization is required';
        }
        if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const endpoint = formData.role === 'patient' ? '/api/patient/register-patient' : '/api/patient/register-clinician';
        const payload = formData.role === 'patient' ? {
            Name: formData.name,
            Age: parseInt(formData.age),
            Gender: formData.gender,
            State: formData.state,
            Phone: formData.phone,
            Email: formData.email,
            Password: formData.password
        } : {
            Name: formData.name,
            Gender: formData.gender,
            State: formData.state,
            Phone: formData.phone,
            Email: formData.email,
            Password: formData.password,
            LicenseNumber: formData.licenseNumber,
            HospitalName: formData.hospitalName,
            Specialization: formData.specialization
        };

        try {
            await axios.post(`http://localhost:5033${endpoint}`, payload);
            alert(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} registered successfully!`);
            navigate('/login');
        } catch (err) {
            console.error('Registration error:', err);
            alert('Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="card shadow-lg p-5" style={{ maxWidth: '600px', width: '100%', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.95)' }}>
                <div className="text-center mb-4">
                    <i className="bi bi-person-plus-fill fs-1 text-danger mb-3"></i>
                    <h2 className="fw-bold text-dark">Create Your Account</h2>
                    <p className="text-muted">Join Graphene Trace for better health monitoring</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label fw-semibold">
                            <i className="bi bi-person me-2"></i>Role
                        </label>
                        <select name="role" value={formData.role} onChange={handleChange} className="form-select form-select-lg rounded-pill">
                            <option value="patient">Patient</option>
                            <option value="clinician">Clinician</option>
                        </select>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-tag me-2"></i>Name
                            </label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control rounded-pill" />
                            {errors.name && <div className="text-danger small">{errors.name}</div>}
                        </div>
                        {formData.role === 'patient' && (
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-calendar me-2"></i>Age
                                </label>
                                <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-control rounded-pill" />
                                {errors.age && <div className="text-danger small">{errors.age}</div>}
                            </div>
                        )}
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-gender-ambiguous me-2"></i>Gender
                            </label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="form-select rounded-pill">
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.gender && <div className="text-danger small">{errors.gender}</div>}
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-geo-alt me-2"></i>State
                            </label>
                            <input type="text" name="state" value={formData.state} onChange={handleChange} className="form-control rounded-pill" />
                            {errors.state && <div className="text-danger small">{errors.state}</div>}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-telephone me-2"></i>Phone
                            </label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-control rounded-pill" />
                            {errors.phone && <div className="text-danger small">{errors.phone}</div>}
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-envelope me-2"></i>Email
                            </label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control rounded-pill" />
                            {errors.email && <div className="text-danger small">{errors.email}</div>}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-lock me-2"></i>Password
                            </label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control rounded-pill" />
                            {errors.password && <div className="text-danger small">{errors.password}</div>}
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">
                                <i className="bi bi-lock-fill me-2"></i>Confirm Password
                            </label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-control rounded-pill" />
                            {errors.confirmPassword && <div className="text-danger small">{errors.confirmPassword}</div>}
                        </div>
                    </div>

                    {formData.role === 'clinician' && (
                        <>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-card-text me-2"></i>License Number
                                    </label>
                                    <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="form-control rounded-pill" />
                                    {errors.licenseNumber && <div className="text-danger small">{errors.licenseNumber}</div>}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-hospital me-2"></i>Hospital Name
                                    </label>
                                    <input type="text" name="hospitalName" value={formData.hospitalName} onChange={handleChange} className="form-control rounded-pill" />
                                    {errors.hospitalName && <div className="text-danger small">{errors.hospitalName}</div>}
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-tools me-2"></i>Specialization
                                </label>
                                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="form-control rounded-pill" />
                                {errors.specialization && <div className="text-danger small">{errors.specialization}</div>}
                            </div>
                        </>
                    )}

                    <div className="mb-4 form-check">
                        <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="form-check-input" />
                        <label className="form-check-label">I accept the <a href="#" className="text-primary">terms and conditions</a></label>
                        {errors.acceptTerms && <div className="text-danger small">{errors.acceptTerms}</div>}
                    </div>

                    <button type="submit" className="btn btn-danger btn-lg w-100 rounded-pill">
                        <i className="bi bi-person-plus me-2"></i>Register
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;