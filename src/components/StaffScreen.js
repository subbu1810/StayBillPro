import React, { useState, useEffect } from 'react';
import '../styles/StaffScreen.css';
import '../styles/SettingsScreen.css';
import { staffAPI, branchesAPI, staffManagementAPI } from '../services/api';
import UsersRolesScreen from './UsersRolesScreen';
import { usePopup } from './ui/PopupProvider';

const StaffScreen = ({ defaultTab = 'manage' }) => {
    const popup = usePopup();
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
        { id: 'pos-billing', label: 'POS', icon: '💳', group: 'Sales (POS)' },
        { id: 'pos-wholesale', label: 'Wholesale Bill', icon: '📦', group: 'Sales (POS)' },
        { id: 'pos-returns', label: 'Returns & Refunds', icon: '↩️', group: 'Sales (POS)' },
        { id: 'invoice-history', label: 'POS History', icon: '📋', group: 'Sales (POS)' },
        { id: 'wholesale-history', label: 'Wholesale History', icon: '📦', group: 'Sales (POS)' },
        
        // Jobs
        { id: 'jobs', label: 'Active Jobs List', icon: '📋', group: 'Service Jobs' },
        { id: 'jobs-new', label: 'Create New Job', icon: '➕', group: 'Service Jobs' },
        { id: 'jobs-calendar', label: 'Service Calendar', icon: '📅', group: 'Service Jobs' },
        { id: 'jobs-invoicing', label: 'Invoicing Hub', icon: '🧾', group: 'Service Jobs' },
        
        // Store Stock
        { id: 'inventory-sales-stock', label: 'Current Stock', icon: '📦', group: 'Store Stock' },
        { id: 'inventory-sales-expiry', label: 'Expiry Monitor', icon: '⏳', group: 'Store Stock' },
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
        { id: 'staff-history', label: 'Payment History', icon: '📜', group: 'Staff Management' },
        
        // Purchase
        { id: 'purchase-po', label: 'Purchase Orders', icon: '📜', group: 'Purchase Management' },
        { id: 'purchase-grn', label: 'GRN / Receiving', icon: '📥', group: 'Purchase Management' },
        { id: 'purchase-due', label: 'Due Tracking', icon: '💸', group: 'Purchase Management' },
        { id: 'purchase-returns', label: 'Damaged / Returns', icon: '↩️', group: 'Purchase Management' },

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

    // Payment History state
    const [historyList, setHistoryList] = useState([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historySearch, setHistorySearch] = useState('');
    const [historyFromMonth, setHistoryFromMonth] = useState('');
    const [historyToMonth, setHistoryToMonth] = useState('');

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultTab, attendanceDate]);

    useEffect(() => {
        if (defaultTab === 'salary') fetchPayroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultTab, payrollMonth]);

    const fetchPayrollHistory = async (params = {}) => {
        try {
            setLoading(true);
            const res = await staffManagementAPI.getPayrollHistory(params);
            if (res.success) {
                setHistoryList(res.history);
                setHistoryTotal(res.totalDisbursed);
            }
        } catch (err) {
            setError('Error fetching history: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (defaultTab === 'history') fetchPayrollHistory();
    }, [defaultTab]);

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
            popup.showError("Please select a branch for this staff member.");
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
                                    <button className="btn-icon" onClick={async () => {
                                        const ok = await popup.confirm('Remove this staff member?');
                                        if(ok) {
                                            staffAPI.delete(s.id).then(() => {
                                                popup.showSuccess('Staff member removed successfully!');
                                                fetchData();
                                            }).catch(err => {
                                                popup.showError('Failed to remove staff: ' + err.message);
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

    const handleAttendanceChange = (staffId, field, value) => {
        setAttendanceList(prev => prev.map(a => 
            a.staff_id === staffId ? { ...a, [field]: value } : a
        ));
    };

    const handleSaveAttendance = async (record) => {
        try {
            setLoading(true);
            await staffManagementAPI.updateAttendance({
                staff_id: record.staff_id,
                date: attendanceDate,
                status: record.status,
                check_in: record.check_in,
                check_out: record.check_out
            });
            setSuccess(`Attendance saved for ${record.name}`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Error saving attendance: ' + err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

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
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5">Loading attendance...</td></tr>
                    ) : attendanceList.length > 0 ? (
                        attendanceList.map(a => (
                            <tr key={a.staff_id}>
                                <td style={{ fontWeight: '500' }}>{a.name}</td>
                                <td>
                                    <input 
                                        type="time" 
                                        className="premium-input"
                                        style={{ width: '120px', padding: '4px 8px', margin: 0 }}
                                        value={a.check_in}
                                        onChange={(e) => handleAttendanceChange(a.staff_id, 'check_in', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="time" 
                                        className="premium-input"
                                        style={{ width: '120px', padding: '4px 8px', margin: 0 }}
                                        value={a.check_out}
                                        onChange={(e) => handleAttendanceChange(a.staff_id, 'check_out', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <select 
                                        className="premium-input"
                                        style={{ width: '130px', padding: '4px 8px', margin: 0 }}
                                        value={a.status}
                                        onChange={(e) => handleAttendanceChange(a.staff_id, 'status', e.target.value)}
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Half-Day">Half-Day</option>
                                        <option value="Leave">Leave</option>
                                    </select>
                                </td>
                                <td>
                                    <button 
                                        className="btn-primary"
                                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                        onClick={() => handleSaveAttendance(a)}
                                    >
                                        Save
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="5">No attendance records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const handlePayrollChange = (staffId, field, value) => {
        setPayrollList(prev => prev.map(p => {
            if (p.staff_id === staffId) {
                const updated = { ...p, [field]: value };
                const base = Number(updated.base_salary) || 0;
                const allow = Number(updated.allowances) || 0;
                const deduc = Number(updated.deductions) || 0;
                updated.net_payable = base + allow - deduc;
                return updated;
            }
            return p;
        }));
    };

    const handleSavePayrollDraft = async (record) => {
        try {
            setLoading(true);
            await staffManagementAPI.savePayrollDraft({
                staff_id: record.staff_id,
                month: payrollMonth,
                base_salary: record.base_salary,
                allowances: record.allowances,
                deductions: record.deductions,
                net_payable: record.net_payable
            });
            setSuccess(`Payroll draft saved for ${record.name}`);
            setTimeout(() => setSuccess(null), 3000);
            fetchPayroll();
        } catch (err) {
            setError('Error saving payroll draft: ' + err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const renderSalary = () => {
        const totalPayroll = payrollList.reduce((acc, p) => acc + Number(p.net_payable), 0);
        const pendingCount = payrollList.filter(p => p.status === 'Pending').length;
        const paidCount = payrollList.filter(p => p.status === 'Paid').length;
        const pendingPayroll = payrollList.filter(p => p.status === 'Pending').reduce((acc, p) => acc + Number(p.net_payable), 0);
        
        const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'S';

        return (
            <div className="crm-content">
                {/* ── Header Row ── */}
                <div className="payroll-header">
                    <div className="payroll-month-selector">
                        <label>Month</label>
                        <input 
                            type="month" 
                            className="payroll-month-input"
                            value={payrollMonth}
                            onChange={(e) => setPayrollMonth(e.target.value)}
                        />
                    </div>
                    <div className="payroll-stats">
                        <div className="payroll-stat-chip">
                            <span className="stat-label">Total Payroll</span>
                            <span className="stat-value">₹{totalPayroll.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="payroll-stat-chip">
                            <span className="stat-label">Pending</span>
                            <span className="stat-value orange">₹{pendingPayroll.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="payroll-stat-chip">
                            <span className="stat-label">Employees</span>
                            <span className="stat-value">{paidCount} / {paidCount + pendingCount}</span>
                        </div>
                    </div>
                </div>

                {/* ── Salary Cards Grid ── */}
                <div className="payroll-grid">
                    {loading ? (
                        <div className="payroll-empty-state">Loading payroll data...</div>
                    ) : payrollList.length > 0 ? (
                        payrollList.map(p => (
                            <div className="salary-card" key={p.id}>
                                {/* Coloured top banner */}
                                <div className={`salary-card-banner ${p.status === 'Paid' ? 'paid' : ''}`} />

                                {/* Header: Avatar + Name + Status */}
                                <div className="salary-card-header">
                                    <div className="salary-employee-info">
                                        <div className="salary-avatar">{getInitials(p.name)}</div>
                                        <div>
                                            <div className="salary-card-name">{p.name}</div>
                                            <div className="salary-card-role">Staff Member</div>
                                        </div>
                                    </div>
                                    <span className={`salary-status-badge ${p.status === 'Paid' ? 'paid' : 'pending'}`}>
                                        {p.status}
                                    </span>
                                </div>
                                
                                {/* Body: Salary Fields */}
                                <div className="salary-body">
                                    <div className="salary-field">
                                        <span className="salary-field-label">Base Salary</span>
                                        {p.status === 'Paid' ? (
                                            <span className="salary-field-value">₹{Number(p.base_salary).toLocaleString('en-IN')}</span>
                                        ) : (
                                            <input 
                                                type="number" 
                                                className="salary-input"
                                                value={p.base_salary}
                                                onChange={(e) => handlePayrollChange(p.staff_id, 'base_salary', e.target.value)}
                                            />
                                        )}
                                    </div>

                                    <div className="salary-field">
                                        <span className="salary-field-label">Allowances</span>
                                        {p.status === 'Paid' ? (
                                            <span className="salary-field-value" style={{color:'#059669'}}>+ ₹{Number(p.allowances).toLocaleString('en-IN')}</span>
                                        ) : (
                                            <input 
                                                type="number" 
                                                className="salary-input"
                                                value={p.allowances}
                                                onChange={(e) => handlePayrollChange(p.staff_id, 'allowances', e.target.value)}
                                            />
                                        )}
                                    </div>

                                    <div className="salary-field">
                                        <span className="salary-field-label">Deductions</span>
                                        {p.status === 'Paid' ? (
                                            <span className="salary-field-value" style={{color:'#ef4444'}}>− ₹{Number(p.deductions).toLocaleString('en-IN')}</span>
                                        ) : (
                                            <input 
                                                type="number" 
                                                className="salary-input"
                                                value={p.deductions}
                                                onChange={(e) => handlePayrollChange(p.staff_id, 'deductions', e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Footer: Net Payable + Actions */}
                                <div className="salary-card-footer">
                                    <div className="net-payable-row">
                                        <span className="net-payable-label">Net Payable</span>
                                        <span className="net-payable-amount">
                                            <span>₹</span>{Number(p.net_payable).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    
                                    {p.status !== 'Paid' && (
                                        <div className="salary-actions">
                                            <button 
                                                className="salary-btn salary-btn-save"
                                                onClick={() => handleSavePayrollDraft(p)}
                                            >
                                                Save Draft
                                            </button>
                                            <button 
                                                className="salary-btn salary-btn-pay"
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
                                                Process Payment
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="payroll-empty-state">No payroll records found for this month.</div>
                    )}
                </div>
            </div>
        );
    };

    const getTitle = () => {
        if (defaultTab === 'manage') return 'Staff Directory';
        if (defaultTab === 'roles') return 'Roles & Permissions';
        if (defaultTab === 'attendance') return 'Attendance Tracking';
        if (defaultTab === 'salary') return 'Payroll & Salary';
        if (defaultTab === 'history') return 'Payment History';
        return 'Management';
    };

    const renderPayrollHistory = () => {
        const filtered = historyList.filter(r =>
            r.name.toLowerCase().includes(historySearch.toLowerCase())
        );

        const months = [...new Set(filtered.map(r => r.month))].sort((a,b) => b.localeCompare(a));

        return (
            <div className="crm-content">
                {/* Filters */}
                <div className="payroll-header" style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <input
                        type="text"
                        className="payroll-month-input"
                        placeholder="🔍  Search employee..."
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        style={{ minWidth: '200px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="payroll-month-selector">
                            <label>From</label>
                            <input type="month" className="payroll-month-input" value={historyFromMonth} onChange={e => setHistoryFromMonth(e.target.value)} />
                        </div>
                        <div className="payroll-month-selector">
                            <label>To</label>
                            <input type="month" className="payroll-month-input" value={historyToMonth} onChange={e => setHistoryToMonth(e.target.value)} />
                        </div>
                        <button
                            className="salary-btn salary-btn-pay"
                            style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
                            onClick={() => fetchPayrollHistory({
                                ...(historySearch ? { } : {}),
                                ...(historyFromMonth ? { from_month: historyFromMonth } : {}),
                                ...(historyToMonth ? { to_month: historyToMonth } : {}),
                            })}
                        >
                            Apply Filter
                        </button>
                        <button
                            className="salary-btn salary-btn-save"
                            style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
                            onClick={() => { setHistoryFromMonth(''); setHistoryToMonth(''); setHistorySearch(''); fetchPayrollHistory(); }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Summary chip */}
                <div className="payroll-stats" style={{ marginBottom: '20px' }}>
                    <div className="payroll-stat-chip">
                        <span className="stat-label">Total Disbursed</span>
                        <span className="stat-value">₹{historyTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="payroll-stat-chip">
                        <span className="stat-label">Records Found</span>
                        <span className="stat-value">{filtered.length}</span>
                    </div>
                </div>

                {/* History Table grouped by Month */}
                {loading ? (
                    <div className="payroll-empty-state">Loading history...</div>
                ) : filtered.length === 0 ? (
                    <div className="payroll-empty-state">No payment records found.</div>
                ) : (
                    months.map(month => {
                        const monthRecords = filtered.filter(r => r.month === month);
                        const monthTotal = monthRecords.reduce((acc, r) => acc + Number(r.net_payable), 0);
                        return (
                            <div key={month} style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                        {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a' }}>₹{monthTotal.toLocaleString('en-IN')}</span>
                                </div>
                                <table className="crm-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Base Salary</th>
                                            <th>Allowances</th>
                                            <th>Deductions</th>
                                            <th>Net Paid</th>
                                            <th>Payment Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthRecords.map(r => (
                                            <tr key={r.id}>
                                                <td style={{ fontWeight: '600' }}>{r.name}</td>
                                                <td>₹{Number(r.base_salary).toLocaleString('en-IN')}</td>
                                                <td style={{ color: '#059669' }}>+₹{Number(r.allowances).toLocaleString('en-IN')}</td>
                                                <td style={{ color: '#ef4444' }}>−₹{Number(r.deductions).toLocaleString('en-IN')}</td>
                                                <td style={{ fontWeight: '800', color: '#0f172a' }}>₹{Number(r.net_payable).toLocaleString('en-IN')}</td>
                                                <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                                    {r.payment_date ? new Date(r.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })
                )}
            </div>
        );
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
            {defaultTab === 'history' && renderPayrollHistory()}

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
                                        maxLength="10"
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
