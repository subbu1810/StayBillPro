import React, { useState, useEffect } from 'react';
import '../styles/SettingsScreen.css';
import UsersRolesScreen from './UsersRolesScreen';
import { adminAuthAPI } from '../services/api';

const SettingsScreen = ({ defaultTab = 'profile' }) => {
    const [tab, setTab] = useState(defaultTab);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [corporateMessage, setCorporateMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        setTab(defaultTab);
    }, [defaultTab]);

    const [adminProfile, setAdminProfile] = useState({
        name: 'Super Admin',
        businessName: 'StayBill Electronics Pvt Ltd',
        email: 'admin@staybill.com',
        phone: '+91 98765 43210',
        designation: 'Managing Director',
        address: 'Sector 4, Corporate Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        businessType: 'Private Limited',
        gstn: '27AADCB1234F1Z1',
        avatar: '👨‍💼'
    });

    const [corporateInfo, setCorporateInfo] = useState({
        companyName: 'StayBill Electronics Pvt Ltd',
        gstin: '27AADCB1234F1Z1',
        address: 'Sector 4, Corporate Park, Mumbai - 400001',
        email: 'billing@staybill.com',
        phone: '+91 98765 43210',
        logo: '🧾'
    });

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

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await adminAuthAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setMessage({ type: '', text: '' });
            }, 2000);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBranding = async () => {
        setLoading(true);
        setCorporateMessage({ type: '', text: '' });

        try {
            const response = await adminAuthAPI.updateProfile({
                companyName: corporateInfo.companyName,
                gstin: corporateInfo.gstin,
                address: corporateInfo.address,
                email: corporateInfo.email,
                phone: corporateInfo.phone
            });

            setCorporateInfo(prev => ({
                ...prev,
                companyName: response.business_name || prev.companyName,
                gstin: response.gst_number || prev.gstin,
                address: response.address || prev.address,
                email: response.email || prev.email,
                phone: response.phone || prev.phone
            }));

            setCorporateMessage({ type: 'success', text: 'Branding updated successfully!' });
        } catch (err) {
            setCorporateMessage({ type: 'error', text: err.message || 'Failed to update branding' });
        } finally {
            setLoading(false);
            setTimeout(() => {
                setCorporateMessage({ type: '', text: '' });
            }, 3000);
        }
    };

    const renderAdminProfile = () => (
        <div className="settings-content-pane">
            <div className="pane-header-actions">
                <h3 className="pane-title">Personal Admin Profile</h3>
                <div className="action-buttons">
                    {!isEditing ? (
                        <button className="btn-edit-unlock" onClick={() => setIsEditing(true)}>
                            <span className="icon">📝</span> Edit Profile
                        </button>
                    ) : (
                        <>
                            <button className="btn-cancel-lock" onClick={() => setIsEditing(false)}>
                                ❌ Cancel
                            </button>
                            <button className="btn-primary" onClick={() => setIsEditing(false)}>
                                ✅ Save Changes
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="profile-hero-card">
                <div className="hero-avatar-section">
                    <div className="profile-avatar-large">{adminProfile.avatar}</div>
                    <button className="btn-avatar-edit">📸</button>
                </div>
                <div className="hero-details">
                    <h4>{adminProfile.name}</h4>
                    <p className="hero-designation">{adminProfile.designation} • {adminProfile.businessName}</p>
                    <div className="hero-badges">
                        <span className="badge-premium">⭐ Super Admin</span>
                        <span className="badge-verified">Verified Account</span>
                    </div>
                </div>
            </div>
            
            <div className="settings-card-grid">
                <div className="settings-info-card">
                    <div className="card-header">
                        <span className="card-icon">🆔</span>
                        <h5>Identity & Role</h5>
                    </div>
                    <div className="card-body multi-col">
                        <div className="form-group span-2">
                            <label>Full Name</label>
                            <input type="text" className="product-input" disabled={!isEditing} value={adminProfile.name} onChange={e => setAdminProfile({...adminProfile, name: e.target.value})} />
                        </div>
                        <div className="form-group span-2">
                            <label>Designation</label>
                            <input type="text" className="product-input" disabled={!isEditing} value={adminProfile.designation} onChange={e => setAdminProfile({...adminProfile, designation: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="settings-info-card">
                    <div className="card-header">
                        <span className="card-icon">🏢</span>
                        <h5>Business Context</h5>
                    </div>
                    <div className="card-body multi-col">
                        <div className="form-group span-2">
                            <label>Business Name</label>
                            <input type="text" className="product-input" disabled={!isEditing} value={adminProfile.businessName} onChange={e => setAdminProfile({...adminProfile, businessName: e.target.value})} />
                        </div>
                        <div className="form-group span-2">
                            <label>Business Type</label>
                            <select className="product-input" disabled={!isEditing} value={adminProfile.businessType} onChange={e => setAdminProfile({...adminProfile, businessType: e.target.value})}>
                                {BUSINESS_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="settings-info-card">
                    <div className="card-header">
                        <span className="card-icon">📞</span>
                        <h5>Contact Information</h5>
                    </div>
                    <div className="card-body multi-col">
                        <div className="form-group span-2">
                            <label>Email Address</label>
                            <input type="email" className="product-input" disabled={!isEditing} value={adminProfile.email} onChange={e => setAdminProfile({...adminProfile, email: e.target.value})} />
                        </div>
                        <div className="form-group span-2">
                            <label>Phone Number</label>
                            <input type="tel" className="product-input" disabled={!isEditing} value={adminProfile.phone} onChange={e => setAdminProfile({...adminProfile, phone: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="settings-info-card full-row">
                    <div className="card-header">
                        <span className="card-icon">📍</span>
                        <h5>Location & Presence</h5>
                    </div>
                    <div className="card-body multi-col">
                        <div className="form-group span-2">
                            <label>Office Address</label>
                            <input type="text" className="product-input" disabled={!isEditing} value={adminProfile.address} onChange={e => setAdminProfile({...adminProfile, address: e.target.value})} />
                        </div>
                        <div className="form-group span-1">
                            <label>City</label>
                            <input type="text" className="product-input" disabled={!isEditing} value={adminProfile.city} onChange={e => setAdminProfile({...adminProfile, city: e.target.value})} />
                        </div>
                        <div className="form-group span-1">
                            <label>State</label>
                            <select className="product-input" disabled={!isEditing} value={adminProfile.state} onChange={e => setAdminProfile({...adminProfile, state: e.target.value})}>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group span-2">
                            <label>Pincode</label>
                            <input type="text" className="product-input" disabled={!isEditing} value={adminProfile.pincode} onChange={e => setAdminProfile({...adminProfile, pincode: e.target.value})} />
                        </div>
                        <div className="form-group span-2">
                            <label>GSTN</label>
                            <input type="text" className="product-input" disabled={!isEditing} value={adminProfile.gstn} onChange={e => setAdminProfile({...adminProfile, gstn: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="settings-info-card">
                    <div className="card-header">
                        <span className="card-icon">🛡️</span>
                        <h5>Security & Access</h5>
                    </div>
                    <div className="card-body">
                        <p className="card-note">Manage your authentication methods and security settings.</p>
                        <button className="btn-secondary w-100" onClick={() => setShowPasswordModal(true)}>Change Password</button>
                    </div>
                </div>
            </div>

            {showPasswordModal && (
                <div className="branch-modal-overlay">
                    <div className="branch-modal">
                        <h3>🔒 Change Password</h3>
                        {message.text && (
                            <div className={`alert ${message.type}`} style={{ padding: '8px', marginBottom: '10px', borderRadius: '4px', fontSize: '0.8rem', background: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#991b1b' : '#166534' }}>
                                {message.text}
                            </div>
                        )}
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input type="password" className="product-input" required value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" className="product-input" required value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" className="product-input" required value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCorporateProfile = () => (
        <div className="settings-content-pane">
            <div className="pane-header-actions">
                <h3 className="pane-title">Corporate Business Identity</h3>
                <div className="action-buttons">
                    <button type="button" className="btn-primary" onClick={handleUpdateBranding} disabled={loading}>
                    {loading ? 'Updating Branding...' : '✅ Update Branding'}
                </button>
                </div>
            </div>

            {corporateMessage.text && (
                <div className={`alert ${corporateMessage.type}`} style={{ padding: '8px', marginBottom: '10px', borderRadius: '4px', fontSize: '0.9rem', background: corporateMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: corporateMessage.type === 'error' ? '#991b1b' : '#166534' }}>
                    {corporateMessage.text}
                </div>
            )}

            <div className="settings-card-grid">
                {/* Branding Card */}
                <div className="settings-info-card">
                    <div className="card-header">
                        <span className="card-icon">🏛️</span>
                        <h5>Branding & Identity</h5>
                    </div>
                    <div className="card-body">
                        <div className="logo-upload-section">
                            <div className="logo-preview-box">
                                <span className="logo-icon-large">{corporateInfo.logo}</span>
                            </div>
                            <div className="logo-upload-actions">
                                <button className="btn-secondary btn-small">Change Business Logo</button>
                                <p className="help-text">Recommended: 512x512 PNG/SVG</p>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Registered Business Name</label>
                            <input type="text" className="product-input" value={corporateInfo.companyName} onChange={e => setCorporateInfo({...corporateInfo, companyName: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* Tax & Compliance Card */}
                <div className="settings-info-card">
                    <div className="card-header">
                        <span className="card-icon">📜</span>
                        <h5>Tax & Compliance</h5>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>GSTIN (Goods & Services Tax Number)</label>
                            <input type="text" className="product-input" value={corporateInfo.gstin} onChange={e => setCorporateInfo({...corporateInfo, gstin: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Registration Number (Optional)</label>
                            <input type="text" className="product-input" placeholder="Enter Registration No." />
                        </div>
                    </div>
                </div>

                {/* Corporate Address Card */}
                <div className="settings-info-card full-row">
                    <div className="card-header">
                        <span className="card-icon">🏢</span>
                        <h5>Corporate Headquarters</h5>
                    </div>
                    <div className="card-body multi-col">
                        <div className="form-group span-2">
                            <label>Registered Office Address (for Invoices)</label>
                            <textarea className="product-input" style={{ minHeight: '80px' }} value={corporateInfo.address} onChange={e => setCorporateInfo({...corporateInfo, address: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Billing Email</label>
                            <input type="email" className="product-input" value={corporateInfo.email} onChange={e => setCorporateInfo({...corporateInfo, email: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Support Phone</label>
                            <input type="tel" className="product-input" value={corporateInfo.phone} onChange={e => setCorporateInfo({...corporateInfo, phone: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="settings-pane-container">
            {tab === 'profile' && renderAdminProfile()}
            {tab === 'corporate' && renderCorporateProfile()}
            {tab === 'users' && <div className="settings-content-pane full-width-pane"><UsersRolesScreen /></div>}
            {tab === 'security' && <div className="settings-content-pane">Security Settings Coming Soon</div>}
        </div>
    );
};

export default SettingsScreen;
