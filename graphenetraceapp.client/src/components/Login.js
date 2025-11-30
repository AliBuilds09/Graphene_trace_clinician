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
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card shadow-lg p-5" style={{ maxWidth: '450px', width: '100%', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.95)' }}>
                <div className="text-center mb-4">
                    <i className="bi bi-heart-pulse-fill fs-1 text-primary mb-3"></i>
                    <h2 className="fw-bold text-dark">Welcome Back</h2>
                    <p className="text-muted">Login to Graphene Trace</p>
                </div>
                {error && <div className="alert alert-danger rounded-pill">{error}</div>}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                        <label htmlFor="username" className="form-label fw-semibold">
                            <i className="bi bi-envelope me-2"></i>Email or Phone
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="form-control form-control-lg rounded-pill"
                            placeholder="Enter your email or phone"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="form-label fw-semibold">
                            <i className="bi bi-lock me-2"></i>Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="form-control form-control-lg rounded-pill"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill mb-3" disabled={loading}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Logging in...</> : <><i className="bi bi-box-arrow-in-right me-2"></i>Login</>}
                    </button>
                    <div className="text-center">
                        <span className="text-muted">Don't have an account? </span>
                        <Link to="/register" className="text-primary fw-semibold">Register</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;