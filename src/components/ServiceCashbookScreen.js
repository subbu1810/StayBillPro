import React, { useState, useEffect } from 'react';
import { servicePaymentsAPI } from '../services/api';
import '../styles/AccountingScreen.css';

const ServiceCashbookScreen = ({ branchId }) => {
    const [entries, setEntries] = useState([]);
    const [summary, setSummary] = useState({ cashBalance: 0, bankBalance: 0 });
    const [loading, setLoading] = useState(false);
    
    const [activeSubTab, setActiveSubTab] = useState('cash'); 
    
    useEffect(() => {
        fetchLedgerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId, activeSubTab]);

    const fetchLedgerData = async () => {
        setLoading(true);
        try {
            const [entriesData, summaryData] = await Promise.all([
                servicePaymentsAPI.getServiceLedgerEntries({ branchId, accountType: activeSubTab }),
                servicePaymentsAPI.getServiceLedgerSummary({ branchId })
            ]);
            setEntries(entriesData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error fetching service ledger data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderLedger = () => (
        <div className="crm-content">
            <div className="view-selector" style={{ marginBottom: '16px' }}>
                <button className={activeSubTab === 'cash' ? 'active' : ''} onClick={() => setActiveSubTab('cash')}>💵 Service Cash Register</button>
                <button className={activeSubTab === 'bank' ? 'active' : ''} onClick={() => setActiveSubTab('bank')}>🏦 Service Bank Register</button>
            </div>
            <div className="crm-filters">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className={`balance-pill ${activeSubTab === 'bank' ? 'blue' : ''}`}>
                        <span className="label">Current {activeSubTab === 'cash' ? 'Cash' : 'Bank'} Balance:</span>
                        <span className="value">₹{activeSubTab === 'cash' ? summary.cashBalance.toLocaleString() : summary.bankBalance.toLocaleString()}</span>
                    </div>
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    <em>* Note: Entries are read-only and automatically generated when service job payments are created or deleted.</em>
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

    return (
        <div className="accounting-screen">
            <div className="admin-content-header" style={{ marginBottom: '12px' }}>
                <h2 className="screen-title" style={{ fontSize: '1rem', fontWeight: '800' }}>🛠️ Service Cashbook</h2>
            </div>

            {loading && <div className="loading-overlay">Loading...</div>}

            {renderLedger()}
        </div>
    );
};

export default ServiceCashbookScreen;
