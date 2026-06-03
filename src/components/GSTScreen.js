import React, { useState, useEffect } from 'react';
import { accountingAPI } from '../services/api';
import '../styles/GSTScreen.css';

const GSTScreen = ({ defaultTab = 'summary', branchId }) => {
    const [summary, setSummary] = useState({
        outwardGST: 0,
        inwardGST: 0,
        netPayable: 0,
        lastFiled: 'N/A',
        filedDate: 'N/A'
    });
    const [gstr1Data, setGstr1Data] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (branchId) {
            if (defaultTab === 'summary' || defaultTab === 'gst') {
                fetchSummary();
            } else if (defaultTab === 'gstr1') {
                fetchGSTR1();
            }
        }
    }, [defaultTab, branchId]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const data = await accountingAPI.getGSTSummary({ branchId });
            if (data) setSummary(data);
        } catch (error) {
            console.error('Error fetching GST summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGSTR1 = async () => {
        setLoading(true);
        try {
            const data = await accountingAPI.getGSTR1({ branchId });
            if (data) setGstr1Data(data);
        } catch (error) {
            console.error('Error fetching GSTR-1 data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderGSTSummary = () => (
        <div className="crm-content">
            <div className="crm-grid-4">
                <div className="report-card blue">
                    <span className="card-title">Outward Tax (Output GST)</span>
                    <div className="card-value">₹{summary.outwardGST.toLocaleString()}</div>
                    <div className="card-trend emerald">Total Collected</div>
                </div>
                <div className="report-card emerald">
                    <span className="card-title">Inward Tax (Input GST)</span>
                    <div className="card-value">₹{summary.inwardGST.toLocaleString()}</div>
                    <div className="card-trend">Claimable ITC</div>
                </div>
                <div className="report-card highlight">
                    <span className="card-title">Net GST Payable</span>
                    <div className="card-value" style={{ color: summary.netPayable > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{Math.abs(summary.netPayable).toLocaleString()}
                    </div>
                    <div className="card-trend" style={{ color: summary.netPayable > 0 ? '#ef4444' : '#10b981' }}>
                        {summary.netPayable >= 0 ? 'Tax to be Paid' : 'Excess Input Credit'}
                    </div>
                    <div className="progress-bar-container" style={{ marginTop: '8px' }}>
                        <div className="progress-bar" style={{ width: `${Math.min(100, (summary.outwardGST > 0 ? (summary.inwardGST / summary.outwardGST) * 100 : 0))}%` }}></div>
                    </div>
                </div>
                <div className="report-card grey">
                    <span className="card-title">Last Filed</span>
                    <div className="card-value" style={{ fontSize: '0.9rem' }}>{summary.lastFiled}</div>
                    <div className="card-trend">Filed on: {summary.filedDate}</div>
                </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '24px' }}>GST Filing Calendar</h3>
            <div className="crm-grid-3">
                <div className="filing-status-card">
                    <div className="filing-month">APR 2026</div>
                    <div className="filing-rows">
                        <div className="filing-row"><span>GSTR-1 (Sales)</span> <span className="status-pill warning">Due in 5 Days</span></div>
                        <div className="filing-row"><span>GSTR-3B (Payment)</span> <span className="status-pill warning">Upcoming</span></div>
                    </div>
                </div>
                <div className="filing-status-card success">
                    <div className="filing-month">MAR 2026</div>
                    <div className="filing-rows">
                        <div className="filing-row"><span>GSTR-1</span> <span className="status-pill success">Filed</span></div>
                        <div className="filing-row"><span>GSTR-3B</span> <span className="status-pill success">Filed</span></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGSTR1 = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <select className="search-input"><option>Month: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</option></select>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary">Check Consistency</button>
                    <button className="btn-primary">Download JSON for Filing</button>
                </div>
            </div>
            <table className="crm-table single-line-table">
                <thead>
                    <tr>
                        <th>Invoice Date</th>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Taxable Val</th>
                        <th>CGST</th>
                        <th>SGST</th>
                        <th>IGST</th>
                        <th>Total GST</th>
                    </tr>
                </thead>
                <tbody>
                    {gstr1Data.length > 0 ? gstr1Data.map((row, idx) => (
                        <tr key={idx}>
                            <td>{new Date(row.invoiceDate).toLocaleDateString()}</td>
                            <td style={{ fontWeight: '800' }}>{row.invoiceNo}</td>
                            <td>{row.customer_name}</td>
                            <td>₹{parseFloat(row.taxableVal).toLocaleString()}</td>
                            <td>₹{parseFloat(row.cgst).toLocaleString()}</td>
                            <td>₹{parseFloat(row.sgst).toLocaleString()}</td>
                            <td>₹{parseFloat(row.igst).toLocaleString()}</td>
                            <td style={{ fontWeight: 'bold' }}>₹{parseFloat(row.totalGST).toLocaleString()}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No sales data found for this period</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const getTitle = () => {
        if (defaultTab === 'summary' || defaultTab === 'gst') return 'GST Tax Summary';
        if (defaultTab === 'gstr1') return 'GSTR-1 (Sales Tax Return)';
        if (defaultTab === 'gstr3b') return 'GSTR-3B (Summary Return)';
        return 'GST Compliance';
    };

    return (
        <div className="gst-screen">
            <div className="admin-content-header" style={{ marginBottom: '12px' }}>
                <h2 className="screen-title" style={{ fontSize: '1rem', fontWeight: '800' }}>
                    🏛️ {getTitle()}
                </h2>
            </div>
            {loading && <div className="loading-overlay" style={{ fontSize: '0.8rem', padding: '10px 20px' }}>Syncing GST Data...</div>}
            {(defaultTab === 'summary' || defaultTab === 'gst') && renderGSTSummary()}
            {defaultTab === 'gstr1' && renderGSTR1()}
        </div>
    );
};

export default GSTScreen;
