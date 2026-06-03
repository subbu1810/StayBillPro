import React, { useState } from 'react';
import '../styles/Login.css';

function Login({ onLogin }) {
    const [credentials, setCredentials] = useState({
        identifier: '', // Can be phone or email
        password: ''
    });
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [error, setError] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    const handleInputChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleLogin = (e) => {
        e.preventDefault();

        // Basic validation
        if (!credentials.identifier || !credentials.password) {
            setError('Please enter both phone/email and password');
            return;
        }

        // Simple demo authentication
        // In production, this would call your backend API
        if (credentials.password === 'admin123') {
            onLogin(true);
        } else {
            setError('Invalid credentials. Try password: admin123');
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();

        if (!resetEmail) {
            setError('Please enter your email or phone number');
            return;
        }

        // Simulate password reset
        setResetMessage('Password reset link has been sent to your email/phone!');
        setTimeout(() => {
            setShowForgotPassword(false);
            setResetMessage('');
            setResetEmail('');
        }, 3000);
    };

    if (showForgotPassword) {
        return (
            <div className="login-container">
                <div className="login-card forgot-password-card centered-card">
                    <div className="login-header">
                        <div className="login-icon">🔐</div>
                        <h1>Forgot Password?</h1>
                        <p className="login-subtitle">Enter your email or phone number to reset your password</p>
                    </div>

                    {resetMessage && (
                        <div className="success-message">
                            <span className="message-icon">✅</span>
                            {resetMessage}
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <span className="message-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleForgotPassword} className="login-form">
                        <div className="form-group">
                            <label className="input-label">
                                <span className="label-icon">📧</span>
                                Email or Phone Number
                            </label>
                            <input
                                type="text"
                                className="login-input"
                                placeholder="Enter your email or phone"
                                value={resetEmail}
                                onChange={(e) => {
                                    setResetEmail(e.target.value);
                                    setError('');
                                }}
                            />
                        </div>

                        <button type="submit" className="login-button">
                            <span className="button-icon">📨</span>
                            Send Reset Link
                        </button>

                        <div className="login-footer">
                            <button
                                type="button"
                                className="back-to-login"
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setError('');
                                    setResetMessage('');
                                }}
                            >
                                ← Back to Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card centered-card">
                <div className="login-header">
                    <div className="login-icon">🔧</div>
                    <h1>Welcome Back!</h1>
                    <p className="login-subtitle">Service Management System</p>
                </div>

                {error && (
                    <div className="error-message">
                        <span className="message-icon">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label className="input-label">
                            <span className="label-icon">📱</span>
                            Phone Number or Email
                        </label>
                        <input
                            type="text"
                            name="identifier"
                            className="login-input"
                            placeholder="Enter phone number or email"
                            value={credentials.identifier}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="input-label">
                            <span className="label-icon">🔒</span>
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            className="login-input"
                            placeholder="Enter your password"
                            value={credentials.password}
                            onChange={handleInputChange}
                        />
                    </div>

                    <button
                        type="button"
                        className="forgot-password-link"
                        onClick={() => setShowForgotPassword(true)}
                    >
                        Forgot Password?
                    </button>

                    <button type="submit" className="login-button">
                        <span className="button-icon">🚀</span>
                        Login to Dashboard
                    </button>

                    <div className="login-footer">
                        <p className="demo-hint">
                            💡 Demo Credentials: Any phone/email + password: <strong>admin123</strong>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
