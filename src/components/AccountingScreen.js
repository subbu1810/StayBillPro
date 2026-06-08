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
    
    const [activeSubTab, setActiveSubTab] = useState('cash'); 
    
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
    }, [defaultTab, branchId, activeSubTab]);

    const fetchLedgerData = async () => {
        setLoading(true);
        try {
            const [entriesData, summaryData] = await Promise.all([
                accountingAPI.getLedger({ branchId, accountType: activeSubTab }),
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

    const renderLedger = () => (
        <div className="crm-content">
            <div className="view-selector" style={{ marginBottom: '16px' }}>
                <button className={activeSubTab === 'cash' ? 'active' : ''} onClick={() => setActiveSubTab('cash')}>💵 Cash Register</button>
                <button className={activeSubTab === 'bank' ? 'active' : ''} onClick={() => setActiveSubTab('bank')}>🏦 Bank Register</button>
            </div>
            <div className="crm-filters">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className={`balance-pill ${activeSubTab === 'bank' ? 'blue' : ''}`}>
                        <span className="label">Current {activeSubTab === 'cash' ? 'Cash' : 'Bank'} Balance:</span>
                        <span className="value">₹{activeSubTab === 'cash' ? summary.cashBalance.toLocaleString() : summary.bankBalance.toLocaleString()}</span>
                    </div>
                    <input type="date" className="search-input" />
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add {activeSubTab === 'cash' ? 'Cash' : 'Bank'} Entry</button>
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
                    {entries.length > 0 ? entries.map(entry => (
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
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No entries found</td></tr>
                    )}
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
        </div>
    );
};

export default AccountingScreen;
