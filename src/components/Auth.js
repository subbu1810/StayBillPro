import React, { useState, useEffect } from 'react';
import '../styles/Auth.css';
import { adminAuthAPI, subscriptionAPI, paymentAPI } from '../services/api';

const CARD_DETAILS_INITIAL = {
    nameOnCard: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
};

function Auth({ onLogin, onBackToHome, mode = 'login', selectedPlan = null }) {
    const [isLogin, setIsLogin] = useState(mode === 'login');
    const [loginData, setLoginData] = useState({
        identifier: '',
        password: ''
    });
    const [registerData, setRegisterData] = useState({
        businessName: '',
        branchName: '', // New Field
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        gstn: '',
        businessType: '',
        password: '',
        confirmPassword: '',
        selectedPlan: selectedPlan || 'Starter (1-Year)'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const INDIAN_STATES = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
        'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
        'Uttarakhand', 'West Bengal', 'Delhi'
    ];

    const BUSINESS_TYPES = [
        'Sole Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'
    ];

    useEffect(() => {
        setIsLogin(mode === 'login');
    }, [mode]);

    // Calculate plan pricing
    const getPlanDetails = () => {
        if (!registerData.selectedPlan) return null;

        const planPricing = {
            'Starter (1-Year)': { monthlyPrice: 600, duration: 12, name: 'Starter' },
            'Professional (2-Year)': { monthlyPrice: 500, duration: 24, name: 'Professional' },
            'Enterprise (3-Year)': { monthlyPrice: 400, duration: 36, name: 'Enterprise' }
        };

        const plan = planPricing[registerData.selectedPlan];
        if (!plan) return null;

        const subtotal = plan.monthlyPrice * plan.duration;
        const gst = subtotal * 0.18;
        const total = subtotal + gst;

        return {
            ...plan,
            subtotal,
            gst,
            total
        };
    };

    const planDetails = getPlanDetails();

    const handleLoginChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleRegisterChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!loginData.identifier || !loginData.password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            
            // Support login by email or phone
            const payload = loginData.identifier.includes('@')
                ? { email: loginData.identifier, password: loginData.password }
                : { phone: loginData.identifier, password: loginData.password };

            const response = await adminAuthAPI.login(payload);

            if (response.token) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('adminToken', response.token); 
                localStorage.setItem('adminUser', JSON.stringify(response.user));
                onLogin(true);
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } catch (err) {
            // Display server-provided message when available
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        if (!resetEmail) {
            setError('Please enter your email address');
            return;
        }
        // Simulate password reset
        setSuccess('If an account exists with this email, you will receive a password reset link shortly.');
        setTimeout(() => {
            setSuccess('');
            setShowForgotPassword(false);
            setResetEmail('');
        }, 3000);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Validation
        if (!registerData.businessName || !registerData.branchName || !registerData.name || !registerData.email ||
            !registerData.phone || !registerData.password || !registerData.confirmPassword) {
            setError('Please fill in all fields including Branch Name');
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (registerData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (registerData.pincode && registerData.pincode.length !== 6) {
            setError('Pincode must be 6 digits');
            return;
        }

        // Validate required address fields
        if (!registerData.address || !registerData.city || !registerData.state ||
            !registerData.pincode || !registerData.businessType) {
            setError('Please fill in all required fields including address details');
            return;
        }

        if (isSubmitting) return;

        const currentPlanDetails = getPlanDetails();
        if (!currentPlanDetails) {
            setError('Please select a plan');
            return;
        }

        const formattedAddress = [registerData.address, registerData.city, registerData.state, registerData.pincode, registerData.country]
            .filter(Boolean)
            .join(', ');
        const noteParts = [];
        if (registerData.businessType) noteParts.push(`Business Type: ${registerData.businessType}`);
        if (registerData.gstn) noteParts.push(`GST: ${registerData.gstn}`);
        const notes = noteParts.length ? noteParts.join(' | ') : null;

        try {
            setIsSubmitting(true);
            setError('');
            setSuccess('');

            // BYPASS PAYMENT: Directly call registration and verification
            console.log('Bypassing payment for direct registration...');

            // 1. Create Admin Profile
            const adminResponse = await adminAuthAPI.register({
                business_name: registerData.businessName,
                branch_name: registerData.branchName,
                admin_name: registerData.name,
                email: registerData.email,
                phone: registerData.phone,
                address: registerData.address,
                city: registerData.city,
                state: registerData.state,
                pincode: registerData.pincode,
                country: registerData.country,
                business_type: registerData.businessType,
                gst_number: registerData.gstn,
                password: registerData.password,
                plan_name: currentPlanDetails.name
            });

            // 2. Verify payment (Mock) and activate subscription
            await subscriptionAPI.verify({
                admin_id: adminResponse.admin_id,
                plan_name: currentPlanDetails.name,
                transaction_id: 'MOCK_PAYMENT_' + Date.now(),
                amount: currentPlanDetails.subtotal,
                gst_amount: currentPlanDetails.gst,
                total_paid: currentPlanDetails.total
            });

            setSuccess('Account created successfully (Payment Bypassed)! Redirecting to login...');
            
            setTimeout(() => {
                setIsLogin(true);
                setSuccess('');
            }, 2000);
            
            setRegisterData({
                businessName: '',
                branchName: '',
                name: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                country: 'India',
                pincode: '',
                gstn: '',
                businessType: '',
                password: '',
                confirmPassword: '',
                selectedPlan: registerData.selectedPlan // Keep selected plan
            });

        } catch (err) {
            setError('Failed to complete registration: ' + err.message);
            setIsSubmitting(false);
        } finally {
            // Keep isSubmitting true during timeout
        }
    };

    return (
        <div className="auth-page">
            {/* Header */}
            <header className="auth-header">
                <div className="auth-header-content">
                    {onBackToHome && (
                        <button className="back-to-home-btn" onClick={onBackToHome} title="Back to Home">
                            ← Back
                        </button>
                    )}
                    <div className="logo">
                        <span className="logo-icon">🔧</span>
                        <span className="logo-text">ServiceHub</span>
                    </div>
                    {isLogin ? (
                        <div className="auth-actions">
                            <span className="auth-label">Login to Dashboard</span>
                        </div>
                    ) : (
                        <div className="auth-actions">
                            <span className="auth-label">Create Your Account</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="auth-container" style={!isLogin ? { alignItems: 'flex-start', paddingTop: '2rem' } : {}}>
                {isLogin ? (
                    <div className="auth-content">
                        {/* Left Side - Marketing */}
                        <div className="auth-marketing">
                            <div className="marketing-content">
                                <h1 className="marketing-title">
                                    Manage Your Service Business with Ease
                                </h1>
                                <p className="marketing-subtitle">
                                    Track service requests, manage appliances, and grow your electronics service business
                                </p>

                                <div className="feature-list">
                                    <div className="feature-item">
                                        <span className="feature-icon">✓</span>
                                        <span>Track all service requests in one place</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">✓</span>
                                        <span>Manage customer appliances efficiently</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">✓</span>
                                        <span>Real-time dashboard and analytics</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">✓</span>
                                        <span>24/7 access from anywhere</span>
                                    </div>
                                </div>

                                <div className="trust-badge">
                                    <span className="badge-icon">🏆</span>
                                    <div className="badge-text">
                                        <div className="badge-title">Trusted by 1000+ Service Centers</div>
                                        <div className="badge-subtitle">Across India</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Login Form */}
                        <div className="auth-forms">
                            <div className="auth-card">
                                {showForgotPassword ? (
                                    <>
                                        <div className="card-header">
                                            <h2>Reset Password</h2>
                                            <p>Enter your email to receive a reset link</p>
                                        </div>
                                        {error && <div className="error-alert"><span className="alert-icon">⚠️</span>{error}</div>}
                                        {success && <div className="success-alert"><span className="alert-icon">✅</span>{success}</div>}

                                        <form onSubmit={handleForgotPassword} className="auth-form">
                                            <div className="form-field">
                                                <label>Email Address</label>
                                                <input
                                                    type="email"
                                                    value={resetEmail}
                                                    onChange={(e) => { setResetEmail(e.target.value); setError(''); }}
                                                    placeholder="Enter your registered email"
                                                    className="form-input"
                                                />
                                            </div>
                                            <button type="submit" className="submit-btn" style={{ background: '#2563eb' }}>
                                                Send Reset Link
                                            </button>
                                            <button
                                                type="button"
                                                className="back-btn"
                                                onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }}
                                                style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                                            >
                                                Back to Login
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <>
                                        <div className="card-header">
                                            <h2>Welcome Back!</h2>
                                            <p>Login to access your dashboard</p>
                                        </div>

                                        {error && (
                                            <div className="error-alert">
                                                <span className="alert-icon">⚠️</span>
                                                {error}
                                            </div>
                                        )}
                                        {success && (
                                            <div className="success-alert">
                                                <span className="alert-icon">✅</span>
                                                {success}
                                            </div>
                                        )}

                                        <form onSubmit={handleLogin} className="auth-form">
                                            <div className="form-field">
                                                <label>Email or Phone Number</label>
                                                <input
                                                    type="text"
                                                    name="identifier"
                                                    placeholder="Enter your email or phone"
                                                    value={loginData.identifier}
                                                    onChange={handleLoginChange}
                                                    className="form-input"
                                                />
                                            </div>

                                            <div className="form-field">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <label style={{ marginBottom: 0 }}>Password</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowForgotPassword(true); setError(''); }}
                                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.85rem', cursor: 'pointer', outline: 'none', padding: 0 }}
                                                    >
                                                        Forgot Password?
                                                    </button>
                                                </div>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    placeholder="Enter your password"
                                                    value={loginData.password}
                                                    onChange={handleLoginChange}
                                                    className="form-input"
                                                />
                                            </div>

                                            <button type="submit" className="submit-btn">
                                                Login to Dashboard
                                            </button>

                                            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem', color: '#64748b' }}>
                                                Don't have an account?{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                                                >
                                                    Create Account
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // New Register Layout: Form Left, Summary Right
                    <form onSubmit={handleRegister} className="register-form-layout">
                        {/* LEFT PANEL - FORM FIELDS */}
                        <div className="register-left-panel">
                            <h2 className="form-title-compact">Create Account</h2>
                            <p className="form-subtitle-compact">Start managing your service business today</p>

                            {error && (
                                <div className="error-alert">
                                    <span className="alert-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="success-alert">
                                    <span className="alert-icon">✅</span>
                                    {success}
                                </div>
                            )}

                            <div className="compact-form-grid">
                                <div className="form-field full-width">
                                    <label>Business Name</label>
                                    <input type="text" name="businessName" placeholder="e.g. StayBill Electronics" value={registerData.businessName} onChange={handleRegisterChange} className="form-input" />
                                </div>
                                <div className="form-field full-width">
                                    <label>Main Branch Name</label>
                                    <input type="text" name="branchName" placeholder="e.g. Downtown Service Center" value={registerData.branchName} onChange={handleRegisterChange} className="form-input" />
                                </div>
                                <div className="form-field">
                                    <label>Your Name</label>
                                    <input type="text" name="name" placeholder="Full Name" value={registerData.name} onChange={handleRegisterChange} className="form-input" />
                                </div>

                                <div className="form-field">
                                    <label>Email Address</label>
                                    <input type="email" name="email" placeholder="your@email.com" value={registerData.email} onChange={handleRegisterChange} className="form-input" />
                                </div>
                                <div className="form-field">
                                    <label>Phone Number</label>
                                    <input type="tel" name="phone" placeholder="+91 98765 43210" value={registerData.phone} onChange={handleRegisterChange} className="form-input" />
                                </div>

                                <div className="form-field full-width">
                                    <label>Address</label>
                                    <input type="text" name="address" placeholder="Unit, Building, Street" value={registerData.address} onChange={handleRegisterChange} className="form-input" />
                                </div>

                                <div className="form-field three-col">
                                    <div className="sub-field">
                                        <label>City</label>
                                        <input type="text" name="city" placeholder="City" value={registerData.city} onChange={handleRegisterChange} className="form-input" />
                                    </div>
                                    <div className="sub-field">
                                        <label>State</label>
                                        <select name="state" value={registerData.state} onChange={handleRegisterChange} className="form-input" style={{ width: '100%' }}>
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sub-field">
                                        <label>Pincode</label>
                                        <input type="text" name="pincode" placeholder="000000" value={registerData.pincode} onChange={handleRegisterChange} className="form-input" maxLength="6" />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label>Country</label>
                                    <select name="country" value={registerData.country} onChange={handleRegisterChange} className="form-input">
                                        <option value="India">India</option>
                                        <option value="USA">USA</option>
                                        <option value="UK">UK</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Australia">Australia</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Business Type</label>
                                    <select name="businessType" value={registerData.businessType} onChange={handleRegisterChange} className="form-input">
                                        <option value="">Select Type</option>
                                        {BUSINESS_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-field full-width">
                                    <label>GST Number (Optional)</label>
                                    <input type="text" name="gstn" placeholder="GST Number (e.g., 22AAAAA0000A1Z5)" value={registerData.gstn} onChange={handleRegisterChange} className="form-input" maxLength="15" />
                                </div>

                                <div className="form-field">
                                    <label>Password</label>
                                    <input type="password" name="password" placeholder="Create password" value={registerData.password} onChange={handleRegisterChange} className="form-input" />
                                </div>
                                <div className="form-field">
                                    <label>Confirm Password</label>
                                    <input type="password" name="confirmPassword" placeholder="Confirm password" value={registerData.confirmPassword} onChange={handleRegisterChange} className="form-input" />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL - SUMMARY & PAYMENT */}
                        <div className="register-right-panel">
                            <div className="plan-selector-box" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1a1a1a' }}>Selected Plan</label>
                                <select 
                                    name="selectedPlan" 
                                    value={registerData.selectedPlan} 
                                    onChange={handleRegisterChange}
                                    className="form-input"
                                    style={{ width: '100%', borderColor: '#2563eb', fontWeight: '600' }}
                                >
                                    <option value="Starter (1-Year)">Starter (1-Year) - ₹600/mo</option>
                                    <option value="Professional (2-Year)">Professional (2-Year) - ₹500/mo</option>
                                    <option value="Enterprise (3-Year)">Enterprise (3-Year) - ₹400/mo</option>
                                </select>
                            </div>

                            {planDetails && (
                                <>
                                    <h3>Order Summary</h3>
                                    <div className="order-summary" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                                        <div className="summary-row" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: '600', color: '#2563eb' }}>{planDetails.name} Plan</span>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{planDetails.duration} Months</span>
                                        </div>
                                        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                                            <span>Subtotal</span>
                                            <span>₹{planDetails.subtotal}</span>
                                        </div>
                                        <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                                            <span>GST (18%)</span>
                                            <span>₹{planDetails.gst.toFixed(2)}</span>
                                        </div>
                                        <div className="summary-total" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', color: '#1a1a1a' }}>
                                            <span>Total</span>
                                            <span>₹{planDetails.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                </>
                            )}

                            <button type="submit" className="submit-btn" disabled={isSubmitting} style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '8px', background: isSubmitting ? '#94a3b8' : '#2563eb', border: 'none', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                                {isSubmitting ? 'Processing...' : (planDetails ? 'Submit payment' : 'Create Account')}
                            </button>

                            {isSubmitting && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
                                        <svg style={{ animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                                        </svg>
                                        <span style={{ fontWeight: '500' }}>Opening payment gateway...</span>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#3b82f6' }}>
                                        Please wait while we prepare your secure payment
                                    </p>
                                </div>
                            )}

                            {planDetails && (
                                <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                        </svg>
                                        <span>30-day money-back guarantee</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                                        No renewal surprises — your next renewal will be the same price.
                                    </p>
                                </div>
                            )}

                            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem', color: '#64748b' }}>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div >
    );
}

export default Auth;
