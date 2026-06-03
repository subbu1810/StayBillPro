import React, { useState, useEffect } from 'react';
import '../styles/StaffScreen.css';
import { staffAPI, branchesAPI } from '../services/api';

const StaffScreen = ({ defaultTab = 'manage' }) => {
    const [staff, setStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newStaff, setNewStaff] = useState({
        admin_name: '',
        email: '',
        phone: '',
        password: '',
        branch_id: '',
        permissions: ['dashboard']
    });

    const AVAILABLE_SCREENS = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Main' },
        { id: 'pos', label: 'Quick Sale (POS)', icon: '⚡', group: 'Sales' },
        
        // Jobs
        { id: 'jobs', label: 'Service Jobs List', icon: '📋', group: 'Jobs' },
        { id: 'jobs-new', label: 'Create New Job', icon: '➕', group: 'Jobs' },
        { id: 'jobs-calendar', label: 'Jobs Calendar', icon: '📅', group: 'Jobs' },
        { id: 'jobs-invoicing', label: 'Job Invoicing', icon: '🧾', group: 'Jobs' },
        
        // Inventory
        { id: 'inventory-sales', label: 'Showroom Stock', icon: '🏬', group: 'Inventory' },
        { id: 'inventory-service', label: 'Service Stock List', icon: '🔧', group: 'Inventory' },
        { id: 'inventory-service-log', label: 'Service Stock Log', icon: '📜', group: 'Inventory' },
        
        // CRM & Suppliers
        { id: 'customers', label: 'Customer CRM', icon: '👥', group: 'Contacts' },
        { id: 'suppliers', label: 'Suppliers List', icon: '🏭', group: 'Contacts' },
        { id: 'technicians', label: 'Technicians List', icon: '👨‍🔧', group: 'Contacts' },
        
        // Staff
        { id: 'staff-manage', label: 'Staff Directory', icon: '👮', group: 'Staff' },
        { id: 'staff-roles', label: 'Roles & Access', icon: '🛡️', group: 'Staff' },
        { id: 'staff-attendance', label: 'Attendance', icon: '🕒', group: 'Staff' },
        { id: 'staff-salary', label: 'Payroll & Salary', icon: '💰', group: 'Staff' },
        
        // Branch
        { id: 'branch-manage', label: 'Manage Branches', icon: '🏢', group: 'Branch' },
        { id: 'branch-transfer', label: 'Stock Transfer', icon: '🚚', group: 'Branch' },
        { id: 'branch-consolidated', label: 'Group Reports', icon: '📊', group: 'Branch' },
        
        // Accounting
        { id: 'accounting-ledger', label: 'Ledger', icon: '⚖️', group: 'Accounting' },
        { id: 'accounting-gst', label: 'GST Reports', icon: '📜', group: 'Accounting' },
        { id: 'accounting-expenses', label: 'Expenses', icon: '💸', group: 'Accounting' },
        { id: 'accounting-pl', label: 'Profit & Loss', icon: '📈', group: 'Accounting' },
        
        // Settings
        { id: 'settings-profile', label: 'Admin Profile', icon: '👤', group: 'Settings' },
        { id: 'settings-corporate', label: 'Corporate Profile', icon: '🏢', group: 'Settings' },
        { id: 'settings-users', label: 'Users & Access', icon: '👥', group: 'Settings' },
        { id: 'settings-security', label: 'Security Config', icon: '⚙️', group: 'Settings' }
    ];
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        
        // Fetch Staff
        try {
            const staffData = await staffAPI.getAll();
            setStaff(Array.isArray(staffData) ? staffData : []);
        } catch (error) {
            console.error("Staff Fetch Error:", error);
        }

        // Fetch Branches
        try {
            const branchData = await branchesAPI.getAll();
            setBranches(Array.isArray(branchData) ? branchData : []);
        } catch (error) {
            console.error("Branch Fetch Error:", error);
        }

        setLoading(false);
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!newStaff.branch_id) {
            alert("Please select a branch for this staff member.");
            return;
        }
        setIsSubmitting(true);
        try {
            await staffAPI.create(newStaff);
            setShowModal(false);
            setNewStaff({ admin_name: '', email: '', phone: '', password: '', branch_id: '', permissions: ['dashboard'] });
            fetchData();
        } catch (error) {
            alert("Error creating staff: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderManageStaff = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <input type="text" placeholder="Search Staff Member..." className="search-input" />
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Employee</button>
            </div>
            <table className="crm-table single-line-table" style={{ minWidth: '1000px' }}>
                <thead>
                    <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th>Contact</th>
                        <th>Daily Sales</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="7">Loading staff...</td></tr>
                    ) : staff.length > 0 ? (
                        staff.map(s => (
                            <tr key={s.id}>
                                <td>#STF-00{s.id}</td>
                                <td style={{ fontWeight: 'bold' }}>{s.admin_name}</td>
                                <td><span className="method-pill">{s.role}</span></td>
                                <td><span className="status-pill success">{s.branch_name || 'All Branches'}</span></td>
                                <td>{s.email} <br/> <small>{s.phone}</small></td>
                                <td>₹0</td>
                                <td>
                                    <button className="btn-icon">✏️</button>
                                    <button className="btn-icon" onClick={() => {
                                        if(window.confirm('Remove this staff member?')) {
                                            staffAPI.delete(s.id).then(() => fetchData());
                                        }
                                    }}>🗑️</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="7">No staff members found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderRoles = () => (
        <div className="crm-content">
            <h3 className="section-title">Roles & Access Control</h3>
            <div className="crm-grid-3">
                {['Admin', 'Manager', 'Technician', 'Sales Executive'].map(role => (
                    <div key={role} className="report-card">
                        <div className="card-header">
                            <span className="card-title">{role}</span>
                            <button className="btn-icon">⚙️</button>
                        </div>
                        <div className="card-value" style={{ fontSize: '0.9rem' }}>Full Access</div>
                        <div className="card-trend grey">12 Permissions Enabled</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAttendance = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <input type="date" className="search-input" />
                <button className="btn-secondary">Mark All Present</button>
            </div>
            <table className="crm-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Work Hours</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {staff.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>09:00 AM</td>
                            <td>06:30 PM</td>
                            <td>9.5 Hrs</td>
                            <td><span className="method-pill success">On-Time</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderSalary = () => (
        <div className="crm-content">
            <div className="crm-grid-4">
                <div className="report-card">
                    <span className="card-title">Total Payroll</span>
                    <div className="card-value">₹1,05,000</div>
                </div>
                <div className="report-card">
                    <span className="card-title">Pending Salaries</span>
                    <div className="card-value warning">₹25,000</div>
                </div>
            </div>
            <table className="crm-table" style={{ marginTop: '12px' }}>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Base Salary</th>
                        <th>Allowances</th>
                        <th>Deductions</th>
                        <th>Net Payable</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {staff.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>₹{s.salary}</td>
                            <td>₹2,500</td>
                            <td>₹500</td>
                            <td style={{ fontWeight: 'bold' }}>₹{s.salary + 2000}</td>
                            <td><button className="btn-small">Pay Now</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const getTitle = () => {
        if (defaultTab === 'manage') return 'Staff Directory';
        if (defaultTab === 'roles') return 'Roles & Permissions';
        if (defaultTab === 'attendance') return 'Attendance Tracking';
        if (defaultTab === 'salary') return 'Payroll & Salary';
        return 'Management';
    };

    return (
        <div className="staff-screen">
            <div className="admin-content-header" style={{ marginBottom: '12px' }}>
                <h2 className="screen-title" style={{ fontSize: '1rem', fontWeight: '800' }}>
                    👥 {getTitle()}
                </h2>
            </div>

            {defaultTab === 'manage' && renderManageStaff()}
            {defaultTab === 'roles' && renderRoles()}
            {defaultTab === 'attendance' && renderAttendance()}
            {defaultTab === 'salary' && renderSalary()}

            {/* Add Staff Modal */}
            {showModal && (
                <div className="premium-modal-overlay">
                    <div className="premium-full-modal">
                        <h3>Add New Staff Member</h3>
                        <form onSubmit={handleCreateStaff}>
                            <div className="premium-form-grid">
                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Full Name *</label>
                                    <input 
                                        type="text" 
                                        className="premium-input"
                                        required 
                                        value={newStaff.admin_name} 
                                        onChange={e => setNewStaff({...newStaff, admin_name: e.target.value})}
                                        placeholder="Enter employee name"
                                    />
                                </div>
                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Email (Login ID) *</label>
                                    <input 
                                        type="email" 
                                        className="premium-input"
                                        required 
                                        value={newStaff.email} 
                                        onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Phone Number *</label>
                                    <input 
                                        type="tel" 
                                        className="premium-input"
                                        required 
                                        value={newStaff.phone} 
                                        onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                                        placeholder="+91..."
                                    />
                                </div>
                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Login Password *</label>
                                    <input 
                                        type="password" 
                                        className="premium-input"
                                        required 
                                        value={newStaff.password} 
                                        onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                                        placeholder="Create temporary password"
                                    />
                                </div>
                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Assign to Branch *</label>
                                    <select 
                                        required 
                                        value={newStaff.branch_id} 
                                        onChange={e => setNewStaff({...newStaff, branch_id: e.target.value})}
                                        className="premium-input"
                                    >
                                        <option value="">{branches.length > 0 ? 'Select Branch' : '⚠️ No branches found'}</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="full-span">
                                    <label className="premium-input-label">Screen Assignment (Permissions)</label>
                                    <div className="permissions-container">
                                        {Object.entries(
                                            AVAILABLE_SCREENS.reduce((acc, screen) => {
                                                const group = screen.group || 'Other';
                                                if (!acc[group]) acc[group] = [];
                                                acc[group].push(screen);
                                                return acc;
                                            }, {})
                                        ).map(([group, screens]) => (
                                            <div key={group} style={{ marginBottom: '16px' }}>
                                                <div className="permission-group-header">{group}</div>
                                                <div className="permission-grid">
                                                    {screens.map(screen => (
                                                        <label 
                                                            key={screen.id} 
                                                            className={`permission-item ${newStaff.permissions.includes(screen.id) ? 'selected' : ''}`}
                                                        >
                                                            <input 
                                                                type="checkbox" 
                                                                checked={newStaff.permissions.includes(screen.id)}
                                                                onChange={() => {
                                                                    const current = [...newStaff.permissions];
                                                                    if (current.includes(screen.id)) {
                                                                        setNewStaff({ ...newStaff, permissions: current.filter(id => id !== screen.id) });
                                                                    } else {
                                                                        setNewStaff({ ...newStaff, permissions: [...current, screen.id] });
                                                                    }
                                                                }}
                                                            />
                                                            <span>{screen.icon} {screen.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-premium-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-premium-save" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Staff Login'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffScreen;
