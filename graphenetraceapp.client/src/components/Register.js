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
        <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite'
        }}>
            <style>
                {`
                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .floating-card {
                        transform: translateY(0);
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                    }
                    .floating-card:hover {
                        transform: translateY(-10px);
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    }
                    .input-group-custom {
                        position: relative;
                        margin-bottom: 1.5rem;
                    }
                    .input-group-custom input,
                    .input-group-custom select {
                        border: none;
                        border-bottom: 2px solid #ddd;
                        border-radius: 0;
                        background: transparent;
                        transition: border-color 0.3s ease;
                        padding: 10px 0;
                    }
                    .input-group-custom input:focus,
                    .input-group-custom select:focus {
                        border-bottom-color: #f5576c;
                        box-shadow: none;
                        outline: none;
                    }
                    .input-group-custom label {
                        position: absolute;
                        top: 50%;
                        left: 0;
                        transform: translateY(-50%);
                        transition: all 0.3s ease;
                        pointer-events: none;
                        color: #666;
                        font-weight: 600;
                    }
                    .input-group-custom input:focus + label,
                    .input-group-custom input:not(:placeholder-shown) + label,
                    .input-group-custom select:focus + label,
                    .input-group-custom select:not([value=""]) + label {
                        top: -20px;
                        font-size: 0.8rem;
                        color: #f5576c;
                    }
                    .btn-elegant {
                        background: linear-gradient(45deg, #f5576c, #f093fb);
                        border: none;
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                        color: white;
                        font-weight: bold;
                    }
                    .btn-elegant:before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                        transition: left 0.5s;
                    }
                    .btn-elegant:hover:before {
                        left: 100%;
                    }
                    .icon-float {
                        animation: float 3s ease-in-out infinite;
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    .form-check-custom {
                        display: flex;
                        align-items: center;
                        margin-bottom: 1.5rem;
                    }
                    .form-check-custom input {
                        margin-right: 10px;
                        transform: scale(1.2);
                    }
                    .form-check-custom label {
                        margin: 0;
                        font-weight: 500;
                    }
                    .error-text {
                        color: #e74c3c;
                        font-size: 0.85rem;
                        margin-top: 5px;
                    }
                `}
            </style>
            <div className="floating-card card shadow-lg p-5 position-relative" style={{
                maxWidth: '700px',
                width: '100%',
                borderRadius: '25px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <div className="text-center mb-5">
                    <i className="bi bi-person-plus-fill fs-1 text-danger mb-4 icon-float" style={{ color: '#f5576c' }}></i>
                    <h2 className="fw-bold text-dark mb-2" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '1px' }}>Create Your Account</h2>
                    <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>Join Graphene Trace for better health monitoring</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4 input-group-custom">
                        <select name="role" value={formData.role} onChange={handleChange} className="form-select form-select-lg">
                            <option value="patient">Patient</option>
                            <option value="clinician">Clinician</option>
                        </select>
                        <label className="form-label fw-semibold">
                            <i className="bi bi-person me-2"></i>Role
                        </label>
                    </div>

                    <div className="row">
                        <div className="col-md-6 input-group-custom">
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" placeholder=" " />
                            <label className="form-label fw-semibold">
                                <i className="bi bi-tag me-2"></i>Name
                            </label>
                            {errors.name && <div className="error-text">{errors.name}</div>}
                        </div>
                        {formData.role === 'patient' && (
                            <div className="col-md-6 input-group-custom">
                                <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-control" placeholder=" " />
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-calendar me-2"></i>Age
                                </label>
                                {errors.age && <div className="error-text">{errors.age}</div>}
                            </div>
                        )}
                    </div>

                    <div className="row">
                        <div className="col-md-6 input-group-custom">
                            <select name="gender" value={formData.gender} onChange={handleChange} className="form-select">
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <label className="form-label fw-semibold">
                                <i className="bi bi-gender-ambiguous me-2"></i>Gender
                            </label>
                            {errors.gender && <div className="error-text">{errors.gender}</div>}
                        </div>
                        <div className="col-md-6 input-group-custom">
                            <input type="text" name="state" value={formData.state} onChange={handleChange} className="form-control" placeholder=" " />
                            <label className="form-label fw-semibold">
                                <i className="bi bi-geo-alt me-2"></i>State
                            </label>
                            {errors.state && <div className="error-text">{errors.state}</div>}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 input-group-custom">
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-control" placeholder=" " />
                            <label className="form-label fw-semibold">
                                <i className="bi bi-telephone me-2"></i>Phone
                            </label>
                            {errors.phone && <div className="error-text">{errors.phone}</div>}
                        </div>
                        <div className="col-md-6 input-group-custom">
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" placeholder=" " />
                            <label className="form-label fw-semibold">
                                <i className="bi bi-envelope me-2"></i>Email
                            </label>
                            {errors.email && <div className="error-text">{errors.email}</div>}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 input-group-custom">
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" placeholder=" " />
                            <label className="form-label fw-semibold">
                                <i className="bi bi-lock me-2"></i>Password
                            </label>
                            {errors.password && <div className="error-text">{errors.password}</div>}
                        </div>
                        <div className="col-md-6 input-group-custom">
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-control" placeholder=" " />
                            <label className="form-label fw-semibold">
                                <i className="bi bi-lock-fill me-2"></i>Confirm Password
                            </label>
                            {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
                        </div>
                    </div>

                    {formData.role === 'clinician' && (
                        <>
                            <div className="row">
                                <div className="col-md-6 input-group-custom">
                                    <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="form-control" placeholder=" " />
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-card-text me-2"></i>License Number
                                    </label>
                                    {errors.licenseNumber && <div className="error-text">{errors.licenseNumber}</div>}
                                </div>
                                <div className="col-md-6 input-group-custom">
                                    <input type="text" name="hospitalName" value={formData.hospitalName} onChange={handleChange} className="form-control" placeholder=" " />
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-hospital me-2"></i>Hospital Name
                                    </label>
                                    {errors.hospitalName && <div className="error-text">{errors.hospitalName}</div>}
                                </div>
                            </div>
                            <div className="input-group-custom">
                                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="form-control" placeholder=" " />
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-tools me-2"></i>Specialization
                                </label>
                                {errors.specialization && <div className="error-text">{errors.specialization}</div>}
                            </div>
                        </>
                    )}

                    <div className="form-check-custom">
                        <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="form-check-input" />
                        <label className="form-check-label">I accept the <a href="#" className="text-primary text-decoration-none" style={{ color: '#f5576c' }}>terms and conditions</a></label>
                        {errors.acceptTerms && <div className="error-text">{errors.acceptTerms}</div>}
                    </div>

                    <button type="submit" className="btn btn-elegant btn-lg w-100 rounded-pill" style={{ fontSize: '1.1rem', padding: '12px 0' }}>
                        <i className="bi bi-person-plus me-2"></i>Register
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;