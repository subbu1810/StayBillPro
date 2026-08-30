import React, { useState, useEffect } from 'react';
import { accountingAPI, expenseAPI } from '../services/api';
import '../styles/AccountingScreen.css';
import { usePopup } from './ui/PopupProvider';

const AccountingScreen = ({ defaultTab = 'ledger', branchId }) => {
    const popup = usePopup();
    const [entries, setEntries] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [pnlData, setPnlData] = useState({
        income: { salesRevenue: 0, serviceIncome: 0, totalIncome: 0 },
        expenses: { totalExpenses: 0, breakdown: [] },
        netProfit: 0
    });
    const [summary, setSummary] = useState({ cashBalance: 0, bankBalance: 0 });
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showCloseDayModal, setShowCloseDayModal] = useState(false);
    const [closeDaySaving, setCloseDaySaving] = useState(false);
    
    const [activeSubTab, setActiveSubTab] = useState('cash'); 
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    // Denominations for cash tally
    const [denominations, setDenominations] = useState({
        500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: ''
    });
    const [transferToBankAmt, setTransferToBankAmt] = useState('');
    const [closingRemarks, setClosingRemarks] = useState('');
    
    const [newEntry, setNewEntry] = useState({
        account_type: 'cash',
        transaction_type: 'receipt',
        voucher_no: '',
        particulars: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0]
    });

    const [newExpense, setNewExpense] = useState({
        category: '',
        amount: '',
        description: '',
        payment_mode: 'cash',
        expense_date: new Date().toISOString().split('T')[0]
    });

    const EXPENSE_CATEGORIES = [
        'Rent & Rates', 'Electricity & Water', 'Salaries & Wages', 
        'Office Supplies', 'Maintenance & Repairs', 'Marketing & Ads', 
        'Transport & Fuel', 'Taxes & Insurance', 'Others'
    ];

    useEffect(() => {
        if (defaultTab === 'ledger') {
            fetchLedgerData();
        } else if (defaultTab === 'expenses') {
            fetchExpenseData();
        } else if (defaultTab === 'pl') {
            fetchPnLData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultTab, branchId, activeSubTab, fromDate, toDate]);

    const fetchLedgerData = async () => {
        setLoading(true);
        try {
            const [entriesData, summaryData] = await Promise.all([
                accountingAPI.getLedger({ branchId, accountType: activeSubTab, startDate: fromDate, endDate: toDate }),
                accountingAPI.getSummary({ branchId })
            ]);
            setEntries(entriesData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error fetching ledger data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenseData = async () => {
        setLoading(true);
        try {
            const data = await expenseAPI.getAll({ branchId });
            setExpenses(data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPnLData = async () => {
        setLoading(true);
        try {
            const data = await accountingAPI.getProfitLoss({ branchId });
            setPnlData(data);
        } catch (error) {
            console.error('Error fetching P&L data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await accountingAPI.addEntry({
                ...newEntry,
                branch_id: branchId,
                account_type: activeSubTab
            });
            setShowAddModal(false);
            setNewEntry(prev => ({ ...prev, voucher_no: '', particulars: '', amount: '' }));
            await fetchLedgerData();
        } catch (error) {
            popup.showError('Error adding entry: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await expenseAPI.create({
                ...newExpense,
                branch_id: branchId
            });
            setShowExpenseModal(false);
            setNewExpense({
                category: '',
                amount: '',
                description: '',
                payment_mode: 'cash',
                expense_date: new Date().toISOString().split('T')[0]
            });
            await fetchExpenseData();
        } catch (error) {
            popup.showError('Error adding expense: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const todayIso = new Date().toISOString().split('T')[0];
    const isTodayCashClosed = entries.some(e => {
        if (!e.transaction_date || e.account_type !== 'cash') return false;
        const d = e.transaction_date.split('T')[0];
        const isClosed = (e.voucher_no && e.voucher_no.startsWith('EOD-')) || 
                         (e.particulars && e.particulars.includes('🔒 Day Closed'));
        return d === todayIso && isClosed;
    });

    const handleOpenCloseDayModal = () => {
        if (isTodayCashClosed) {
            popup.showError('Cashbook for today is already closed.');
            return;
        }
        setClosingRemarks('');
        setShowCloseDayModal(true);
    };

    const handleSaveCloseDay = async (e) => {
        e.preventDefault();
        setCloseDaySaving(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];

            // Record Day-End Closing Stamp Entry in Ledger (using receipt of 0.00 / 0 or standard parameters)
            await accountingAPI.addEntry({
                branch_id: branchId || 1,
                account_type: 'cash',
                transaction_type: 'initial',
                voucher_no: `EOD-${Date.now().toString().slice(-4)}`,
                particulars: `🔒 Day Closed. Closing Balance: ₹${summary.cashBalance.toLocaleString()}${closingRemarks ? ` - ${closingRemarks}` : ''}`,
                amount: '0.0001',
                transaction_date: todayStr
            });

            popup.showSuccess('Cashbook closed for the day successfully!');
            setShowCloseDayModal(false);
            await fetchLedgerData();
        } catch (error) {
            popup.showError('Error closing cashbook: ' + error.message);
        } finally {
            setCloseDaySaving(false);
        }
    };

    const renderLedger = () => (
        <div className="crm-content">
            <div className="view-selector" style={{ marginBottom: '16px' }}>
                <button className={activeSubTab === 'cash' ? 'active' : ''} onClick={() => setActiveSubTab('cash')}>💵 Cash Register</button>
                <button className={activeSubTab === 'bank' ? 'active' : ''} onClick={() => setActiveSubTab('bank')}>🏦 Bank Register</button>
            </div>

            {/* If today's cashbook is closed, show warning banner */}
            {activeSubTab === 'cash' && isTodayCashClosed && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#991b1b',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <span>🔒</span>
                        <span>Cashbook for today ({new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}) is closed. New cash entries are locked.</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: '#dc2626', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        LOCKED
                    </span>
                </div>
            )}

            <div className="crm-filters">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className={`balance-pill ${activeSubTab === 'bank' ? 'blue' : ''}`}>
                        <span className="label">Current {activeSubTab === 'cash' ? 'Cash' : 'Bank'} Balance:</span>
                        <span className="value">₹{activeSubTab === 'cash' ? summary.cashBalance.toLocaleString() : summary.bankBalance.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>From:</span>
                        <input 
                            type="date" 
                            className="search-input" 
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>To:</span>
                        <input 
                            type="date" 
                            className="search-input" 
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {activeSubTab === 'cash' && (
                        <button 
                            className="btn-primary" 
                            style={{ 
                                background: isTodayCashClosed ? '#94a3b8' : '#7c3aed', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 5,
                                cursor: isTodayCashClosed ? 'not-allowed' : 'pointer'
                            }}
                            onClick={handleOpenCloseDayModal}
                            disabled={isTodayCashClosed}
                            title={isTodayCashClosed ? "Cashbook is already closed for today" : "Close cash register for today"}
                        >
                            {isTodayCashClosed ? '✓ Cash Closed for Today' : '🔒 Close Day Cash'}
                        </button>
                    )}
                    <button 
                        className="btn-primary" 
                        onClick={() => {
                            if (activeSubTab === 'cash' && isTodayCashClosed) {
                                popup.showError('Cannot add cash entry because today\'s cashbook has already been closed.');
                                return;
                            }
                            setShowAddModal(true);
                        }}
                        disabled={activeSubTab === 'cash' && isTodayCashClosed}
                        style={{
                            opacity: (activeSubTab === 'cash' && isTodayCashClosed) ? 0.6 : 1,
                            cursor: (activeSubTab === 'cash' && isTodayCashClosed) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        + Add {activeSubTab === 'cash' ? 'Cash' : 'Bank'} Entry
                    </button>
                </div>
            </div>
            <table className="crm-table single-line-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Voucher/Ref #</th>
                        <th>Particulars</th>
                        <th>Type</th>
                        <th style={{ color: '#10b981' }}>In (Receipt)</th>
                        <th style={{ color: '#ef4444' }}>Out (Payment)</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const filteredEntries = entries.filter(e => {
                            if (!e.transaction_date) return true;
                            const d = e.transaction_date.split('T')[0];
                            if (fromDate && d < fromDate) return false;
                            if (toDate && d > toDate) return false;
                            return true;
                        });
                        return filteredEntries.length > 0 ? filteredEntries.map(entry => (
                            <tr key={entry.id}>
                                <td>{new Date(entry.transaction_date).toLocaleDateString()}</td>
                                <td>{entry.voucher_no || '-'}</td>
                                <td>{entry.particulars}</td>
                                <td style={{ textTransform: 'capitalize' }}>{entry.transaction_type}</td>
                                <td style={{ color: '#10b981' }}>{entry.transaction_type === 'receipt' || entry.transaction_type === 'initial' ? `₹${parseFloat(entry.amount).toLocaleString()}` : '-'}</td>
                                <td style={{ color: '#ef4444' }}>{entry.transaction_type === 'payment' ? `₹${parseFloat(entry.amount).toLocaleString()}` : '-'}</td>
                                <td style={{ fontWeight: 'bold' }}>₹{parseFloat(entry.balance).toLocaleString()}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No entries found for the selected date range</td></tr>
                        );
                    })()}
                </tbody>
            </table>
        </div>
    );

    const renderExpenses = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="balance-pill red">
                        <span className="label">Total Expenses:</span>
                        <span className="value">₹{expenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0).toLocaleString()}</span>
                    </div>
                    <input type="date" className="search-input" />
                </div>
                <button className="btn-primary" onClick={() => setShowExpenseModal(true)}>+ Record Expense</button>
            </div>
            <table className="crm-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Paid Via</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.length > 0 ? expenses.map(exp => (
                        <tr key={exp.id}>
                            <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                            <td><span className="expense-cat-badge">{exp.category}</span></td>
                            <td>{exp.description || '-'}</td>
                            <td><span className={`payment-mode-badge ${exp.payment_mode}`}>{exp.payment_mode}</span></td>
                            <td style={{ fontWeight: 'bold', color: '#ef4444' }}>₹{parseFloat(exp.amount).toLocaleString()}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No expense records found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderProfitLoss = () => (
        <div className="crm-content">
            <div className="pnl-container">
                <div className="pnl-box">
                    <h4 className="pnl-title">Trading & Operating Income</h4>
                    <div className="pnl-row">
                        <span>Sales Revenue (Excl. GST)</span> 
                        <span className="pnl-val">₹{pnlData.income.salesRevenue.toLocaleString()}</span>
                    </div>
                    <div className="pnl-row">
                        <span>Service Income</span> 
                        <span className="pnl-val">₹{pnlData.income.serviceIncome.toLocaleString()}</span>
                    </div>
                    <div className="pnl-row total">
                        <span>Total Revenue</span> 
                        <span className="pnl-val">₹{pnlData.income.totalIncome.toLocaleString()}</span>
                    </div>
                </div>
                
                <div className="pnl-box">
                    <h4 className="pnl-title" style={{ color: '#ef4444' }}>Operating Expenses</h4>
                    {pnlData.expenses.breakdown.length > 0 ? pnlData.expenses.breakdown.map(item => (
                        <div className="pnl-row" key={item.category}>
                            <span>{item.category}</span> 
                            <span className="pnl-val">₹{parseFloat(item.total).toLocaleString()}</span>
                        </div>
                    )) : (
                        <div className="pnl-row"><span>No expenses recorded</span> <span className="pnl-val">₹0</span></div>
                    )}
                    <div className="pnl-row total">
                        <span>Total Expenses</span> 
                        <span className="pnl-val">₹{pnlData.expenses.totalExpenses.toLocaleString()}</span>
                    </div>
                </div>
                
                <div className="pnl-summary-card">
                    <span className="card-title">Net Profit / Loss</span>
                    <div className={`card-value ${pnlData.netProfit >= 0 ? 'success' : 'danger'}`}>
                        {pnlData.netProfit >= 0 ? '+' : ''}₹{pnlData.netProfit.toLocaleString()}
                    </div>
                    <span style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.7 }}>
                        {pnlData.netProfit >= 0 ? 'Generating Profit' : 'Operating at Loss'}
                    </span>
                </div>
            </div>
        </div>
    );

    const getTitle = () => {
        if (defaultTab === 'ledger') return 'Ledger & Cashbook';
        if (defaultTab === 'expenses') return 'Business Expenses';
        if (defaultTab === 'pl') return 'Profit & Loss Statement';
        return 'Accounting Hub';
    };

    return (
        <div className="accounting-screen">
            <div className="admin-content-header" style={{ marginBottom: '12px' }}>
                <h2 className="screen-title" style={{ fontSize: '1rem', fontWeight: '800' }}>⚖️ {getTitle()}</h2>
            </div>

            {loading && !showAddModal && !showExpenseModal && <div className="loading-overlay">Loading...</div>}

            {defaultTab === 'ledger' && renderLedger()}
            {defaultTab === 'expenses' && renderExpenses()}
            {defaultTab === 'pl' && renderProfitLoss()}

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Add {activeSubTab === 'cash' ? 'Cash' : 'Bank'} Entry</h3>
                        </div>
                        <form onSubmit={handleAddEntry}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Transaction Type</label>
                                        <select className="form-input" value={newEntry.transaction_type} onChange={e => setNewEntry({...newEntry, transaction_type: e.target.value})}>
                                            <option value="receipt">Receipt ({activeSubTab === 'cash' ? 'Cash In' : 'Bank In'})</option>
                                            <option value="payment">Payment ({activeSubTab === 'cash' ? 'Cash Out' : 'Bank Out'})</option>
                                            <option value="initial">Initial Balance</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Voucher/Ref Number</label>
                                        <input type="text" className="form-input" placeholder="e.g. CSH-001" value={newEntry.voucher_no} onChange={e => setNewEntry({...newEntry, voucher_no: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input type="date" className="form-input" value={newEntry.transaction_date} onChange={e => setNewEntry({...newEntry, transaction_date: e.target.value})} required />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Amount (₹)</label>
                                        <input type="number" className="form-input" placeholder="0.00" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: e.target.value})} required />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Particulars (Details)</label>
                                        <textarea className="form-input" placeholder="Enter transaction details..." value={newEntry.particulars} onChange={e => setNewEntry({...newEntry, particulars: e.target.value})} required />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showExpenseModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Record Business Expense</h3>
                        </div>
                        <form onSubmit={handleAddExpense}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select className="form-input" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} required>
                                            <option value="">Select Category</option>
                                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Payment Mode</label>
                                        <select className="form-input" value={newExpense.payment_mode} onChange={e => setNewExpense({...newExpense, payment_mode: e.target.value})}>
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank Transfer / UPI</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Amount (₹)</label>
                                        <input type="number" className="form-input" placeholder="0.00" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input type="date" className="form-input" value={newExpense.expense_date} onChange={e => setNewExpense({...newExpense, expense_date: e.target.value})} required />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Description</label>
                                        <textarea className="form-input" placeholder="What was this expense for?" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Close Cashbook for the Day Modal (Clean & Simple) ── */}
            {showCloseDayModal && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: '440px', width: '92%' }}>
                        <div className="modal-header" style={{ background: '#7c3aed', color: '#fff', padding: '12px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Close Cashbook for the Day</h3>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setShowCloseDayModal(false)}
                                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSaveCloseDay}>
                            <div className="modal-body" style={{ padding: '20px' }}>
                                <div style={{
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                        Final Closing Cash Balance
                                    </div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                                        ₹{summary.cashBalance.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                                        Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                                        Closing Note / Remark (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Day closed by Subbu"
                                        value={closingRemarks}
                                        onChange={(e) => setClosingRemarks(e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer" style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowCloseDayModal(false)}>
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-primary"
                                    style={{ background: '#7c3aed', padding: '7px 20px', fontWeight: 700 }}
                                    disabled={closeDaySaving}
                                >
                                    {closeDaySaving ? 'Closing…' : '🔒 Confirm & Close Day'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountingScreen;
