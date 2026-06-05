import React, { useState, useEffect } from 'react';
import '../styles/StaffScreen.css';
import '../styles/SettingsScreen.css';
import { staffAPI, branchesAPI, staffManagementAPI } from '../services/api';
import UsersRolesScreen from './UsersRolesScreen';

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
        base_salary: '',
        permissions: ['dashboard']
    });

    const AVAILABLE_SCREENS = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', group: 'Main' },

        // Sales (POS)
        { id: 'pos-billing', label: 'Create Invoice', icon: '💳', group: 'Sales (POS)' },
        { id: 'pos-returns', label: 'Returns & Refunds', icon: '↩️', group: 'Sales (POS)' },
        { id: 'invoice-history', label: 'Invoice History', icon: '📋', group: 'Sales (POS)' },
        
        // Jobs
        { id: 'jobs', label: 'Active Jobs List', icon: '📋', group: 'Service Jobs' },
        { id: 'jobs-new', label: 'Create New Job', icon: '➕', group: 'Service Jobs' },
        { id: 'jobs-calendar', label: 'Service Calendar', icon: '📅', group: 'Service Jobs' },
        { id: 'jobs-invoicing', label: 'Invoicing Hub', icon: '🧾', group: 'Service Jobs' },
        
        // Store Stock
        { id: 'inventory-sales-stock', label: 'Current Stock', icon: '📦', group: 'Store Stock' },
        { id: 'inventory-sales-categories', label: 'Categories', icon: '🏷️', group: 'Store Stock' },
        { id: 'inventory-sales-ledger', label: 'Stock Log', icon: '📜', group: 'Store Stock' },

        // Service Stock
        { id: 'inventory-service', label: 'Spare Parts List', icon: '🔧', group: 'Service Stock' },
        { id: 'inventory-service-log', label: 'Service Stock Log', icon: '📜', group: 'Service Stock' },
        
        // Customer CRM
        { id: 'customers-manage', label: 'Manage Customers', icon: '📑', group: 'Customer CRM' },
        { id: 'customers-ledger', label: 'Customer Ledger', icon: '⚖️', group: 'Customer CRM' },
        { id: 'customers-dues', label: 'Outstanding Dues', icon: '💸', group: 'Customer CRM' },
        { id: 'customers-payments', label: 'Payment History', icon: '💳', group: 'Customer CRM' },
        { id: 'customers-orders', label: 'Order History', icon: '🛒', group: 'Customer CRM' },
        { id: 'customers-returns', label: 'Return History', icon: '🔄', group: 'Customer CRM' },

        // Suppliers
        { id: 'suppliers-manage', label: 'Manage Supplier', icon: '📑', group: 'Suppliers' },
        { id: 'suppliers-ledger', label: 'Ledger', icon: '⚖️', group: 'Suppliers' },
        { id: 'suppliers-payables', label: 'Payables', icon: '💸', group: 'Suppliers' },
        { id: 'suppliers-payments', label: 'Payments', icon: '💳', group: 'Suppliers' },
        { id: 'suppliers-purchases', label: 'Purchase History', icon: '📦', group: 'Suppliers' },

        // Technicians
        { id: 'technicians', label: 'Technicians List', icon: '👨‍🔧', group: 'Technicians' },
        
        // Staff
        { id: 'staff-manage', label: 'Staff Directory', icon: '👮', group: 'Staff Management' },
        { id: 'staff-roles', label: 'Roles & Access', icon: '🛡️', group: 'Staff Management' },
        { id: 'staff-attendance', label: 'Attendance Tracking', icon: '🕒', group: 'Staff Management' },
        { id: 'staff-salary', label: 'Payroll & Salary', icon: '💰', group: 'Staff Management' },
        
        // Purchase
        { id: 'purchase-po', label: 'Purchase Orders', icon: '📜', group: 'Purchase Management' },
        { id: 'purchase-grn', label: 'GRN / Receiving', icon: '📥', group: 'Purchase Management' },
        { id: 'purchase-due', label: 'Due Tracking', icon: '💸', group: 'Purchase Management' },

        // Reports
        { id: 'reports-sales', label: 'Sales Report', icon: '📊', group: 'Insight Reports' },
        { id: 'reports-expenses', label: 'Expense Report', icon: '💸', group: 'Insight Reports' },
        { id: 'reports-profit', label: 'Profit Report', icon: '💰', group: 'Insight Reports' },
        { id: 'reports-stock', label: 'Stock Report', icon: '📦', group: 'Insight Reports' },
        { id: 'reports-topCustomers', label: 'Top Customers', icon: '⭐', group: 'Insight Reports' },

        // Branch
        { id: 'branch-manage', label: 'Manage Branches', icon: '🏘️', group: 'Multi-Branch Hub' },
        { id: 'branch-transfer', label: 'Stock Transfer', icon: '🚚', group: 'Multi-Branch Hub' },
        { id: 'branch-consolidated', label: 'Group Reports', icon: '📊', group: 'Multi-Branch Hub' },
        
        // Accounting
        { id: 'accounting-ledger', label: 'Ledger & Cashbook', icon: '⚖️', group: 'Accounting Hub' },
        { id: 'accounting-gst', label: 'GST Filling Report', icon: '📜', group: 'Accounting Hub' },
        { id: 'accounting-expenses', label: 'Business Expenses', icon: '💸', group: 'Accounting Hub' },
        { id: 'accounting-pl', label: 'Profit & Loss', icon: '📈', group: 'Accounting Hub' },
        
        // Settings
        { id: 'settings-profile', label: 'Admin Profile', icon: '👤', group: 'Settings & Config' },
        { id: 'settings-corporate', label: 'Corporate Profile', icon: '🏢', group: 'Settings & Config' },
        { id: 'settings-users', label: 'Users & Access', icon: '👥', group: 'Settings & Config' },
        { id: 'settings-security', label: 'Security Config', icon: '🛡️', group: 'Settings & Config' },
        { id: 'settings-barcode', label: 'Barcode Printer', icon: '🖨️', group: 'Settings & Config' },
        { id: 'pos-settings', label: 'POS Config', icon: '⚙️', group: 'Settings & Config' }
    ];
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Attendance state
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceList, setAttendanceList] = useState([]);
    
    // Payroll state
    const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
    const [payrollList, setPayrollList] = useState([]);

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

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const res = await staffManagementAPI.getAttendance(attendanceDate);
            if (res.success) setAttendanceList(res.attendance);
        } catch (err) {
            setError("Error fetching attendance: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const res = await staffManagementAPI.getPayroll(payrollMonth);
            if (res.success) setPayrollList(res.payroll);
        } catch (err) {
            setError("Error fetching payroll: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (defaultTab === 'attendance') fetchAttendance();
    }, [defaultTab, attendanceDate]);

    useEffect(() => {
        if (defaultTab === 'salary') fetchPayroll();
    }, [defaultTab, payrollMonth]);

    const toggleGroupPermissions = (screens, isAllChecked) => {
        const screenIds = screens.map(s => s.id);
        let current = [...newStaff.permissions];
        if (isAllChecked) {
            current = current.filter(id => !screenIds.includes(id));
        } else {
            current = Array.from(new Set([...current, ...screenIds]));
        }
        setNewStaff({ ...newStaff, permissions: current });
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
            setNewStaff({ admin_name: '', email: '', phone: '', password: '', branch_id: '', base_salary: '', permissions: ['dashboard'] });
            setSuccess('Staff login account created successfully!');
            setTimeout(() => setSuccess(null), 4000);
            fetchData();
        } catch (err) {
            setError("Error creating staff: " + err.message);
            setTimeout(() => setError(null), 4000);
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
                                            staffAPI.delete(s.id).then(() => {
                                                setSuccess('Staff member removed successfully!');
                                                setTimeout(() => setSuccess(null), 4000);
                                                fetchData();
                                            }).catch(err => {
                                                setError('Failed to remove staff: ' + err.message);
                                                setTimeout(() => setError(null), 4000);
                                            });
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
        <div className="crm-content" style={{ padding: '0', background: 'transparent', boxShadow: 'none' }}>
            <UsersRolesScreen />
        </div>
    );

    const renderAttendance = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <input 
                    type="date" 
                    className="search-input" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                />
                <button 
                    className="btn-secondary"
                    onClick={async () => {
                        try {
                            setLoading(true);
                            await staffManagementAPI.markAllPresent(attendanceDate);
                            setSuccess('All staff marked as present!');
                            setTimeout(() => setSuccess(null), 3000);
                            fetchAttendance();
                        } catch (err) {
                            setError('Error marking all present: ' + err.message);
                            setTimeout(() => setError(null), 3000);
                            setLoading(false);
                        }
                    }}
                >
                    Mark All Present
                </button>
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
                    {loading ? (
                        <tr><td colSpan="5">Loading attendance...</td></tr>
                    ) : attendanceList.length > 0 ? (
                        attendanceList.map(a => (
                            <tr key={a.staff_id}>
                                <td>{a.name}</td>
                                <td>{a.check_in}</td>
                                <td>{a.check_out}</td>
                                <td>{a.work_hours} Hrs</td>
                                <td><span className={`method-pill ${a.status === 'Present' ? 'success' : 'warning'}`}>{a.status}</span></td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="5">No attendance records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderSalary = () => {
        const totalPayroll = payrollList.reduce((acc, p) => acc + Number(p.net_payable), 0);
        const pendingPayroll = payrollList.filter(p => p.status === 'Pending').reduce((acc, p) => acc + Number(p.net_payable), 0);
        
        return (
            <div className="crm-content">
                <div className="crm-filters" style={{ marginBottom: '16px' }}>
                    <input 
                        type="month" 
                        className="search-input" 
                        value={payrollMonth}
                        onChange={(e) => setPayrollMonth(e.target.value)}
                    />
                </div>
                <div className="crm-grid-4">
                    <div className="report-card">
                        <span className="card-title">Total Payroll</span>
                        <div className="card-value">₹{totalPayroll.toLocaleString()}</div>
                    </div>
                    <div className="report-card">
                        <span className="card-title">Pending Salaries</span>
                        <div className="card-value warning">₹{pendingPayroll.toLocaleString()}</div>
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
                        {loading ? (
                            <tr><td colSpan="6">Loading payroll data...</td></tr>
                        ) : payrollList.length > 0 ? (
                            payrollList.map(p => (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>₹{Number(p.base_salary).toLocaleString()}</td>
                                    <td>₹{Number(p.allowances).toLocaleString()}</td>
                                    <td>₹{Number(p.deductions).toLocaleString()}</td>
                                    <td style={{ fontWeight: 'bold' }}>₹{Number(p.net_payable).toLocaleString()}</td>
                                    <td>
                                        {p.status === 'Paid' ? (
                                            <span className="status-pill success">Paid</span>
                                        ) : (
                                            <button 
                                                className="btn-small"
                                                onClick={async () => {
                                                    try {
                                                        await staffManagementAPI.processPayment({
                                                            staff_id: p.staff_id,
                                                            month: payrollMonth,
                                                            base_salary: p.base_salary,
                                                            allowances: p.allowances,
                                                            deductions: p.deductions,
                                                            net_payable: p.net_payable
                                                        });
                                                        setSuccess('Salary processed successfully!');
                                                        setTimeout(() => setSuccess(null), 3000);
                                                        fetchPayroll();
                                                    } catch (err) {
                                                        setError('Error processing salary: ' + err.message);
                                                        setTimeout(() => setError(null), 3000);
                                                    }
                                                }}
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6">No payroll records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

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
            {success && (
                <div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', animation: 'slideIn 0.3s ease' }}>
                    <span>✅</span> {success}
                </div>
            )}
            {error && (
                <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', animation: 'slideIn 0.3s ease' }}>
                    <span>⚠️</span> {error}
                </div>
            )}

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
                                    <label className="premium-input-label">Base Salary (₹)</label>
                                    <input 
                                        type="number" 
                                        className="premium-input"
                                        value={newStaff.base_salary} 
                                        onChange={e => setNewStaff({...newStaff, base_salary: e.target.value})}
                                        placeholder="0.00"
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
                                        ).map(([group, screens]) => {
                                            const groupScreenIds = screens.map(s => s.id);
                                            const isAllChecked = groupScreenIds.every(id => newStaff.permissions.includes(id));
                                            const isSomeChecked = !isAllChecked && groupScreenIds.some(id => newStaff.permissions.includes(id));
                                            return (
                                                <div key={group} className="permission-group-card">
                                                    <div className="permission-group-header">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isAllChecked}
                                                            ref={el => {
                                                                if (el) el.indeterminate = isSomeChecked;
                                                            }}
                                                            onChange={() => toggleGroupPermissions(screens, isAllChecked)}
                                                            style={{ marginRight: '8px', cursor: 'pointer', width: '15px', height: '15px' }}
                                                        />
                                                        <span>{group}</span>
                                                    </div>
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
                                            );
                                        })}
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
