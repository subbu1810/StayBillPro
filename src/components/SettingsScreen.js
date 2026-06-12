import React, { useState, useEffect } from 'react';
import '../styles/SettingsScreen.css';
import UsersRolesScreen from './UsersRolesScreen';
import BarcodeSettingsScreen from './BarcodeSettingsScreen';
import { adminAuthAPI } from '../services/api';
import { API_CONFIG } from '../config/apiConfig';

const getSystemNameFromUserAgent = (userAgent) => {
    if (!userAgent) return 'Unknown System';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) return 'Mac OS';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown OS';
};

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

    const [adminProfile, setAdminProfile] = useState(() => {
        const userStr = localStorage.getItem('adminUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user) {
                    return {
                        name: user.admin_name || user.name || 'Admin',
                        businessName: user.business || 'StayBill Electronics Pvt Ltd',
                        email: user.email || '',
                        phone: user.phone || '',
                        designation: user.role || 'Managing Director',
                        address: user.address || '',
                        city: user.city || 'Mumbai',
                        state: user.state || 'Maharashtra',
                        pincode: user.pincode || '400001',
                        country: user.country || 'India',
                        businessType: user.business_type || 'Private Limited',
                        gstn: user.gst_number || '',
                        avatar: '👨‍💼'
                    };
                }
            } catch(e) {}
        }
        return {
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
        };
    });

    const [corporateInfo, setCorporateInfo] = useState(() => {
        const userStr = localStorage.getItem('adminUser');
        if (userStr) {
            try {
                const user = JSON.stringify(userStr) ? JSON.parse(userStr) : null;
                if (user) {
                    return {
                        companyName: user.business || 'Company Name',
                        gstin: user.gst_number || '',
                        address: user.address || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        logoBase64: user.logo_url || null,
                        bankName: user.bank_name || '',
                        bankAccount: user.bank_account || '',
                        ifscCode: user.ifsc_code || '',
                        upiId: user.upi_id || '',
                        logo: '🧾'
                    };
                }
            } catch(e) {}
        }
        return {
            companyName: 'StayBill Electronics Pvt Ltd',
            gstin: '27AADCB1234F1Z1',
            address: 'Sector 4, Corporate Park, Mumbai - 400001',
            email: 'billing@staybill.com',
            phone: '+91 98765 43210',
            bankName: '',
            bankAccount: '',
            ifscCode: '',
            upiId: '',
            logo: '🧾'
        };
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

    const handleUpdateAdminProfile = async () => {
        setLoading(true);
        try {
            const response = await adminAuthAPI.updateProfile({
                admin_name: adminProfile.name,
                business_name: adminProfile.businessName,
                email: adminProfile.email,
                phone: adminProfile.phone,
                role: adminProfile.designation,
                address: adminProfile.address,
                city: adminProfile.city,
                state: adminProfile.state,
                pincode: adminProfile.pincode,
                country: adminProfile.country,
                business_type: adminProfile.businessType,
                gst_number: adminProfile.gstn
            });
            
            // Update localStorage so it persists
            try {
                const userStr = localStorage.getItem('adminUser');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.admin_name = adminProfile.name;
                    user.business = adminProfile.businessName;
                    user.email = adminProfile.email;
                    user.phone = adminProfile.phone;
                    user.role = adminProfile.designation;
                    user.address = adminProfile.address;
                    user.city = adminProfile.city;
                    user.state = adminProfile.state;
                    user.pincode = adminProfile.pincode;
                    user.country = adminProfile.country;
                    user.business_type = adminProfile.businessType;
                    user.gst_number = adminProfile.gstn;
                    localStorage.setItem('adminUser', JSON.stringify(user));
                }
            } catch(e) { console.error('Error updating localStorage', e); }

            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update admin profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBranding = async () => {
        setLoading(true);
        setCorporateMessage({ type: '', text: '' });

        try {
            const response = await adminAuthAPI.updateProfile({
                business_name: corporateInfo.companyName,
                gst_number: corporateInfo.gstin,
                address: corporateInfo.address,
                email: corporateInfo.email,
                phone: corporateInfo.phone,
                logo_url: corporateInfo.logoBase64 || null,
                bank_name: corporateInfo.bankName,
                bank_account: corporateInfo.bankAccount,
                ifsc_code: corporateInfo.ifscCode,
                upi_id: corporateInfo.upiId
            });

            setCorporateInfo(prev => {
                const updated = {
                    ...prev,
                    companyName: response.business_name || prev.companyName,
                    gstin: response.gst_number || prev.gstin,
                    address: response.address || prev.address,
                    email: response.email || prev.email,
                    phone: response.phone || prev.phone,
                    logoBase64: response.logo_url !== undefined ? response.logo_url : prev.logoBase64,
                    bankName: response.bank_name !== undefined ? response.bank_name : prev.bankName,
                    bankAccount: response.bank_account !== undefined ? response.bank_account : prev.bankAccount,
                    ifscCode: response.ifsc_code !== undefined ? response.ifsc_code : prev.ifscCode,
                    upiId: response.upi_id !== undefined ? response.upi_id : prev.upiId
                };
                
                // Update localStorage so it persists across refreshes
                try {
                    const userStr = localStorage.getItem('adminUser');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        user.business = updated.companyName;
                        user.gst_number = updated.gstin;
                        user.address = updated.address;
                        user.email = updated.email;
                        user.phone = updated.phone;
                        user.logo_url = updated.logoBase64;
                        user.bank_name = updated.bankName;
                        user.bank_account = updated.bankAccount;
                        user.ifsc_code = updated.ifscCode;
                        user.upi_id = updated.upiId;
                        localStorage.setItem('adminUser', JSON.stringify(user));
                    }
                } catch(e) { console.error('Error updating localStorage', e); }
                
                return updated;
            });

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

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCorporateInfo(prev => ({
                    ...prev,
                    logoBase64: reader.result,
                    logo: '🖼️' // Show a temporary icon or image
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const renderAdminProfile = () => (
        <div className="settings-content-pane">
            <div className="pane-header-actions">
                <h3 className="pane-title">Account Settings</h3>
                <div className="action-buttons">
                    {!isEditing ? (
                        <button className="btn-edit-unlock" onClick={() => setIsEditing(true)}>
                            <span className="icon">📝</span> Edit Profile
                        </button>
                    ) : (
                        <>
                            <button className="btn-cancel-lock" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleUpdateAdminProfile} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="st-profile-layout">
                {/* Left Sidebar */}
                <div className="st-profile-sidebar">
                    <div className="st-avatar-wrapper">
                        <div className="st-avatar">{adminProfile.avatar}</div>
                        {isEditing && <button className="st-avatar-edit-btn">📸</button>}
                    </div>
                    <h2 className="st-profile-name">{adminProfile.name}</h2>
                    <p className="st-profile-role">{adminProfile.designation}</p>
                    <div className="st-badges">
                        <span className="st-badge primary">Super Admin</span>
                        <span className="st-badge success">Verified</span>
                    </div>
                </div>

                {/* Right Main Content */}
                <div className="st-profile-main">
                    <div className="st-form-section">
                        <h4 className="st-section-title">Identity & Role</h4>
                        <div className="st-form-row">
                            <div className="st-form-group">
                                <label>Full Name</label>
                                <input type="text" className="st-input" disabled={!isEditing} value={adminProfile.name} onChange={e => setAdminProfile({...adminProfile, name: e.target.value})} />
                            </div>
                            <div className="st-form-group">
                                <label>Designation</label>
                                <input type="text" className="st-input" disabled={!isEditing} value={adminProfile.designation} onChange={e => setAdminProfile({...adminProfile, designation: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="st-form-section">
                        <h4 className="st-section-title">Business Context</h4>
                        <div className="st-form-row">
                            <div className="st-form-group">
                                <label>Business Name</label>
                                <input type="text" className="st-input" disabled={!isEditing} value={adminProfile.businessName} onChange={e => setAdminProfile({...adminProfile, businessName: e.target.value})} />
                            </div>
                            <div className="st-form-group">
                                <label>Business Type</label>
                                <select className="st-input" disabled={!isEditing} value={adminProfile.businessType} onChange={e => setAdminProfile({...adminProfile, businessType: e.target.value})}>
                                    {BUSINESS_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="st-form-section">
                        <h4 className="st-section-title">Contact Information</h4>
                        <div className="st-form-row">
                            <div className="st-form-group">
                                <label>Email Address</label>
                                <input type="email" className="st-input" disabled={!isEditing} value={adminProfile.email} onChange={e => setAdminProfile({...adminProfile, email: e.target.value})} />
                            </div>
                            <div className="st-form-group">
                                <label>Phone Number</label>
                                <input type="tel" maxLength="10" className="st-input" disabled={!isEditing} value={adminProfile.phone} onChange={e => setAdminProfile({...adminProfile, phone: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="st-form-section">
                        <h4 className="st-section-title">Location</h4>
                        <div className="st-form-group full-width">
                            <label>Office Address</label>
                            <input type="text" className="st-input" disabled={!isEditing} value={adminProfile.address} onChange={e => setAdminProfile({...adminProfile, address: e.target.value})} />
                        </div>
                        <div className="st-form-row three-col">
                            <div className="st-form-group">
                                <label>City</label>
                                <input type="text" className="st-input" disabled={!isEditing} value={adminProfile.city} onChange={e => setAdminProfile({...adminProfile, city: e.target.value})} />
                            </div>
                            <div className="st-form-group">
                                <label>State</label>
                                <select className="st-input" disabled={!isEditing} value={adminProfile.state} onChange={e => setAdminProfile({...adminProfile, state: e.target.value})}>
                                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="st-form-group">
                                <label>Pincode</label>
                                <input type="text" className="st-input" disabled={!isEditing} value={adminProfile.pincode} onChange={e => setAdminProfile({...adminProfile, pincode: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="st-form-section">
                        <h4 className="st-section-title">Security</h4>
                        <div className="st-security-box">
                            <div>
                                <h5>Password</h5>
                                <p>Update your password to keep your account secure.</p>
                            </div>
                            <button className="btn-secondary" onClick={() => setShowPasswordModal(true)}>Change Password</button>
                        </div>
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

            <div className="st-profile-layout">
                <div className="st-profile-main">
                    
                    {/* Branding & Identity Section */}
                    <div className="st-form-section">
                        <h4 className="st-section-title">Branding & Identity</h4>
                        <div className="st-form-row">
                            <div className="st-form-group">
                                <label>Business Logo</label>
                                <div className="logo-upload-section" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                                    <div className="logo-preview-box" style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        {corporateInfo.logoBase64 ? <img src={corporateInfo.logoBase64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : corporateInfo.logo}
                                    </div>
                                    <div>
                                        <input type="file" id="logoUpload" accept="image/png, image/jpeg, image/svg+xml" style={{ display: 'none' }} onChange={handleLogoUpload} />
                                        <button className="btn-secondary btn-small" style={{ height: '32px', fontSize: '0.8rem', padding: '0 12px' }} onClick={() => document.getElementById('logoUpload').click()}>Change Logo</button>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Recommended: 512x512 PNG/SVG</p>
                                    </div>
                                </div>
                            </div>
                            <div className="st-form-group">
                                <label>Registered Business Name</label>
                                <input type="text" className="st-input" value={corporateInfo.companyName} onChange={e => setCorporateInfo({...corporateInfo, companyName: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Tax & Compliance Section */}
                    <div className="st-form-section">
                        <h4 className="st-section-title">Tax & Compliance</h4>
                        <div className="st-form-row">
                            <div className="st-form-group">
                                <label>GSTIN (Goods & Services Tax Number)</label>
                                <input type="text" className="st-input" value={corporateInfo.gstin} onChange={e => setCorporateInfo({...corporateInfo, gstin: e.target.value})} />
                            </div>
                            <div className="st-form-group">
                                <label>Registration Number (Optional)</label>
                                <input type="text" className="st-input" placeholder="Enter Registration No." />
                            </div>
                        </div>
                    </div>

                    {/* Corporate Headquarters Section */}
                    <div className="st-form-section">
                        <h4 className="st-section-title">Corporate Headquarters</h4>
                        <div className="st-form-group full-width">
                            <label>Registered Office Address (for Invoices)</label>
                            <input type="text" className="st-input" value={corporateInfo.address} onChange={e => setCorporateInfo({...corporateInfo, address: e.target.value})} />
                        </div>
                        <div className="st-form-row" style={{ marginTop: '16px' }}>
                            <div className="st-form-group">
                                <label>Billing Email</label>
                                <input type="email" className="st-input" value={corporateInfo.email} onChange={e => setCorporateInfo({...corporateInfo, email: e.target.value})} />
                            </div>
                            <div className="st-form-group">
                                <label>Support Phone</label>
                                <input type="tel" maxLength="10" className="st-input" value={corporateInfo.phone} onChange={e => setCorporateInfo({...corporateInfo, phone: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Payment Details Section */}
                    <div className="st-form-section">
                        <h4 className="st-section-title">Payment Details</h4>
                        <div className="st-form-group full-width">
                            <label>Bank Name</label>
                            <input type="text" className="st-input" value={corporateInfo.bankName} onChange={e => setCorporateInfo({...corporateInfo, bankName: e.target.value})} placeholder="Enter Bank Name" />
                        </div>
                        <div className="st-form-row" style={{ marginTop: '16px' }}>
                            <div className="st-form-group">
                                <label>Bank Account Number</label>
                                <input type="text" className="st-input" value={corporateInfo.bankAccount} onChange={e => setCorporateInfo({...corporateInfo, bankAccount: e.target.value})} placeholder="Enter Account Number" />
                            </div>
                            <div className="st-form-group">
                                <label>IFSC Code</label>
                                <input type="text" className="st-input" value={corporateInfo.ifscCode} onChange={e => setCorporateInfo({...corporateInfo, ifscCode: e.target.value})} placeholder="Enter IFSC Code" />
                            </div>
                        </div>
                        <div className="st-form-group full-width" style={{ marginTop: '16px' }}>
                            <label>UPI ID</label>
                            <input type="text" className="st-input" value={corporateInfo.upiId} onChange={e => setCorporateInfo({...corporateInfo, upiId: e.target.value})} placeholder="merchant@upi" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );

    const renderBarcodeSettings = () => {
        return (
            <div className="settings-content-pane">
                <BarcodeSettingsScreen />
            </div>
        );
    };

    const [downloadingBackup, setDownloadingBackup] = useState(false);
    const [backupMessage, setBackupMessage] = useState({ type: '', text: '' });
    const [backupLogs, setBackupLogs] = useState([]);

    useEffect(() => {
        if (tab === 'security') {
            fetchBackupLogs();
        }
    }, [tab]);

    const fetchBackupLogs = async () => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            const response = await fetch(`${API_CONFIG.BASE_URL}/backup/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBackupLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch backup logs", error);
        }
    };

    const handleDownloadBackup = async () => {
        setDownloadingBackup(true);
        setBackupMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            const response = await fetch(`${API_CONFIG.BASE_URL}/backup/download`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/';
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to download backup");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `StayBillPro_Backup_${new Date().toISOString().split('T')[0]}.sql`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            localStorage.removeItem('last_backup_date');
            setBackupMessage({ type: 'success', text: 'Database backup downloaded successfully!' });
        } catch (error) {
            console.error(error);
            setBackupMessage({ type: 'error', text: 'Failed to generate backup. Please try again.' });
        } finally {
            setDownloadingBackup(false);
            fetchBackupLogs(); // Refresh logs after download
        }
    };

    const renderSecuritySettings = () => (
        <div className="settings-content-pane">
            <div className="pane-header-actions">
                <h3 className="pane-title">Security & Data Management</h3>
            </div>

            {backupMessage.text && (
                <div className={`alert ${backupMessage.type}`} style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', fontSize: '0.9rem', background: backupMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: backupMessage.type === 'error' ? '#991b1b' : '#166534', border: `1px solid ${backupMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}` }}>
                    {backupMessage.text}
                </div>
            )}

            <div className="st-profile-layout">
                <div className="st-profile-main">
                    <div className="st-form-section">
                        <h4 className="st-section-title">Database Backup</h4>
                        <div className="st-security-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div>
                                <h5 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#0f172a' }}>Manual Database Backup</h5>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Download a complete snapshot of your StayBillPro database securely.</p>
                            </div>
                            <button 
                                className="btn-primary" 
                                onClick={handleDownloadBackup} 
                                disabled={downloadingBackup}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', whiteSpace: 'nowrap' }}
                            >
                                {downloadingBackup ? 'Generating...' : '📥 Download Backup'}
                            </button>
                        </div>

                        <h4 className="st-section-title" style={{ marginTop: '30px' }}>Recent Backup Logs</h4>
                        <div className="st-table-container">
                            <table className="st-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>System Info</th>
                                        <th>IP Address</th>
                                        <th>File Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backupLogs.length > 0 ? (
                                        backupLogs.map(log => (
                                            <tr key={log.id}>
                                                <td>{new Date(log.download_time).toLocaleString()}</td>
                                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.system_info}>
                                                    {getSystemNameFromUserAgent(log.system_info)}
                                                </td>
                                                <td>{log.ip_address}</td>
                                                <td>{log.file_name}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No backup logs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
            {tab === 'security' && renderSecuritySettings()}
            {tab === 'barcode' && renderBarcodeSettings()}
        </div>
    );
};

export default SettingsScreen;
