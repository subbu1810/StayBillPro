import React, { useState, useEffect } from 'react';
import '../styles/StaffScreen.css';
import '../styles/SettingsScreen.css';
import { staffAPI, branchesAPI, staffManagementAPI, usersAPI, accountingAPI } from '../services/api';
import UsersRolesScreen from './UsersRolesScreen';
import { usePopup } from './ui/PopupProvider';

const StaffScreen = ({ defaultTab = 'manage' }) => {
    const popup = usePopup();
    const [staff, setStaff] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editStaffId, setEditStaffId] = useState(null);
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
        { id: 'pos-direct', label: 'Direct Bill (Open)', icon: '⚡', group: 'Sales (POS)' },
        { id: 'pos-wholesale', label: 'Wholesale Bill', icon: '📦', group: 'Sales (POS)' },
        { id: 'pos-returns', label: 'Returns & Refunds', icon: '↩️', group: 'Sales (POS)' },
        { id: 'invoice-history', label: 'POS History', icon: '📋', group: 'Sales (POS)' },
        { id: 'wholesale-history', label: 'Wholesale History', icon: '📦', group: 'Sales (POS)' },
        
        // Jobs
        { id: 'jobs', label: 'Active Jobs List', icon: '📋', group: 'Service Jobs' },
        { id: 'jobs-new', label: 'Create New Job', icon: '➕', group: 'Service Jobs' },
        { id: 'jobs-calendar', label: 'Service Calendar', icon: '📅', group: 'Service Jobs' },
        { id: 'jobs-invoicing', label: 'Invoicing Hub', icon: '🧾', group: 'Service Jobs' },
        { id: 'jobs-payments', label: 'Payments', icon: '💰', group: 'Service Jobs' },
        
        // Store Stock
        { id: 'inventory-sales-stock', label: 'Current Stock', icon: '📦', group: 'Store Stock' },
        { id: 'inventory-sales-expiry', label: 'Expiry Monitor', icon: '⏳', group: 'Store Stock' },
        { id: 'inventory-sales-categories', label: 'Categories', icon: '🏷️', group: 'Store Stock' },
        { id: 'inventory-sales-ledger', label: 'Stock Log', icon: '📜', group: 'Store Stock' },

        // Service Stock
        { id: 'inventory-service', label: 'Spare Parts List', icon: '🔧', group: 'Service Stock' },
        { id: 'inventory-service-expiry', label: 'Expiry Monitor', icon: '⏳', group: 'Service Stock' },
        { id: 'inventory-service-categories', label: 'Categories', icon: '🏷️', group: 'Service Stock' },
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
        { id: 'accounting-service-ledger', label: 'Service Cashbook', icon: '🛠️', group: 'Accounting Hub' },
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

    // Advance Salary state
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [advanceSaving, setAdvanceSaving] = useState(false);
    const [advanceForm, setAdvanceForm] = useState({
        staff_id: '',
        staff_name: '',
        amount: '',
        payment_mode: 'cash',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
    });

    // Pay Salary Modal state
    const [showPaySalaryModal, setShowPaySalaryModal] = useState(false);
    const [paySalarySaving, setPaySalarySaving] = useState(false);
    const [paySalaryForm, setPaySalaryForm] = useState({
        staff_id: '',
        staff_name: '',
        month: '',
        base_salary: 0,
        allowances: 0,
        deductions: 0,
        net_payable: 0,
        payment_mode: 'bank',
        payment_date: new Date().toISOString().split('T')[0],
        remarks: ''
    });

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
            if (editStaffId) {
                const payload = { ...newStaff };
                if (!payload.password) delete payload.password;
                await usersAPI.update(editStaffId, payload);
                setSuccess('Staff member updated successfully!');
            } else {
                await staffAPI.create(newStaff);
                setSuccess('Staff login account created successfully!');
            }
            setShowModal(false);
            setEditStaffId(null);
            setNewStaff({ admin_name: '', email: '', phone: '', password: '', branch_id: '', base_salary: '', permissions: ['dashboard'] });
            setTimeout(() => setSuccess(null), 4000);
            fetchData();
        } catch (err) {
            setError(`Error ${editStaffId ? 'updating' : 'creating'} staff: ` + err.message);
            setTimeout(() => setError(null), 4000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderManageStaff = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <input type="text" placeholder="Search Staff Member..." className="search-input" />
                <button className="btn-primary" onClick={() => {
                    setEditStaffId(null);
                    setNewStaff({ admin_name: '', email: '', phone: '', password: '', branch_id: '', base_salary: '', permissions: ['dashboard'] });
                    setShowModal(true);
                }}>+ Add Employee</button>
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
                                    <button className="btn-icon" onClick={() => {
                                        setEditStaffId(s.id);
                                        setNewStaff({
                                            admin_name: s.admin_name || '',
                                            email: s.email || '',
                                            phone: s.phone || '',
                                            password: '',
                                            branch_id: s.branch_id || '',
                                            base_salary: s.base_salary || '',
                                            permissions: typeof s.permissions === 'string' ? JSON.parse(s.permissions) : (s.permissions || ['dashboard'])
                                        });
                                        setShowModal(true);
                                    }}>✏️</button>
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

    const handleOpenAdvanceModal = (p) => {
        setAdvanceForm({
            staff_id: p.staff_id,
            staff_name: p.name,
            amount: '',
            payment_mode: 'cash',
            date: new Date().toISOString().split('T')[0],
            remarks: ''
        });
        setShowAdvanceModal(true);
    };

    const handleSaveAdvance = async (e) => {
        e.preventDefault();
        const advAmt = parseFloat(advanceForm.amount);
        if (!advAmt || advAmt <= 0) {
            popup.showError('Please enter a valid advance amount.');
            return;
        }
        // Check if cashbook is closed for today if cash is chosen
        if (advanceForm.payment_mode === 'cash') {
            try {
                const ledgerEntries = await accountingAPI.getLedger({ accountType: 'cash', startDate: advanceForm.date, endDate: advanceForm.date });
                const isClosed = (Array.isArray(ledgerEntries) ? ledgerEntries : []).some(e => 
                    (e.voucher_no && e.voucher_no.startsWith('EOD-')) || (e.particulars && e.particulars.includes('🔒 Day Closed'))
                );
                if (isClosed) {
                    popup.showError(`Cashbook for ${advanceForm.date} is already closed. Please choose Bank Transfer/UPI or record on the next open day.`);
                    return;
                }
            } catch (chkErr) {
                console.warn('Cash closure check bypassed:', chkErr);
            }
        }

        setAdvanceSaving(true);
        try {
            // 1. Record expense / cash outflow in accounting
            try {
                await accountingAPI.addEntry({
                    branch_id: 1,
                    account_type: advanceForm.payment_mode === 'cash' ? 'cash' : 'bank',
                    transaction_type: 'payment',
                    voucher_no: `ADV-${Date.now().toString().slice(-4)}`,
                    particulars: `Salary Advance to ${advanceForm.staff_name} (${payrollMonth})${advanceForm.remarks ? ` - ${advanceForm.remarks}` : ''}`,
                    amount: advAmt,
                    transaction_date: advanceForm.date
                });
            } catch (accErr) {
                console.warn("Accounting entry warning:", accErr);
            }

            // 2. Record advance payment transaction in staff management payments
            try {
                await staffManagementAPI.recordAdvance({
                    staff_id: advanceForm.staff_id,
                    month: payrollMonth,
                    amount: advAmt,
                    payment_mode: advanceForm.payment_mode,
                    date: advanceForm.date,
                    remarks: advanceForm.remarks
                });
            } catch (recErr) {
                console.warn("Advance payment logging note:", recErr);
            }

            // 3. Automatically update deduction in payroll for this staff & month
            const currentStaffPayroll = payrollList.find(item => item.staff_id === advanceForm.staff_id);
            if (currentStaffPayroll) {
                const updatedDeductions = (parseFloat(currentStaffPayroll.deductions) || 0) + advAmt;
                const baseSal = parseFloat(currentStaffPayroll.base_salary) || 0;
                const allow = parseFloat(currentStaffPayroll.allowances) || 0;
                const newNet = Math.max(0, baseSal + allow - updatedDeductions);

                await staffManagementAPI.savePayrollDraft({
                    staff_id: advanceForm.staff_id,
                    month: payrollMonth,
                    base_salary: baseSal,
                    allowances: allow,
                    deductions: updatedDeductions,
                    net_payable: newNet
                });
            }

            popup.showSuccess(`₹${advAmt.toLocaleString()} advance given to ${advanceForm.staff_name} and deducted from payroll.`);
            setShowAdvanceModal(false);
            fetchPayroll();
        } catch (err) {
            popup.showError('Error recording salary advance: ' + err.message);
        } finally {
            setAdvanceSaving(false);
        }
    };

    const handleOpenPaySalaryModal = (p) => {
        setPaySalaryForm({
            staff_id: p.staff_id,
            staff_name: p.name,
            month: payrollMonth,
            base_salary: parseFloat(p.base_salary) || 0,
            allowances: parseFloat(p.allowances) || 0,
            deductions: parseFloat(p.deductions) || 0,
            net_payable: parseFloat(p.net_payable) || 0,
            payment_mode: 'bank',
            payment_date: new Date().toISOString().split('T')[0],
            remarks: ''
        });
        setShowPaySalaryModal(true);
    };

    const handleConfirmPaySalary = async (e) => {
        e.preventDefault();

        // Check if cashbook is closed for today if cash is chosen
        if (paySalaryForm.payment_mode === 'cash' && paySalaryForm.net_payable > 0) {
            try {
                const ledgerEntries = await accountingAPI.getLedger({ accountType: 'cash', startDate: paySalaryForm.payment_date, endDate: paySalaryForm.payment_date });
                const isClosed = (Array.isArray(ledgerEntries) ? ledgerEntries : []).some(e => 
                    (e.voucher_no && e.voucher_no.startsWith('EOD-')) || (e.particulars && e.particulars.includes('🔒 Day Closed'))
                );
                if (isClosed) {
                    popup.showError(`Cashbook for ${paySalaryForm.payment_date} is already closed. Please choose Bank Transfer/UPI or select the next open date.`);
                    return;
                }
            } catch (chkErr) {
                console.warn('Cash closure check bypassed:', chkErr);
            }
        }

        setPaySalarySaving(true);
        try {
            // 1. Process salary payment in payroll
            await staffManagementAPI.processPayment({
                staff_id: paySalaryForm.staff_id,
                month: paySalaryForm.month,
                base_salary: paySalaryForm.base_salary,
                allowances: paySalaryForm.allowances,
                deductions: paySalaryForm.deductions,
                net_payable: paySalaryForm.net_payable,
                payment_mode: paySalaryForm.payment_mode,
                payment_date: paySalaryForm.payment_date,
                remarks: paySalaryForm.remarks
            });

            // 2. Record salary payout in accounting cash / bank register
            if (paySalaryForm.net_payable > 0) {
                try {
                    await accountingAPI.addEntry({
                        branch_id: 1,
                        account_type: paySalaryForm.payment_mode === 'cash' ? 'cash' : 'bank',
                        transaction_type: 'payment',
                        voucher_no: `SAL-${Date.now().toString().slice(-4)}`,
                        particulars: `Salary Disbursed to ${paySalaryForm.staff_name} for ${paySalaryForm.month}${paySalaryForm.remarks ? ` (${paySalaryForm.remarks})` : ''}`,
                        amount: paySalaryForm.net_payable,
                        transaction_date: paySalaryForm.payment_date
                    });
                } catch (accErr) {
                    console.warn('Accounting entry sync note:', accErr);
                }
            }

            popup.showSuccess(`Salary of ₹${Number(paySalaryForm.net_payable).toLocaleString('en-IN')} paid to ${paySalaryForm.staff_name} successfully!`);
            setShowPaySalaryModal(false);
            fetchPayroll();
        } catch (err) {
            popup.showError('Error paying salary: ' + err.message);
        } finally {
            setPaySalarySaving(false);
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <span className="salary-field-label">Deductions / Advances</span>
                                        </div>
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
                                    
                                    <div className="salary-actions">
                                        <button 
                                            className="salary-btn"
                                            style={{ background: '#f59e0b', color: '#fff' }}
                                            onClick={() => handleOpenAdvanceModal(p)}
                                            title="Give advance payment to staff"
                                        >
                                            ➕ Give Advance
                                        </button>
                                        
                                        {p.status !== 'Paid' ? (
                                            <>
                                                <button 
                                                    className="salary-btn salary-btn-save"
                                                    onClick={() => handleSavePayrollDraft(p)}
                                                >
                                                    Save Draft
                                                </button>
                                                <button 
                                                    className="salary-btn salary-btn-pay"
                                                    onClick={() => handleOpenPaySalaryModal(p)}
                                                >
                                                    💰 Pay Salary
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    className="salary-btn"
                                                    style={{ background: '#2563eb', color: '#fff' }}
                                                    onClick={() => handleOpenPaySalaryModal(p)}
                                                    title="Disburse / Pay remaining balance"
                                                >
                                                    💰 Pay Salary
                                                </button>
                                                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, padding: '4px 8px', background: '#dcfce7', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    ✓ Paid
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="payroll-empty-state">No payroll records found for this month.</div>
                    )}
                </div>

                {/* ── Pay Salary Confirmation Modal ── */}
                {showPaySalaryModal && (
                    <div className="modal-overlay" style={{ zIndex: 9999 }}>
                        <div className="modal-content" style={{ maxWidth: '480px', width: '92%' }}>
                            <div className="modal-header" style={{ background: '#2563eb', color: '#fff', padding: '12px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>💰</span>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                                        Pay Salary ({paySalaryForm.staff_name})
                                    </h3>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowPaySalaryModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleConfirmPaySalary}>
                                <div className="modal-body" style={{ padding: '20px' }}>
                                    {/* Breakdown summary card */}
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '14px',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', color: '#475569' }}>
                                            <span>Base Salary:</span>
                                            <span style={{ fontWeight: 600 }}>₹{paySalaryForm.base_salary.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', color: '#059669' }}>
                                            <span>Allowances (+):</span>
                                            <span style={{ fontWeight: 600 }}>+₹{paySalaryForm.allowances.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: '#dc2626' }}>
                                            <span>Deductions / Advances (−):</span>
                                            <span style={{ fontWeight: 600 }}>−₹{paySalaryForm.deductions.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{
                                            borderTop: '1px dashed #cbd5e1',
                                            paddingTop: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>Net Amount to Pay:</span>
                                            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#2563eb' }}>
                                                ₹{paySalaryForm.net_payable.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Disbursement Payment Mode
                                        </label>
                                        <select
                                            className="form-input"
                                            value={paySalaryForm.payment_mode}
                                            onChange={(e) => setPaySalaryForm({ ...paySalaryForm, payment_mode: e.target.value })}
                                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="bank">Bank Transfer / NEFT / IMPS / UPI</option>
                                            <option value="cash">Cash in Hand (Register)</option>
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Payment Date
                                        </label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={paySalaryForm.payment_date}
                                            onChange={(e) => setPaySalaryForm({ ...paySalaryForm, payment_date: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Payment Note / Transaction Reference (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. UTR #12345678 / Paid in full"
                                            value={paySalaryForm.remarks}
                                            onChange={(e) => setPaySalaryForm({ ...paySalaryForm, remarks: e.target.value })}
                                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowPaySalaryModal(false)}>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn-primary"
                                        style={{ background: '#2563eb', padding: '7px 20px', fontWeight: 700 }}
                                        disabled={paySalarySaving}
                                    >
                                        {paySalarySaving ? 'Disbursing…' : '💰 Confirm & Disburse Salary'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Give Advance Modal ── */}
                {showAdvanceModal && (
                    <div className="modal-overlay" style={{ zIndex: 9999 }}>
                        <div className="modal-content" style={{ maxWidth: '440px', width: '92%' }}>
                            <div className="modal-header" style={{ background: '#f59e0b', color: '#fff', padding: '12px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>💵</span>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                                        Give Salary Advance ({advanceForm.staff_name})
                                    </h3>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAdvanceModal(false)}
                                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleSaveAdvance}>
                                <div className="modal-body" style={{ padding: '20px' }}>
                                    <div style={{
                                        background: '#fffbeb',
                                        border: '1px solid #fef3c7',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        marginBottom: '16px',
                                        fontSize: '0.78rem',
                                        color: '#92400e'
                                    }}>
                                        💡 This advance will automatically record a cash payment entry in your accounting ledger and subtract from this month's net payable salary.
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Advance Amount (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 2000"
                                            className="form-input"
                                            value={advanceForm.amount}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Payment Mode
                                        </label>
                                        <select
                                            className="form-input"
                                            value={advanceForm.payment_mode}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, payment_mode: e.target.value })}
                                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="cash">Cash in Hand</option>
                                            <option value="bank">Bank Transfer / UPI</option>
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={advanceForm.date}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                                            Remarks / Note (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Festival advance / Medical"
                                            value={advanceForm.remarks}
                                            onChange={(e) => setAdvanceForm({ ...advanceForm, remarks: e.target.value })}
                                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowAdvanceModal(false)}>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn-primary"
                                        style={{ background: '#f59e0b', padding: '7px 20px', fontWeight: 700 }}
                                        disabled={advanceSaving}
                                    >
                                        {advanceSaving ? 'Recording…' : '💵 Pay & Record Advance'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
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
                                            <th>Payment Type</th>
                                            <th>Amount Paid</th>
                                            <th>Mode</th>
                                            <th>Payment Date</th>
                                            <th>Note / Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthRecords.map(r => {
                                            const isAdvance = r.payment_type === 'advance';
                                            return (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: '700', color: '#0f172a' }}>{r.name}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '3px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.74rem',
                                                            fontWeight: 700,
                                                            background: isAdvance ? '#fffbeb' : '#dcfce7',
                                                            color: isAdvance ? '#b45309' : '#15803d',
                                                            border: isAdvance ? '1px solid #fde68a' : '1px solid #bbf7d0',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            {isAdvance ? '💵 Salary Advance' : '💰 Salary Payout'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.92rem' }}>
                                                        ₹{Number(r.net_payable).toLocaleString('en-IN')}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            textTransform: 'uppercase',
                                                            fontWeight: 700,
                                                            color: '#475569',
                                                            background: '#f1f5f9',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            {r.payment_mode || 'BANK'}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: '#475569', fontSize: '0.82rem', fontWeight: 500 }}>
                                                        {r.payment_date ? new Date(r.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                    </td>
                                                    <td style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: r.remarks ? 'normal' : 'italic' }}>
                                                        {r.remarks || (isAdvance ? 'Advance Deduction' : 'Monthly Salary')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
                        <h3>{editStaffId ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
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
                                    <label className="premium-input-label">Login Password {editStaffId ? '' : '*'}</label>
                                    <input 
                                        type="password" 
                                        className="premium-input"
                                        required={!editStaffId} 
                                        value={newStaff.password} 
                                        onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                                        placeholder={editStaffId ? "Leave blank to keep current" : "Create temporary password"}
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
