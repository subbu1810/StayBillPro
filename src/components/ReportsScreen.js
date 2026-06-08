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
    
    // States for different reports
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState('');
    
    const [salesData, setSalesData] = useState({ summary: {}, recentInvoices: [], lineItems: [] });
    const [expensesData, setExpensesData] = useState({ summary: {}, recentExpenses: [] });
    const [profitData, setProfitData] = useState({ summary: {} });
    const [inventoryData, setInventoryData] = useState([]);
    const [topCustomersData, setTopCustomersData] = useState({ customers: [] });
    const [firmDetails, setFirmDetails] = useState(null);

    // Fetch firm details once on mount
    useEffect(() => {
        reportsAPI.getFirmDetails()
            .then(d => setFirmDetails(d))
            .catch(() => {});
    }, []);

    const fetchReportData = async () => {
        setReportLoading(true);
        setReportError('');
        try {
            const params = {};
            if (dateRange.from) params.from = dateRange.from;
            if (dateRange.to) params.to = dateRange.to;

            if (activeReport === 'sales') {
                const data = await reportsAPI.getSales(params);
                setSalesData(data);
            } else if (activeReport === 'expenses') {
                const data = await reportsAPI.getExpenses(params);
                setExpensesData(data);
            } else if (activeReport === 'profit') {
                const data = await reportsAPI.getProfit(params);
                setProfitData(data);
            } else if (activeReport === 'stock') {
                const data = await reportsAPI.getInventory(params);
                setInventoryData(data || []);
            } else if (activeReport === 'topCustomers') {
                const data = await reportsAPI.getTopCustomers(params);
                setTopCustomersData(data);
            }
        } catch (e) {
            console.error(`Failed to fetch ${activeReport} report:`, e);
            setReportError(`Failed to load ${activeReport} report.`);
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeReport]);

    // Build the firm header HTML block for PDF/print
    const buildFirmHeaderHTML = () => {
        const f = firmDetails;
        if (!f) return '<p style="color:#64748b;font-size:11px">Generated: ' + new Date().toLocaleDateString('en-IN') + '</p>';
        return `
            <table style="width:100%;border-bottom:2px solid #1e293b;padding-bottom:12px;margin-bottom:14px">
                <tr>
                    <td style="vertical-align:top">
                        <div style="font-size:18px;font-weight:900;color:#1e293b">${f.businessName}</div>
                        <div style="font-size:11px;color:#475569;margin-top:2px">${f.businessType || ''}</div>
                        <div style="font-size:11px;color:#475569;margin-top:4px">${f.address || ''}</div>
                        <div style="font-size:11px;color:#475569">${f.phone ? '📞 ' + f.phone : ''} ${f.email ? '&nbsp;✉ ' + f.email : ''}</div>
                    </td>
                    <td style="text-align:right;vertical-align:top">
                        <div style="font-size:11px;font-weight:700;color:#1e293b">GSTIN: <span style="color:#3b82f6">${f.gstin}</span></div>
                        <div style="font-size:11px;color:#64748b;margin-top:2px">Branch: ${f.branchName || 'Main'}</div>
                        <div style="font-size:11px;color:#64748b">State: ${f.state || ''} ${f.pincode ? '- ' + f.pincode : ''}</div>
                        <div style="font-size:11px;color:#64748b;margin-top:4px">Print Date: ${new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</div>
                    </td>
                </tr>
            </table>`;
    };

    // ---- Export to CSV ----
    const handleExportCSV = () => {
        let headers = [];
        let rows = [];
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

        if (activeReport === 'sales') {
            const items = salesData.lineItems || [];
            if (!items.length) { alert('No sales data to export.'); return; }
            headers = ['S.No','Invoice No','Date','Customer','Product','HSN Code','SKU','Serial No','Qty','Unit Price','Taxable Val','GST %','CGST','SGST','Total GST','Line Total','Payment'];
            rows = items.map((r, i) => [
                i + 1, r.invoice_no, formatDate(r.invoice_date), r.customer_name, r.product_name,
                r.hsn_code, r.sku, r.serial_number, r.quantity, r.unit_price,
                r.taxable_val, r.gst_rate, r.cgst, r.sgst, r.gst_amount, r.line_total, r.payment_method
            ]);
        } else if (activeReport === 'expenses') {
            const items = expensesData.recentExpenses || [];
            if (!items.length) { alert('No expense data to export.'); return; }
            headers = ['Date','Category','Voucher','Description','Paid Via','Amount'];
            rows = items.map(r => [formatDate(r.date), r.cat, r.ref, r.descr, r.via, r.amount]);
        } else if (activeReport === 'stock') {
            if (!inventoryData.length) { alert('No stock data to export.'); return; }
            headers = ['Item', 'Brand', 'SKU', 'HSN Code', 'Unit', 'GST Rate', 'Qty on Hand', 'Purchase Price', 'Selling Price', 'Status', 'Expiry Date'];
            rows = inventoryData.map(r => [
                r.item, r.brand, r.sku, r.hsn_code, r.unit, r.gst_rate, r.remaining, 
                r.purchase_price, r.price, r.remaining < 5 ? 'Low' : 'Available', formatDate(r.expiry_date)
            ]);
        } else if (activeReport === 'topCustomers') {
            const items = topCustomersData.customers || [];
            if (!items.length) { alert('No customer data to export.'); return; }
            headers = ['Rank','Customer','Phone','Total Spent','Invoice Count','Avg Bill','Last Visit'];
            rows = items.map((r, i) => [i + 1, r.name, r.phone, r.spent, r.count, (r.spent / r.count).toFixed(2), formatDate(r.last)]);
        } else if (activeReport === 'profit') {
            const s = profitData.summary || {};
            headers = ['Metric','Value'];
            rows = [['Net Profit', s.netProfit], ['Total Revenue', s.totalRevenue], ['Total Expenses', s.totalExpenses], ['Profit Margin %', s.profitMargin]];
        } else {
            alert('No data available to export.'); return;
        }

        const csvContent = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
        const bom = '\uFEFF'; // UTF-8 BOM so Excel reads Indian Rupee correctly
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeReport}_report_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ---- Export / Print as PDF ----
    const handlePrintOrPDF = (mode) => {
        const reportTitle = {
            sales: 'Sales Performance Report',
            expenses: 'Business Expense Report',
            profit: 'Profit & Loss Report',
            stock: 'Stock Analysis Report',
            topCustomers: 'Top Customers Report'
        }[activeReport] || 'Report';

        // Build HTML table from current data
        let tableHTML = '';
        if (activeReport === 'sales') {
            const items = salesData.lineItems || [];
            tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px">
                <thead style="background:#f1f5f9">
                    <tr><th>S.No</th><th>Invoice No</th><th>Date</th><th>Customer</th><th>Product</th><th>HSN</th><th>Qty</th><th>Taxable Val</th><th>GST%</th><th>CGST</th><th>SGST</th><th>Total GST</th><th>Line Total</th><th>Payment</th></tr>
                </thead><tbody>
                    ${items.map((r, i) => `<tr>
                        <td>${i+1}</td><td><b>${r.invoice_no}</b></td><td>${formatDate(r.invoice_date)}</td>
                        <td>${r.customer_name||''}</td><td>${r.product_name}</td><td>${r.hsn_code||'N/A'}</td>
                        <td style="text-align:right">${r.quantity}</td>
                        <td style="text-align:right">₹${parseFloat(r.taxable_val||0).toFixed(2)}</td>
                        <td style="text-align:center">${parseFloat(r.gst_rate||0)}%</td>
                        <td style="text-align:right">₹${parseFloat(r.cgst||0).toFixed(2)}</td>
                        <td style="text-align:right">₹${parseFloat(r.sgst||0).toFixed(2)}</td>
                        <td style="text-align:right"><b>₹${parseFloat(r.gst_amount||0).toFixed(2)}</b></td>
                        <td style="text-align:right"><b>₹${parseFloat(r.line_total||0).toFixed(2)}</b></td>
                        <td>${r.payment_method||''}</td>
                    </tr>`).join('')}
                    <tr style="background:#f8fafc;font-weight:bold">
                        <td colspan="7" style="text-align:right">TOTALS →</td>
                        <td style="text-align:right">₹${items.reduce((s,r)=>s+parseFloat(r.taxable_val||0),0).toFixed(2)}</td>
                        <td></td>
                        <td style="text-align:right">₹${items.reduce((s,r)=>s+parseFloat(r.cgst||0),0).toFixed(2)}</td>
                        <td style="text-align:right">₹${items.reduce((s,r)=>s+parseFloat(r.sgst||0),0).toFixed(2)}</td>
                        <td style="text-align:right">₹${items.reduce((s,r)=>s+parseFloat(r.gst_amount||0),0).toFixed(2)}</td>
                        <td style="text-align:right">₹${items.reduce((s,r)=>s+parseFloat(r.line_total||0),0).toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tbody></table>`;
        } else if (activeReport === 'expenses') {
            const items = expensesData.recentExpenses || [];
            tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px">
                <thead style="background:#f1f5f9"><tr><th>Date</th><th>Category</th><th>Voucher</th><th>Description</th><th>Via</th><th>Amount</th></tr></thead>
                <tbody>${items.map(r=>`<tr><td>${formatDate(r.date)}</td><td>${r.cat}</td><td>${r.ref}</td><td>${r.descr}</td><td>${r.via}</td><td style="text-align:right">₹${parseFloat(r.amount||0).toFixed(2)}</td></tr>`).join('')}</tbody>
            </table>`;
        } else if (activeReport === 'stock') {
            tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px">
                <thead style="background:#f1f5f9"><tr><th>Item</th><th>Brand</th><th>SKU</th><th>HSN</th><th>Unit</th><th>GST %</th><th style="text-align:right">Qty</th><th style="text-align:right">Purchase</th><th style="text-align:right">Selling</th><th>Status</th><th>Expiry Date</th></tr></thead>
                <tbody>${inventoryData.map(r=>`<tr><td>${r.item}</td><td>${r.brand||'-'}</td><td>${r.sku||'-'}</td><td>${r.hsn_code||'-'}</td><td>${r.unit||'-'}</td><td>${r.gst_rate||0}%</td><td style="text-align:right">${r.remaining}</td><td style="text-align:right">₹${parseFloat(r.purchase_price||0).toFixed(2)}</td><td style="text-align:right">₹${parseFloat(r.price||0).toFixed(2)}</td><td>${r.remaining<5?'Low':'Available'}</td><td>${formatDate(r.expiry_date)}</td></tr>`).join('')}</tbody>
            </table>`;
        } else if (activeReport === 'topCustomers') {
            const items = topCustomersData.customers || [];
            tableHTML = `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px">
                <thead style="background:#f1f5f9"><tr><th>#</th><th>Customer</th><th>Phone</th><th>Total Spent</th><th>Invoices</th><th>Avg Bill</th><th>Last Visit</th></tr></thead>
                <tbody>${items.map((r,i)=>`<tr><td>${i+1}</td><td><b>${r.name||''}</b></td><td>${r.phone||''}</td><td style="text-align:right">₹${parseFloat(r.spent||0).toFixed(2)}</td><td style="text-align:right">${r.count}</td><td style="text-align:right">₹${(r.spent/r.count).toFixed(2)}</td><td>${formatDate(r.last)}</td></tr>`).join('')}</tbody>
            </table>`;
        } else if (activeReport === 'profit') {
            const s = profitData.summary || {};
            tableHTML = `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:50%;font-size:13px">
                <tr><td><b>Net Profit</b></td><td style="text-align:right">₹${parseFloat(s.netProfit||0).toFixed(2)}</td></tr>
                <tr><td>Total Revenue</td><td style="text-align:right">₹${parseFloat(s.totalRevenue||0).toFixed(2)}</td></tr>
                <tr><td>Total Expenses</td><td style="text-align:right">₹${parseFloat(s.totalExpenses||0).toFixed(2)}</td></tr>
                <tr><td>Profit Margin</td><td style="text-align:right">${s.profitMargin||0}%</td></tr>
            </table>`;
        }

        const period = dateRange.from && dateRange.to
            ? `Period: ${dateRange.from} to ${dateRange.to}`
            : `Generated: ${new Date().toLocaleDateString('en-IN')}`;

        const printWin = window.open('', '_blank', 'width=1100,height=700');
        printWin.document.write(`<!DOCTYPE html><html><head>
            <title>${reportTitle}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #1e293b; }
                h1 { font-size: 16px; margin-bottom: 4px; }
                .meta { font-size: 11px; color: #64748b; margin-bottom: 16px; }
                table th { background: #f1f5f9; }
                @media print { @page { margin: 1cm; size: landscape; } }
            </style>
        </head><body>
            ${buildFirmHeaderHTML()}
            <h2 style="font-size:14px;margin:0 0 4px 0;color:#0f172a">${reportTitle}</h2>
            <p style="font-size:11px;color:#64748b;margin:0 0 14px 0">${period}</p>
            ${tableHTML}
        </body></html>`);
        printWin.document.close();
        printWin.focus();
        if (mode === 'pdf') {
            setTimeout(() => { printWin.print(); }, 400);
        } else {
            setTimeout(() => { printWin.print(); printWin.close(); }, 400);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    return (
        <div className="reports-screen">
            <div className="reports-header">
                <h1>Reports &amp; Analytics</h1>
                {firmDetails && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#1e293b' }}>{firmDetails.businessName}</span>
                        <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: '700' }}>GSTIN: {firmDetails.gstin}</span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{firmDetails.city}, {firmDetails.state} · {firmDetails.phone}</span>
                    </div>
                )}
                <div className="export-buttons">
                    <button className="btn-secondary" onClick={() => handlePrintOrPDF('pdf')} title="Save as PDF via print dialog">
                        📄 Export PDF
                    </button>
                    <button className="btn-secondary" onClick={handleExportCSV} title="Download as CSV (opens in Excel)">
                        📊 Export Excel
                    </button>
                    <button className="btn-secondary" onClick={() => handlePrintOrPDF('print')} title="Print report">
                        🖨️ Print
                    </button>
                </div>
            </div>

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
                <button className="btn-primary" style={{ marginTop: '20px' }} onClick={fetchReportData} disabled={reportLoading}>
                    {reportLoading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>

            {/* Report Content */}
            <div className="report-content">
                {reportError && (
                    <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>
                        {reportError}
                    </div>
                )}
                
                {activeReport === 'sales' && !reportError && (
                    <div className="report-section">
                        <h2>Sales Performance Report</h2>
                        <div className="summary-cards">
                            <div className="summary-card">
                                <h3>Gross Sales</h3>
                                <p className="big-number">{formatCurrency(salesData.summary.grossSales)}</p>
                            </div>
                            <div className="summary-card" style={{ borderLeft: '4px solid #6366f1' }}>
                                <h3>Taxable Value</h3>
                                <p className="big-number" style={{ color: '#6366f1' }}>{formatCurrency(salesData.summary.taxableValue)}</p>
                            </div>
                            <div className="summary-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                <h3>Total GST Collected</h3>
                                <p className="big-number" style={{ color: '#f59e0b' }}>{formatCurrency(salesData.summary.totalGST)}</p>
                            </div>
                            <div className="summary-card">
                                <h3>Total Invoices</h3>
                                <p className="big-number">{salesData.summary.totalInvoices || 0}</p>
                            </div>
                        </div>
                        {reportLoading ? <p>Loading data...</p> : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="report-table" style={{ fontSize: '0.78rem', minWidth: '1100px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>S.No</th>
                                            <th>Invoice No</th>
                                            <th>Date</th>
                                            <th>Customer</th>
                                            <th>Product Name</th>
                                            <th>HSN Code</th>
                                            <th>SKU</th>
                                            <th>Serial No</th>
                                            <th style={{ textAlign: 'right' }}>Qty</th>
                                            <th style={{ textAlign: 'right' }}>Unit Price</th>
                                            <th style={{ textAlign: 'right' }}>Taxable Val</th>
                                            <th style={{ textAlign: 'right' }}>GST %</th>
                                            <th style={{ textAlign: 'right' }}>CGST</th>
                                            <th style={{ textAlign: 'right' }}>SGST</th>
                                            <th style={{ textAlign: 'right' }}>Total GST</th>
                                            <th style={{ textAlign: 'right' }}>Line Total</th>
                                            <th>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesData.lineItems && salesData.lineItems.length > 0 ? (
                                            salesData.lineItems.map((row, i) => (
                                                <tr key={i}>
                                                    <td style={{ color: '#94a3b8', fontWeight: '600' }}>{row.sno || i + 1}</td>
                                                    <td style={{ fontWeight: '800', color: '#3b82f6' }}>{row.invoice_no}</td>
                                                    <td>{formatDate(row.invoice_date)}</td>
                                                    <td>{row.customer_name || '-'}</td>
                                                    <td style={{ fontWeight: '600' }}>{row.product_name}</td>
                                                    <td>
                                                        <span style={{ background: row.hsn_code !== 'N/A' ? '#eff6ff' : '#f8fafc', color: row.hsn_code !== 'N/A' ? '#1d4ed8' : '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                                                            {row.hsn_code || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: '#64748b', fontSize: '0.72rem' }}>{row.sku || '-'}</td>
                                                    <td style={{ color: '#64748b', fontSize: '0.72rem' }}>{row.serial_number || '-'}</td>
                                                    <td style={{ textAlign: 'right' }}>{row.quantity}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(row.unit_price)}</td>
                                                    <td style={{ textAlign: 'right', color: '#475569' }}>{formatCurrency(row.taxable_val)}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <span style={{ background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>
                                                            {parseFloat(row.gst_rate) || 0}%
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right', color: '#7c3aed' }}>{formatCurrency(row.cgst)}</td>
                                                    <td style={{ textAlign: 'right', color: '#7c3aed' }}>{formatCurrency(row.sgst)}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#f59e0b' }}>{formatCurrency(row.gst_amount)}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: '800' }}>{formatCurrency(row.line_total)}</td>
                                                    <td>
                                                        <span style={{ background: row.payment_method === 'cash' ? '#dcfce7' : row.payment_method === 'upi' ? '#dbeafe' : '#fef9c3', color: row.payment_method === 'cash' ? '#15803d' : row.payment_method === 'upi' ? '#1d4ed8' : '#854d0e', padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                                            {row.payment_method || 'cash'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="17" style={{textAlign: 'center', padding: '20px'}}>No sales data found for the selected period.</td></tr>
                                        )}
                                    </tbody>
                                    {salesData.lineItems && salesData.lineItems.length > 0 && (
                                        <tfoot>
                                            <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '0.8rem' }}>
                                                <td colSpan="10" style={{ textAlign: 'right', padding: '10px', color: '#475569' }}>TOTALS →</td>
                                                <td style={{ textAlign: 'right', padding: '10px' }}>{formatCurrency(salesData.lineItems.reduce((s, r) => s + parseFloat(r.taxable_val || 0), 0))}</td>
                                                <td></td>
                                                <td style={{ textAlign: 'right', padding: '10px', color: '#7c3aed' }}>{formatCurrency(salesData.lineItems.reduce((s, r) => s + parseFloat(r.cgst || 0), 0))}</td>
                                                <td style={{ textAlign: 'right', padding: '10px', color: '#7c3aed' }}>{formatCurrency(salesData.lineItems.reduce((s, r) => s + parseFloat(r.sgst || 0), 0))}</td>
                                                <td style={{ textAlign: 'right', padding: '10px', color: '#f59e0b' }}>{formatCurrency(salesData.lineItems.reduce((s, r) => s + parseFloat(r.gst_amount || 0), 0))}</td>
                                                <td style={{ textAlign: 'right', padding: '10px' }}>{formatCurrency(salesData.lineItems.reduce((s, r) => s + parseFloat(r.line_total || 0), 0))}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        )}
                    </div>
                )}


                {activeReport === 'expenses' && !reportError && (
                    <div className="report-section">
                        <h2>Business Expense Report</h2>
                        <div className="summary-cards">
                            <div className="summary-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                <h3>Total Expenses</h3>
                                <p className="big-number" style={{ color: '#ef4444' }}>{formatCurrency(expensesData.summary.totalExpenses)}</p>
                            </div>
                            {expensesData.summary.topCategories && expensesData.summary.topCategories.map((cat, i) => (
                                <div className="summary-card" key={i}>
                                    <h3>{cat.category || 'Other'}</h3>
                                    <p className="big-number">{formatCurrency(cat.amount)}</p>
                                </div>
                            ))}
                        </div>
                        {reportLoading ? <p>Loading data...</p> : (
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
                                    {expensesData.recentExpenses && expensesData.recentExpenses.length > 0 ? (
                                        expensesData.recentExpenses.map((row, i) => (
                                            <tr key={i}>
                                                <td>{formatDate(row.date)}</td>
                                                <td>{row.cat}</td>
                                                <td>{row.ref}</td>
                                                <td>{row.descr}</td>
                                                <td>{row.via}</td>
                                                <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatCurrency(row.amount)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No expense data found for the selected period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeReport === 'profit' && !reportError && (
                    <div className="report-section">
                        <h2>Profit & Loss Report</h2>
                        {reportLoading ? <p>Loading data...</p> : (
                            <>
                                <div className="summary-cards">
                                    <div className="summary-card" style={{ borderLeft: '4px solid #10b981' }}>
                                        <h3>Net Profit</h3>
                                        <p className="big-number" style={{ color: '#10b981' }}>{formatCurrency(profitData.summary.netProfit)}</p>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Total Revenue</h3>
                                        <p className="big-number">{formatCurrency(profitData.summary.totalRevenue)}</p>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Total Expense</h3>
                                        <p className="big-number">{formatCurrency(profitData.summary.totalExpenses)}</p>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Profit Margin</h3>
                                        <p className="big-number">{profitData.summary.profitMargin || 0}%</p>
                                    </div>
                                </div>
                                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                                        <span style={{ fontWeight: 'bold' }}>Business Area</span>
                                        <span style={{ fontWeight: 'bold' }}>Revenue Contribution</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                        <span>Total Business Revenue</span>
                                        <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(profitData.summary.totalRevenue)}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeReport === 'stock' && !reportError && (
                    <div className="report-section">
                        <h2>Stock Analysis Report</h2>
                        <div className="summary-cards" style={{ marginBottom: '20px' }}>
                            <div className="summary-card">
                                <h3>Total SKU Count</h3>
                                <p className="big-number">{inventoryData.length}</p>
                            </div>
                            <div className="summary-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                <h3>Low Stock Alert</h3>
                                <p className="big-number" style={{ color: '#ef4444' }}>{inventoryData.filter(i => i.remaining < 5).length}</p>
                            </div>
                        </div>
                        {reportLoading ? (
                            <div style={{ padding: '12px' }}>Loading stock data...</div>
                        ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="report-table" style={{ minWidth: '1000px', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th>Item Identifier</th>
                                        <th>Brand</th>
                                        <th>SKU</th>
                                        <th>HSN Code</th>
                                        <th>Unit</th>
                                        <th>GST %</th>
                                        <th style={{ textAlign: 'right' }}>Current Hand</th>
                                        <th style={{ textAlign: 'right' }}>Purchase Price</th>
                                        <th style={{ textAlign: 'right' }}>Selling Price</th>
                                        <th>Inventory Status</th>
                                        <th>Expiry Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventoryData.length > 0 ? (
                                        inventoryData.map((item) => (
                                            <tr key={item.id ?? item.item}>
                                                <td style={{ fontWeight: '600' }}>{item.item}</td>
                                                <td>{item.brand || '-'}</td>
                                                <td style={{ color: '#64748b' }}>{item.sku || '-'}</td>
                                                <td style={{ color: '#64748b' }}>{item.hsn_code || '-'}</td>
                                                <td style={{ color: '#64748b' }}>{item.unit || '-'}</td>
                                                <td>{item.gst_rate || 0}%</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.remaining}</td>
                                                <td style={{ textAlign: 'right', color: '#64748b' }}>{formatCurrency(item.purchase_price)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(item.price)}</td>
                                                <td>
                                                    <span className={`status-badge ${item.remaining < 5 ? 'cancelled' : 'completed'}`}>
                                                        {item.remaining < 5 ? 'Low' : 'Available'}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#64748b' }}>{formatDate(item.expiry_date)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="11" style={{textAlign: 'center', padding: '20px'}}>No stock data available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        )}
                    </div>
                )}

                {activeReport === 'topCustomers' && !reportError && (
                    <div className="report-section">
                        <h2 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Top Performing Customers</h2>
                        {reportLoading ? <p>Loading data...</p> : (
                            <>
                                <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                    <div className="summary-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                                        <h3>VIP Customer</h3>
                                        <p className="big-number" style={{ fontSize: '1.2rem' }}>{topCustomersData.customers?.[0]?.name || '-'}</p>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Top Spent</h3>
                                        <p className="big-number" style={{ fontSize: '1.2rem' }}>{formatCurrency(topCustomersData.customers?.[0]?.spent || 0)}</p>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Total VIPs</h3>
                                        <p className="big-number" style={{ fontSize: '1.2rem' }}>{topCustomersData.customers?.length || 0}</p>
                                    </div>
                                </div>
                                <table className="report-table" style={{ marginTop: '16px' }}>
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Customer Name</th>
                                            <th>Phone</th>
                                            <th>Total Spent</th>
                                            <th>Job Count</th>
                                            <th>Avg Bill</th>
                                            <th>Last Visit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCustomersData.customers && topCustomersData.customers.length > 0 ? (
                                            topCustomersData.customers.map((row, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: '800', color: '#64748b' }}>#{i + 1}</td>
                                                    <td style={{ fontWeight: '700' }}>{row.name || 'Unknown'}</td>
                                                    <td>{row.phone || '-'}</td>
                                                    <td style={{ fontWeight: '700', color: '#10b981' }}>{formatCurrency(row.spent)}</td>
                                                    <td>{row.count} Invoices</td>
                                                    <td>{formatCurrency(row.spent / row.count)}</td>
                                                    <td>{formatDate(row.last)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No customer data found for the selected period.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
