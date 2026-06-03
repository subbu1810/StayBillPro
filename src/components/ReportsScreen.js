import React, { useEffect, useState } from 'react';
import '../styles/ReportsScreen.css';
import { reportsAPI } from '../services/api';

export default function ReportsScreen({ defaultTab }) {
    const [activeReport, setActiveReport] = useState(defaultTab || 'sales');

    // Sync state with sidebar prop
    useEffect(() => {
        if (defaultTab) {
            setActiveReport(defaultTab);
        }
    }, [defaultTab]);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [filters, setFilters] = useState({ status: 'all', technician: 'all', product: 'all' });
    const [inventoryData, setInventoryData] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventoryError, setInventoryError] = useState('');

    // Sample data for reports
    const jobsData = [
        { id: 1, ticketNo: 'SRV-2025-001', customer: 'Rajesh Kumar', product: 'LG AC 1.5T', status: 'Completed', technician: 'Ramesh', amount: '₹2500', date: '2025-01-10' },
        { id: 2, ticketNo: 'SRV-2025-002', customer: 'Priya Singh', product: 'Samsung Fridge', status: 'In Progress', technician: 'Vikram', amount: '₹1800', date: '2025-01-11' },
        { id: 3, ticketNo: 'SRV-2025-003', customer: 'Amit Patel', product: 'Sony TV', status: 'Completed', technician: 'Ramesh', amount: '₹3200', date: '2025-01-12' },
    ];

    const technicianPerformance = [
        { name: 'Ramesh', totalJobs: 45, completed: 42, inProgress: 3, avgRating: 4.5, revenue: '₹125000' },
        { name: 'Vikram', totalJobs: 38, completed: 35, inProgress: 3, avgRating: 4.3, revenue: '₹98000' },
        { name: 'Suresh', totalJobs: 32, completed: 30, inProgress: 2, avgRating: 4.7, revenue: '₹87000' },
    ];

    const revenueData = [
        { month: 'January', revenue: '₹310000', jobs: 115, avgPerJob: '₹2695' },
        { month: 'December', revenue: '₹285000', jobs: 108, avgPerJob: '₹2638' },
        { month: 'November', revenue: '₹298000', jobs: 112, avgPerJob: '₹2660' },
    ];

    const fetchInventory = async () => {
        try {
            setInventoryLoading(true);
            setInventoryError('');
            const rows = await reportsAPI.getInventory();
            setInventoryData(rows || []);
        } catch (e) {
            console.error('Failed to fetch inventory report:', e);
            setInventoryError('Failed to load inventory report');
        } finally {
            setInventoryLoading(false);
        }
    };

    useEffect(() => {
        if (activeReport === 'stock') {
            fetchInventory();
        }
    }, [activeReport]);

    const handleExport = (format) => {
        alert(`Exporting ${activeReport} report as ${format.toUpperCase()}`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="reports-screen">
            <div className="reports-header">
                <h1>Reports & Analytics</h1>
                <div className="export-buttons">
                    <button className="btn-secondary" onClick={() => handleExport('pdf')}>
                        📄 Export PDF
                    </button>
                    <button className="btn-secondary" onClick={() => handleExport('excel')}>
                        📊 Export Excel
                    </button>
                    <button className="btn-secondary" onClick={handlePrint}>
                        🖨️ Print
                    </button>
                </div>
            </div>

            {/* Report Type Tabs Removed - Handled from Sidebar */}

            {/* Filters Section */}
            <div className="report-filters">
                <div className="filter-group">
                    <label>From Date</label>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    />
                </div>
                <div className="filter-group">
                    <label>To Date</label>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    />
                </div>
                {activeReport === 'jobs' && (
                    <>
                        <div className="filter-group">
                            <label>Status</label>
                            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <option value="all">All</option>
                                <option value="completed">Completed</option>
                                <option value="in progress">In Progress</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Technician</label>
                            <select value={filters.technician} onChange={(e) => setFilters({ ...filters, technician: e.target.value })}>
                                <option value="all">All</option>
                                <option value="ramesh">Ramesh</option>
                                <option value="vikram">Vikram</option>
                                <option value="suresh">Suresh</option>
                            </select>
                        </div>
                    </>
                )}
                <button className="btn-primary" style={{ marginTop: '20px' }}>
                    Generate Report
                </button>
            </div>

            {/* Report Content */}
            <div className="report-content">
                {activeReport === 'sales' && (
                    <div className="report-section">
                        <h2>Sales Performance Report</h2>
                        <div className="summary-cards">
                            <div className="summary-card">
                                <h3>Gross Sales</h3>
                                <p className="big-number">₹1,24,500</p>
                            </div>
                            <div className="summary-card">
                                <h3>Service Revenue</h3>
                                <p className="big-number">₹84,200</p>
                            </div>
                            <div className="summary-card">
                                <h3>Product Sales</h3>
                                <p className="big-number">₹40,300</p>
                            </div>
                            <div className="summary-card">
                                <h3>Total Invoices</h3>
                                <p className="big-number">128</p>
                            </div>
                        </div>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Ref No</th>
                                    <th>Customer</th>
                                    <th>Type</th>
                                    <th>Channel</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { date: '2024-03-15', ref: 'INV-001', customer: 'Anil Kumar', type: 'Service', channel: 'Counter', amount: '₹1,500' },
                                    { date: '2024-03-15', ref: 'INV-002', customer: 'Sunil Verma', type: 'Sale', channel: 'POS', amount: '₹12,400' },
                                    { date: '2024-03-14', ref: 'INV-003', customer: 'Meera Shah', type: 'Service', channel: 'On-site', amount: '₹2,100' },
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.date}</td>
                                        <td>{row.ref}</td>
                                        <td>{row.customer}</td>
                                        <td>{row.type}</td>
                                        <td>{row.channel}</td>
                                        <td style={{ fontWeight: 'bold' }}>{row.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeReport === 'expenses' && (
                    <div className="report-section">
                        <h2>Business Expense Report</h2>
                        <div className="summary-cards">
                            <div className="summary-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                <h3>Total Expenses</h3>
                                <p className="big-number" style={{ color: '#ef4444' }}>₹32,400</p>
                            </div>
                            <div className="summary-card">
                                <h3>Utility Bills</h3>
                                <p className="big-number">₹8,500</p>
                            </div>
                            <div className="summary-card">
                                <h3>Staff Payroll</h3>
                                <p className="big-number">₹18,000</p>
                            </div>
                            <div className="summary-card">
                                <h3>Misc Costs</h3>
                                <p className="big-number">₹5,900</p>
                            </div>
                        </div>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Voucher</th>
                                    <th>Description</th>
                                    <th>Paid Via</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { date: '2024-03-10', cat: 'Rent', ref: 'VCH-99', desc: 'Shop monthly rent', via: 'Bank', amount: '₹12,000' },
                                    { date: '2024-03-11', cat: 'Electricity', ref: 'VCH-101', desc: 'EB Bill March', via: 'Cash', amount: '₹3,200' },
                                    { date: '2024-03-12', cat: 'Spares', ref: 'VCH-105', desc: 'Bulk led sensor purchase', via: 'UPI', amount: '₹4,500' },
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.date}</td>
                                        <td>{row.cat}</td>
                                        <td>{row.ref}</td>
                                        <td>{row.desc}</td>
                                        <td>{row.via}</td>
                                        <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{row.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeReport === 'profit' && (
                    <div className="report-section">
                        <h2>Profit & Loss Report</h2>
                        <div className="summary-cards">
                            <div className="summary-card" style={{ borderLeft: '4px solid #10b981' }}>
                                <h3>Net Profit</h3>
                                <p className="big-number" style={{ color: '#10b981' }}>₹92,100</p>
                            </div>
                            <div className="summary-card">
                                <h3>Total Revenue</h3>
                                <p className="big-number">₹1,24,500</p>
                            </div>
                            <div className="summary-card">
                                <h3>Total Expense</h3>
                                <p className="big-number">₹32,400</p>
                            </div>
                            <div className="summary-card">
                                <h3>Profit Margin</h3>
                                <p className="big-number">74%</p>
                            </div>
                        </div>
                        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                <span style={{ fontWeight: 'bold' }}>Business Area</span>
                                <span style={{ fontWeight: 'bold' }}>Revenue Contribution</span>
                            </div>
                            {[
                                { area: 'Home Appliance Repair', rev: '₹45,000', margin: '80%' },
                                { area: 'Mobile Service', rev: '₹22,000', margin: '65%' },
                                { area: 'Spare Parts Sales', rev: '₹35,000', margin: '40%' },
                                { area: 'Accessories Sale', rev: '₹22,500', margin: '30%' },
                            ].map((row, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span>{row.area}</span>
                                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>{row.rev} <small style={{ fontWeight: 'normal', color: '#64748b' }}>({row.margin})</small></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeReport === 'stock' && (
                    <div className="report-section">
                        <h2>Stock Analysis Report</h2>
                        <div className="summary-cards" style={{ marginBottom: '20px' }}>
                            <div className="summary-card">
                                <h3>Total SKU Count</h3>
                                <p className="big-number">{inventoryData.length}</p>
                            </div>
                            <div className="summary-card">
                                <h3>High Value Items</h3>
                                <p className="big-number">12</p>
                            </div>
                            <div className="summary-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                <h3>Low Stock Alert</h3>
                                <p className="big-number" style={{ color: '#ef4444' }}>{inventoryData.filter(i => i.status === 'Low').length}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Inventory Value</h3>
                                <p className="big-number">₹4,12,000</p>
                            </div>
                        </div>
                        {inventoryLoading ? (
                            <div style={{ padding: '12px' }}>Loading stock data...</div>
                        ) : inventoryError ? (
                            <div style={{ padding: '12px' }}>{inventoryError}</div>
                        ) : (
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Item Identifier</th>
                                    <th>Starting Stock</th>
                                    <th>Units Sold/Used</th>
                                    <th>Current Hand</th>
                                    <th>Inventory Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryData.map((item) => (
                                    <tr key={item.id ?? item.item}>
                                        <td>{item.item}</td>
                                        <td>{item.initial_stock}</td>
                                        <td>{item.used}</td>
                                        <td>{item.remaining}</td>
                                        <td>
                                            <span className={`status-badge ${item.status === 'Low' ? 'cancelled' : 'completed'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                    </div>
                )}
                {activeReport === 'topCustomers' && (
                    <div className="report-section">
                        <h2 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Top Performing Customers</h2>
                        <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            <div className="summary-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                                <h3>VIP Customer</h3>
                                <p className="big-number" style={{ fontSize: '1.2rem' }}>Amit Patel</p>
                            </div>
                            <div className="summary-card">
                                <h3>Avg Revenue / Cust</h3>
                                <p className="big-number" style={{ fontSize: '1.2rem' }}>₹4,250</p>
                            </div>
                            <div className="summary-card">
                                <h3>Repeat Rate</h3>
                                <p className="big-number" style={{ fontSize: '1.2rem' }}>68%</p>
                            </div>
                            <div className="summary-card">
                                <h3>Loyalty Points Issued</h3>
                                <p className="big-number" style={{ fontSize: '1.2rem' }}>1,240</p>
                            </div>
                        </div>
                        <table className="report-table" style={{ marginTop: '16px' }}>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Customer Name</th>
                                    <th>Tier</th>
                                    <th>Total Spent</th>
                                    <th>Job Count</th>
                                    <th>Avg Bill</th>
                                    <th>Last Visit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { rank: 1, name: 'Amit Patel', tier: 'Platinum', spent: '₹42,500', count: 12, avg: '₹3,541', last: '2025-01-10' },
                                    { rank: 2, name: 'Rajesh Kumar', tier: 'Gold', spent: '₹12,400', count: 5, avg: '₹2,480', last: '2025-01-15' },
                                    { rank: 3, name: 'Priya Singh', tier: 'Silver', spent: '₹8,900', count: 3, avg: '₹2,966', last: '2025-01-12' },
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: '800', color: '#64748b' }}>#{row.rank}</td>
                                        <td style={{ fontWeight: '700' }}>{row.name}</td>
                                        <td>
                                            <span style={{ 
                                                padding: '2px 8px', 
                                                borderRadius: '4px', 
                                                fontSize: '0.65rem', 
                                                fontWeight: '800',
                                                background: row.tier === 'Platinum' ? '#fef3c7' : (row.tier === 'Gold' ? '#f1f5f9' : '#fff7ed'),
                                                color: row.tier === 'Platinum' ? '#92400e' : (row.tier === 'Gold' ? '#475569' : '#9a3412'),
                                                border: '1px solid currentColor'
                                            }}>
                                                {row.tier}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '700', color: '#10b981' }}>{row.spent}</td>
                                        <td>{row.count} Services</td>
                                        <td>{row.avg}</td>
                                        <td>{row.last}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
