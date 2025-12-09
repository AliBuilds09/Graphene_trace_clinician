// src/components/Login.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5033/api/auth/login', {
                username,
                password,
            });

            const { token, role, userId, name } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('role', role.toLowerCase());
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', name);

            setLoading(false);
            navigate(`/${role.toLowerCase()}-dashboard`);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
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
                    }
                    .input-group-custom input {
                        border: none;
                        border-bottom: 2px solid #ddd;
                        border-radius: 0;
                        background: transparent;
                        transition: border-color 0.3s ease;
                    }
                    .input-group-custom input:focus {
                        border-bottom-color: #667eea;
                        box-shadow: none;
                    }
                    .input-group-custom label {
                        position: absolute;
                        top: 50%;
                        left: 0;
                        transform: translateY(-50%);
                        transition: all 0.3s ease;
                        pointer-events: none;
                        color: #666;
                    }
                    .input-group-custom input:focus + label,
                    .input-group-custom input:not(:placeholder-shown) + label {
                        top: -20px;
                        font-size: 0.8rem;
                        color: #667eea;
                    }
                    .btn-elegant {
                        background: linear-gradient(45deg, #667eea, #764ba2);
                        border: none;
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
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
                `}
            </style>
            <div className="floating-card card shadow-lg p-5 position-relative" style={{
                maxWidth: '500px',
                width: '100%',
                borderRadius: '25px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <div className="text-center mb-5">
                    <i className="bi bi-heart-pulse-fill fs-1 text-primary mb-4 icon-float" style={{ color: '#667eea' }}></i>
                    <h2 className="fw-bold text-dark mb-2" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '1px' }}>Welcome Back</h2>
                    <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>Login to Graphene Trace</p>
                </div>
                {error && <div className="alert alert-danger rounded-pill mb-4" style={{ background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)', color: 'white', border: 'none' }}>{error}</div>}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-5 input-group-custom">
                        <input
                            type="text"
                            id="username"
                            className="form-control form-control-lg"
                            placeholder=" "
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            required
                            style={{ paddingLeft: '0', paddingBottom: '10px' }}
                        />
                        <label htmlFor="username" className="form-label fw-semibold">
                            <i className="bi bi-envelope me-2"></i>Email or Phone
                        </label>
                    </div>
                    <div className="mb-5 input-group-custom">
                        <input
                            type="password"
                            id="password"
                            className="form-control form-control-lg"
                            placeholder=" "
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            style={{ paddingLeft: '0', paddingBottom: '10px' }}
                        />
                        <label htmlFor="password" className="form-label fw-semibold">
                            <i className="bi bi-lock me-2"></i>Password
                        </label>
                    </div>
                    <button type="submit" className="btn btn-elegant btn-lg w-100 rounded-pill mb-4 text-white fw-bold" disabled={loading} style={{ fontSize: '1.1rem', padding: '12px 0' }}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Logging in...</> : <><i className="bi bi-box-arrow-in-right me-2"></i>Login</>}
                    </button>
                    <div className="text-center">
                        <span className="text-muted">Don't have an account? </span>
                        <Link to="/register" className="text-primary fw-semibold text-decoration-none" style={{ color: '#667eea', transition: 'color 0.3s ease' }}>Register</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;