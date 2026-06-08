import React, { useState, useEffect } from 'react';
import '../styles/SuppliersScreen.css';
import { usePopup } from './ui/PopupProvider';
import { suppliersAPI, purchaseAPI } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SuppliersScreen({ defaultTab }) {
    const popup = usePopup();
    const [viewMode, setViewMode] = useState(defaultTab || 'manage');
    const [search, setSearch] = useState('');
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Ledger State
    const [selectedVendorForLedger, setSelectedVendorForLedger] = useState('');
    const [ledgerData, setLedgerData] = useState([]);
    const [ledgerSummary, setLedgerSummary] = useState(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);

    // Dues & Payments State
    const [duesData, setDuesData] = useState({ summary: {}, suppliers: [] });
    const [duesLoading, setDuesLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentRef, setPaymentRef] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);

    // Payment History Filters
    const [paymentFilterSupplier, setPaymentFilterSupplier] = useState('');
    const [paymentFilterMethod, setPaymentFilterMethod] = useState('');
    const [paymentFilterDateFrom, setPaymentFilterDateFrom] = useState('');
    const [paymentFilterDateTo, setPaymentFilterDateTo] = useState('');

    // Purchase History State
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);

    const API_BASE = process.env.REACT_APP_API_URL || 'https://staybillproapi.ssquareg.tech/api';

    // Fetch suppliers from backend
    const fetchSuppliers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/suppliers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch suppliers');
            const data = await res.json();
            setVendors(data);
        } catch (err) {
            setError('Could not load suppliers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSupplierLedger = async (supplierId) => {
        if (!supplierId) {
            setLedgerData([]);
            setLedgerSummary(null);
            return;
        }
        setLedgerLoading(true);
        try {
            const res = await suppliersAPI.getLedger(supplierId);
            if (res.success) {
                setLedgerData(res.ledger);
                setLedgerSummary(res.summary);
            }
        } catch (err) {
            popup.showError('Could not load ledger.');
        } finally {
            setLedgerLoading(false);
        }
    };

    const fetchDuesData = async () => {
        setDuesLoading(true);
        try {
            const res = await suppliersAPI.getDues();
            if (res.success) {
                setDuesData({ summary: res.summary, suppliers: res.suppliers });
            }
        } catch (err) {
            console.error(err);
            popup.showError("Failed to fetch dues data");
        } finally {
            setDuesLoading(false);
        }
    };

    const fetchPaymentHistory = async () => {
        setPaymentHistoryLoading(true);
        try {
            const res = await suppliersAPI.getPayments();
            if (res.success) {
                setPaymentHistory(res.payments);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPaymentHistoryLoading(false);
        }
    };

    const fetchPurchaseHistory = async () => {
        setPurchaseHistoryLoading(true);
        try {
            const res = await purchaseAPI.getOrders();
            if (res.success) {
                setPurchaseHistory(res.purchaseOrders);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPurchaseHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplierLedger(selectedVendorForLedger);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVendorForLedger]);

    // Sync with Sidebar
    useEffect(() => {
        if (defaultTab) setViewMode(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        if (viewMode === 'payables') {
            fetchDuesData();
        } else if (viewMode === 'payments') {
            fetchPaymentHistory();
        } else if (viewMode === 'purchases') {
            fetchPurchaseHistory();
        }
    }, [viewMode]);

    const handleExportCSV = () => {
        if (!ledgerData || ledgerData.length === 0) {
            popup.showError("No ledger data to export.");
            return;
        }
        
        let csvContent = "Date,Type,Ref No,Purchases (Cr),Payments (Dr),Balance\n";
        ledgerData.forEach(entry => {
            const date = new Date(entry.date).toLocaleDateString();
            const type = entry.type;
            const ref = entry.ref_no || '-';
            const pur = entry.purchases_dr !== '-' ? entry.purchases_dr : '-';
            const pay = entry.payments_cr !== '-' ? entry.payments_cr : '-';
            const bal = `${entry.balance} ${entry.balance_type}`;
            csvContent += `"${date}","${type}","${ref}","${pur}","${pay}","${bal}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `supplier_ledger_${selectedVendorForLedger}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!ledgerData || ledgerData.length === 0) {
            popup.showError("No ledger data to export.");
            return;
        }

        const doc = new jsPDF();
        const selectedVendorObj = vendors.find(v => v.id.toString() === selectedVendorForLedger.toString());
        const vendorName = selectedVendorObj ? selectedVendorObj.supplier_name : 'Vendor';

        doc.setFontSize(16);
        doc.text("Supplier Ledger Statement", 14, 20);
        
        doc.setFontSize(10);
        doc.text(`Supplier: ${vendorName}`, 14, 28);
        doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 34);
        
        if (ledgerSummary) {
            doc.text(`Total Purchase: Rs. ${ledgerSummary.total_purchase}`, 14, 42);
            doc.text(`Total Paid: Rs. ${ledgerSummary.total_paid}`, 14, 48);
            doc.text(`Net Balance: Rs. ${ledgerSummary.net_balance} (${ledgerSummary.balance_type})`, 100, 42);
        }

        const tableColumn = ["Date", "Type", "Ref No", "Purchases (Cr)", "Payments (Dr)", "Balance"];
        const tableRows = [];

        ledgerData.forEach(entry => {
            const rowData = [
                new Date(entry.date).toLocaleDateString(),
                entry.type,
                entry.ref_no || '-',
                entry.purchases_dr !== '-' ? `Rs. ${entry.purchases_dr}` : '-',
                entry.payments_cr !== '-' ? `Rs. ${entry.payments_cr}` : '-',
                `Rs. ${entry.balance} ${entry.balance_type}`
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 8 }
        });

        doc.save(`supplier_ledger_${vendorName}.pdf`);
    };

    const handleDownloadReceipt = (payment) => {
        // Find supplier details for address and GSTIN
        const supplierObj = vendors.find(v => v.supplier_name === payment.supplier_name);
        const supplierAddress = supplierObj ? [
            supplierObj.address_line1, 
            supplierObj.address_line2, 
            supplierObj.city, 
            supplierObj.state
        ].filter(Boolean).join(', ') : '-';
        const supplierGstin = supplierObj?.gstin || 'N/A';

        // Create a PDF that is exactly 1/3 of an A4 page (210mm x 99mm)
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [210, 99]
        });
        
        // Header
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PAYMENT RECEIPT", 105, 10, null, null, "center");

        // Firm Details Section
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        
        // From (User Firm)
        doc.setFont("helvetica", "bold");
        doc.text("Paid By:", 10, 22);
        doc.setFont("helvetica", "normal");
        doc.text("StayBillPro", 10, 27);
        doc.text("GSTIN: N/A", 10, 32); // Placeholder for user's firm GSTIN if needed later

        // To (Supplier Firm)
        doc.setFont("helvetica", "bold");
        doc.text("Paid To:", 105, 22);
        doc.setFont("helvetica", "normal");
        doc.text(payment.supplier_name, 105, 27);
        doc.setFontSize(8);
        const splitAddress = doc.splitTextToSize(supplierAddress !== '-' ? supplierAddress : 'Address: N/A', 90);
        doc.text(splitAddress, 105, 31);
        doc.text(`GSTIN: ${supplierGstin}`, 105, 31 + (splitAddress.length * 3.5));

        // Info Table
        doc.setTextColor(15, 23, 42);
        
        autoTable(doc, {
            body: [
                ['Receipt No:', payment.reference_no || 'N/A', 'Date:', new Date(payment.payment_date).toLocaleDateString()],
                ['Amount:', `Rs. ${Number(payment.amount).toLocaleString()}`, 'Payment Mode:', payment.payment_method],
                ['Notes:', payment.notes || '-', '', '']
            ],
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105], cellWidth: 35 },
                1: { textColor: [15, 23, 42], fontStyle: 'bold', cellWidth: 60 },
                2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105], cellWidth: 35 },
                3: { textColor: [15, 23, 42] }
            },
            startY: 42,
            margin: { left: 10, right: 10 }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY || 60;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "normal");
        doc.text("Thank you for your business. Generated by StayBillPro", 105, finalY + 10, null, null, "center");

        // Open in new tab for preview instead of downloading directly
        const pdfBlobUrl = doc.output('bloburl');
        window.open(pdfBlobUrl, '_blank');
    };

    const filteredPayments = paymentHistory.filter(payment => {
        let match = true;
        if (paymentFilterSupplier && payment.supplier_name !== paymentFilterSupplier) match = false;
        if (paymentFilterMethod && payment.payment_method !== paymentFilterMethod) match = false;
        
        if (paymentFilterDateFrom) {
            const fromDate = new Date(paymentFilterDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (new Date(payment.payment_date) < fromDate) match = false;
        }
        if (paymentFilterDateTo) {
            const toDate = new Date(paymentFilterDateTo);
            toDate.setHours(23, 59, 59, 999);
            if (new Date(payment.payment_date) > toDate) match = false;
        }
        return match;
    });

    const handleRecordPayment = async () => {
        if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) {
            popup.showError("Please enter a valid amount.");
            return;
        }

        try {
            const payload = {
                supplier_name: selectedSupplierForPayment.supplier_name,
                amount: Number(paymentAmount),
                payment_method: paymentMethod,
                reference_no: paymentRef,
                notes: paymentNotes
            };

            const res = await suppliersAPI.addPayment(payload);
            if (res.success) {
                popup.showSuccess("Payment recorded successfully.");
                setShowPaymentModal(false);
                setPaymentAmount('');
                setPaymentRef('');
                setPaymentNotes('');
                fetchDuesData(); // refresh dues
                fetchSuppliers(); // refresh opening balances/etc if needed
            } else {
                popup.showError(res.message || "Failed to record payment.");
            }
        } catch (error) {
            console.error(error);
            popup.showError("Failed to record payment.");
        }
    };

    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        supplier_code: '',
        supplier_name: '',
        contact_person: '',
        mobile: '',
        alternate_mobile: '',
        email: '',
        website: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        gstin: '',
        pan_no: '',
        business_type: 'Manufacturer',
        registration_no: '',
        opening_balance: 0,
        balance_type: 'Payable',
        credit_limit: 0,
        payment_terms_days: 0
    });

    const openModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({ ...supplier });
        } else {
            setEditingSupplier(null);
            setFormData({
                supplier_code: '',
                supplier_name: '',
                contact_person: '',
                mobile: '',
                alternate_mobile: '',
                email: '',
                website: '',
                address_line1: '',
                address_line2: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India',
                gstin: '',
                pan_no: '',
                business_type: 'Manufacturer',
                registration_no: '',
                opening_balance: 0,
                balance_type: 'Payable',
                credit_limit: 0,
                payment_terms_days: 0
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            let res;
            if (editingSupplier) {
                res = await fetch(`${API_BASE}/suppliers/${editingSupplier.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                res = await fetch(`${API_BASE}/suppliers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error saving supplier');
            }

            fetchSuppliers();
            setShowModal(false);
            popup.showSuccess('Supplier saved successfully');
        } catch (err) {
            popup.showError(err.message);
        }
    };

    const handleDelete = async (id) => {
        const ok = await popup.confirm({
            title: 'Delete Supplier',
            message: 'Are you sure you want to remove this supplier?',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });
        if (!ok) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/suppliers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete supplier');
            fetchSuppliers();
            popup.showSuccess('Supplier removed');
        } catch (err) {
            popup.showError(err.message);
        }
    };

    return (
        <div className="suppliers-screen">
            <div className="crm-header">
                <h1 style={{ fontSize: '1rem', margin: 0, fontWeight: '800' }}>
                    {viewMode === 'manage' && 'Manage Suppliers'}
                    {viewMode === 'ledger' && 'Supplier Ledger'}
                    {viewMode === 'payables' && 'Payables / Dues'}
                    {viewMode === 'payments' && 'Vendor Payment History'}
                    {viewMode === 'advance' && 'Advance Payments'}
                    {viewMode === 'purchases' && 'Purchase History'}
                    {viewMode === 'returns' && 'Purchase Returns'}
                    {viewMode === 'po' && 'Pending Purchase Orders'}
                    {viewMode === 'performance' && 'Supplier Performance'}
                </h1>
            </div>

            {error && <div className="crm-error" style={{ marginBottom: 12 }}>⚠ {error}</div>}

            {viewMode === 'manage' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="crm-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Quick Search Vendor / Manufacturer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ flex: 1, padding: '6px 12px 6px 32px', fontSize: '0.78rem' }}
                            className="crm-search"
                        />
                        <button className="btn-add-customer" onClick={() => openModal()} style={{ padding: '6px 14px', fontSize: '0.78rem' }}>+ New Vendor</button>
                    </div>

                    <div className="crm-content">
                        {loading ? (
                            <div className="crm-loading">Loading suppliers…</div>
                        ) : (
                            <div className="crm-table-wrap">
                                <table className="crm-table" style={{ minWidth: '1600px' }}>
                                    <thead>
                                        <tr>
                                            <th>Supplier Code</th>
                                            <th>Supplier Name</th>
                                            <th>Contact Person</th>
                                            <th>Mobile</th>
                                            <th>Alternate Mobile</th>
                                            <th>Email Address</th>
                                            <th>GSTIN</th>
                                            <th>PAN</th>
                                            <th>City</th>
                                            <th>State</th>
                                            <th>Business Type</th>
                                            <th>Balance Status</th>
                                            <th style={{ textAlign: 'center', position: 'sticky', right: 0, background: '#f8fafc' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendors.filter(v => {
                                            const q = search.toLowerCase();
                                            return (
                                                (v.supplier_name || '').toLowerCase().includes(q) ||
                                                (v.supplier_code || '').toLowerCase().includes(q) ||
                                                (v.contact_person || '').toLowerCase().includes(q) ||
                                                (v.mobile || '').includes(q) ||
                                                (v.city || '').toLowerCase().includes(q)
                                            );
                                        }).length === 0 ? (
                                            <tr>
                                                <td colSpan={13} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                    No suppliers found matching your query.
                                                </td>
                                            </tr>
                                        ) : (
                                            vendors.filter(v => {
                                                const q = search.toLowerCase();
                                                return (
                                                    (v.supplier_name || '').toLowerCase().includes(q) ||
                                                    (v.supplier_code || '').toLowerCase().includes(q) ||
                                                    (v.contact_person || '').toLowerCase().includes(q) ||
                                                    (v.mobile || '').includes(q) ||
                                                    (v.city || '').toLowerCase().includes(q)
                                                );
                                            }).map(v => (
                                                <tr key={v.id}>
                                                    <td style={{ fontWeight: '700', color: '#64748b' }}>#{v.supplier_code || 'N/A'}</td>
                                                    <td style={{ fontWeight: '800', color: '#1e293b' }}>{v.supplier_name || 'Unnamed'}</td>
                                                    <td>👤 {v.contact_person || 'N/A'}</td>
                                                    <td>📱 {v.mobile || 'N/A'}</td>
                                                    <td>📞 {v.alternate_mobile || 'N/A'}</td>
                                                    <td>✉️ {v.email || 'N/A'}</td>
                                                    <td>📑 {v.gstin || 'N/A'}</td>
                                                    <td>💳 {v.pan_no || 'N/A'}</td>
                                                    <td>🏙️ {v.city || 'N/A'}</td>
                                                    <td>📍 {v.state || 'N/A'}</td>
                                                    <td><span className="method-pill">{v.business_type}</span></td>
                                                    <td style={{ fontWeight: '800', color: (v.opening_balance || 0) > 0 ? '#ef4444' : ((v.opening_balance || 0) < 0 ? '#10b981' : '#64748b') }}>
                                                        ₹{Math.abs(v.opening_balance || 0)} ({(v.opening_balance || 0) > 0 ? 'Payable' : ((v.opening_balance || 0) < 0 ? 'Advance' : 'Settled')})
                                                    </td>
                                                    <td style={{ textAlign: 'center', position: 'sticky', right: 0, background: 'white' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button className="btn-icon" onClick={() => openModal(v)} title="Edit Profile">✏️</button>
                                                            <button className="btn-icon" onClick={() => handleDelete(v.id)} title="Delete Vendor" style={{ color: '#ef4444' }}>🗑️</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'ledger' && (
                <div className="crm-content">
                    <div className="crm-filters" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <select 
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '280px', fontSize: '0.85rem' }}
                            value={selectedVendorForLedger}
                            onChange={(e) => setSelectedVendorForLedger(e.target.value)}
                        >
                            <option value="">Select Vendor...</option>
                            {vendors.map(vendor => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.supplier_name}
                                </option>
                            ))}
                        </select>
                        {selectedVendorForLedger && ledgerData.length > 0 && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-primary" onClick={handleExportCSV} style={{ background: '#16a085', padding: '6px 15px', fontSize: '12px' }}>Export CSV</button>
                                <button className="btn-primary" onClick={handleExportPDF} style={{ background: '#c0392b', padding: '6px 15px', fontSize: '12px' }}>Export PDF</button>
                            </div>
                        )}
                    </div>

                    {ledgerLoading && <p style={{ color: '#64748b' }}>Loading ledger...</p>}

                    {!ledgerLoading && selectedVendorForLedger && ledgerSummary && (
                        <>
                            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                                <div className="summary-card" style={{ borderLeft: '3px solid #14b8a6' }}>
                                    <h3>Total Purchase</h3>
                                    <p className="big-number" style={{ fontSize: '1.1rem' }}>₹{ledgerSummary.total_purchase?.toLocaleString()}</p>
                                </div>
                                <div className="summary-card" style={{ borderLeft: '3px solid #10b981' }}>
                                    <h3>Total Paid</h3>
                                    <p className="big-number" style={{ fontSize: '1.1rem' }}>₹{ledgerSummary.total_paid?.toLocaleString()}</p>
                                </div>
                                <div className="summary-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                                    <h3>Total Returns</h3>
                                    <p className="big-number" style={{ fontSize: '1.1rem' }}>₹0.00</p>
                                </div>
                                <div className="summary-card" style={{ borderLeft: ledgerSummary.balance_type === 'Advance' ? '3px solid #10b981' : '3px solid #ef4444' }}>
                                    <h3>Net {ledgerSummary.balance_type}</h3>
                                    <p className="big-number" style={{ fontSize: '1.1rem', color: ledgerSummary.balance_type === 'Advance' ? '#10b981' : '#ef4444' }}>
                                        ₹{ledgerSummary.net_balance?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <table className="crm-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Ref No</th>
                                        <th>Purchases (Cr)</th>
                                        <th>Payments (Dr)</th>
                                        <th>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledgerData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                No ledger entries found.
                                            </td>
                                        </tr>
                                    ) : (
                                        ledgerData.map((entry, idx) => (
                                            <tr key={idx}>
                                                <td>{new Date(entry.date).toLocaleDateString()}</td>
                                                <td>{entry.type}</td>
                                                <td>{entry.ref_no}</td>
                                                <td>{entry.payments_cr !== '-' ? `₹${entry.payments_cr.toLocaleString()}` : '-'}</td>
                                                <td>{entry.purchases_dr !== '-' ? `₹${entry.purchases_dr.toLocaleString()}` : '-'}</td>
                                                <td style={{ fontWeight: '600' }}>
                                                    ₹{entry.balance.toLocaleString()} {entry.balance_type}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}
                    
                    {!selectedVendorForLedger && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            <p>Please select a vendor to view their ledger.</p>
                        </div>
                    )}
                </div>
            )}

            {viewMode === 'payables' && (
                <div className="crm-content">
                    <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        <div className="summary-card" style={{ background: '#fff1f2', borderLeft: '3px solid #e11d48' }}>
                            <h3 style={{ fontSize: '0.65rem' }}>Total Payables</h3>
                            <p className="big-number" style={{ fontSize: '1.3rem', color: '#e11d48' }}>₹{(duesData.summary.total_outstanding || 0).toLocaleString()}</p>
                        </div>
                        <div className="summary-card">
                            <h3 style={{ fontSize: '0.65rem' }}>Due this week</h3>
                            <p className="big-number" style={{ fontSize: '1.3rem' }}>₹{(duesData.summary.next_7_days_payable || 0).toLocaleString()}</p>
                        </div>
                        <div className="summary-card">
                            <h3 style={{ fontSize: '0.65rem' }}>Total Creditors</h3>
                            <p className="big-number" style={{ fontSize: '1.3rem' }}>{duesData.summary.supplier_count || 0} Vendors</p>
                        </div>
                    </div>
                    <table className="crm-table single-line-table">
                        <thead>
                            <tr>
                                <th>Supplier Name</th>
                                <th>Total Due (₹)</th>
                                <th>Overdue Amount</th>
                                <th>Credit Days</th>
                                <th>Last Payment</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {duesLoading ? (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Loading dues...</td></tr>
                            ) : duesData.suppliers.length > 0 ? (
                                duesData.suppliers.map(supplier => (
                                    <tr key={supplier.id}>
                                        <td style={{ fontWeight: 'bold' }}>{supplier.supplier_name}</td>
                                        <td style={{ color: supplier.total_due > 0 ? '#ef4444' : '#22c55e', fontWeight: '800' }}>
                                            ₹{Number(supplier.total_due).toLocaleString()}
                                        </td>
                                        <td style={{ color: supplier.overdue_amount > 0 ? '#ef4444' : 'inherit' }}>
                                            ₹{Number(supplier.overdue_amount).toLocaleString()}
                                        </td>
                                        <td>{supplier.credit_days} Days</td>
                                        <td>{supplier.last_payment ? new Date(supplier.last_payment).toLocaleDateString() : '-'}</td>
                                        <td>
                                            {supplier.total_due > 0 && (
                                                <button 
                                                    className="btn-small-crimson" 
                                                    onClick={() => {
                                                        setSelectedSupplierForPayment(supplier);
                                                        setPaymentAmount(supplier.total_due);
                                                        setShowPaymentModal(true);
                                                    }}
                                                >
                                                    Pay Now
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No outstanding dues found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {viewMode === 'payments' && (
                <div className="crm-content">
                    <div className="crm-filters" style={{ marginBottom: '16px', display: 'flex', gap: '15px', flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto' }}>
                        <select 
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'auto', minWidth: '200px', flex: '0 0 auto' }}
                            value={paymentFilterSupplier}
                            onChange={(e) => setPaymentFilterSupplier(e.target.value)}
                        >
                            <option value="">All Suppliers</option>
                            {[...new Set(paymentHistory.map(p => p.supplier_name))].map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <select 
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'auto', minWidth: '150px', flex: '0 0 auto' }}
                            value={paymentFilterMethod}
                            onChange={(e) => setPaymentFilterMethod(e.target.value)}
                        >
                            <option value="">All Payment Modes</option>
                            {[...new Set(paymentHistory.map(p => p.payment_method))].map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: '0 0 auto' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>From:</span>
                            <input 
                                type="date"
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'auto' }}
                                value={paymentFilterDateFrom}
                                onChange={(e) => setPaymentFilterDateFrom(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: '0 0 auto' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>To:</span>
                            <input 
                                type="date"
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'auto' }}
                                value={paymentFilterDateTo}
                                onChange={(e) => setPaymentFilterDateTo(e.target.value)}
                            />
                        </div>
                        {(paymentFilterSupplier || paymentFilterMethod || paymentFilterDateFrom || paymentFilterDateTo) && (
                            <button 
                                className="btn-secondary" 
                                onClick={() => {
                                    setPaymentFilterSupplier('');
                                    setPaymentFilterMethod('');
                                    setPaymentFilterDateFrom('');
                                    setPaymentFilterDateTo('');
                                }}
                                style={{ padding: '8px 15px', flex: '0 0 auto' }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                    <table className="crm-table single-line-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Supplier Name</th>
                                <th>Amount</th>
                                <th>Payment Method</th>
                                <th>Reference No</th>
                                <th>Notes</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentHistoryLoading ? (
                                <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Loading payments...</td></tr>
                            ) : filteredPayments.length > 0 ? (
                                filteredPayments.map(payment => (
                                    <tr key={payment.id}>
                                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 'bold' }}>{payment.supplier_name}</td>
                                        <td style={{ color: '#22c55e', fontWeight: '800' }}>₹{Number(payment.amount).toLocaleString()}</td>
                                        <td><span className="method-pill">{payment.payment_method}</span></td>
                                        <td>{payment.reference_no || '-'}</td>
                                        <td>{payment.notes || '-'}</td>
                                        <td>
                                            <button 
                                                className="btn-icon" 
                                                onClick={() => handleDownloadReceipt(payment)}
                                                title="Download Receipt"
                                            >
                                                📥
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No payments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {viewMode === 'purchases' && (
                <div className="crm-content">
                    <table className="crm-table single-line-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>PO Number</th>
                                <th>Supplier Name</th>
                                <th>Total Amount</th>
                                <th>Expected Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseHistoryLoading ? (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Loading purchases...</td></tr>
                            ) : purchaseHistory.length > 0 ? (
                                purchaseHistory.map(order => (
                                    <tr key={order.id}>
                                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 'bold' }}>{order.po_number}</td>
                                        <td>{order.supplier_name}</td>
                                        <td style={{ fontWeight: '800' }}>₹{Number(order.total_amount).toLocaleString()}</td>
                                        <td>{order.expected_date ? new Date(order.expected_date).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <span className={`status-pill ${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No purchase history found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {['advance', 'returns', 'po', 'performance'].includes(viewMode) && (
                <div className="crm-content">
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚛</div>
                        <p>Procurement Lifecycle Module: {viewMode === 'po' ? 'Pending PO Tracking' : (viewMode === 'performance' ? 'Vendor Scorecard' : 'Vendor Audit Log')}</p>
                        <p style={{ fontSize: '0.8rem' }}>All vendor transactions and {viewMode} history is being synchronized with the warehouse system.</p>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="crm-modal-overlay">
                    <div className="crm-modal" style={{ maxWidth: '100vw', width: '95%' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '0.9rem', margin: 0, fontWeight: '800' }}>
                                {editingSupplier ? '💼 Update Supplier Profile' : '🏭 Register New Supplier'}
                            </h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '18px' }}>
                            {/* Section: Basic Info */}
                            <div className="form-section-title">Corporate Information</div>
                            <div className="crm-grid-3">
                                <div className="form-group">
                                    <label>Supplier Code</label>
                                    <input type="text" value={formData.supplier_code} onChange={e => setFormData({ ...formData, supplier_code: e.target.value })} placeholder="VND-001" />
                                </div>
                                <div className="form-group">
                                    <label>Supplier Name</label>
                                    <input type="text" value={formData.supplier_name} onChange={e => setFormData({ ...formData, supplier_name: e.target.value })} placeholder="Full Business Name" />
                                </div>
                                <div className="form-group">
                                    <label>Business Type</label>
                                    <select value={formData.business_type} onChange={e => setFormData({ ...formData, business_type: e.target.value })}>
                                        <option>Manufacturer</option>
                                        <option>Wholesaler</option>
                                        <option>Distributor</option>
                                        <option>Retailer</option>
                                    </select>
                                </div>
                            </div>

                            {/* Section: Contact Details */}
                            <div className="form-section-title">Communication & Contact</div>
                            <div className="crm-grid-3">
                                <div className="form-group">
                                    <label>Contact Person</label>
                                    <input type="text" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input type="text" maxLength="10" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Alternate Mobile</label>
                                    <input type="text" maxLength="10" value={formData.alternate_mobile} onChange={e => setFormData({ ...formData, alternate_mobile: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Website URL</label>
                                    <input type="text" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
                                </div>
                            </div>

                            {/* Section: Address */}
                            <div className="form-section-title">Address & Logistics</div>
                            <div className="crm-grid-2">
                                <div className="form-group">
                                    <label>Address Line 1</label>
                                    <input type="text" value={formData.address_line1} onChange={e => setFormData({ ...formData, address_line1: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Address Line 2</label>
                                    <input type="text" value={formData.address_line2} onChange={e => setFormData({ ...formData, address_line2: e.target.value })} />
                                </div>
                            </div>
                            <div className="crm-grid-4" style={{ marginTop: '8px' }}>
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input type="text" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Country</label>
                                    <input type="text" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                                </div>
                            </div>

                            {/* Section: Tax & Legal */}
                            <div className="form-section-title">Legal & Compliance</div>
                            <div className="crm-grid-3">
                                <div className="form-group">
                                    <label>GSTIN Number</label>
                                    <input type="text" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} placeholder="27XXXXX..." />
                                </div>
                                <div className="form-group">
                                    <label>PAN Number</label>
                                    <input type="text" value={formData.pan_no} onChange={e => setFormData({ ...formData, pan_no: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Registration No</label>
                                    <input type="text" value={formData.registration_no} onChange={e => setFormData({ ...formData, registration_no: e.target.value })} />
                                </div>
                            </div>

                            {/* Section: Financial */}
                            <div className="form-section-title">Financial Policy</div>
                            <div className="crm-grid-4">
                                <div className="form-group">
                                    <label>Opening Balance</label>
                                    <input type="number" value={formData.opening_balance} onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group">
                                    <label>Balance Type</label>
                                    <select value={formData.balance_type} onChange={e => setFormData({ ...formData, balance_type: e.target.value })}>
                                        <option>Payable</option>
                                        <option>Advance</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Credit Limit</label>
                                    <input type="number" value={formData.credit_limit} onChange={e => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group">
                                    <label>Payment Terms (Days)</label>
                                    <input type="number" value={formData.payment_terms_days} onChange={e => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Discard</button>
                            <button className="btn-primary" onClick={handleSave} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Save Profile</button>
                        </div>
                    </div>
                </div>
            )}
            {showPaymentModal && selectedSupplierForPayment && (
                <div className="crm-modal-overlay">
                    <div className="crm-modal" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Record Payment</h2>
                            <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                <p style={{ margin: '0 0 5px 0', color: '#64748b' }}>Supplier</p>
                                <h3 style={{ margin: 0, color: '#0f172a' }}>{selectedSupplierForPayment.supplier_name}</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                    <span style={{ color: '#64748b' }}>Total Due:</span>
                                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>₹{Number(selectedSupplierForPayment.total_due).toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Payment Amount (₹)</label>
                                <input 
                                    type="number" 
                                    value={paymentAmount} 
                                    onChange={(e) => setPaymentAmount(e.target.value)} 
                                    placeholder="Enter amount"
                                />
                            </div>
                            
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Payment Method</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Reference No (UTR / Cheque No)</label>
                                <input 
                                    type="text" 
                                    value={paymentRef} 
                                    onChange={(e) => setPaymentRef(e.target.value)} 
                                    placeholder="Optional"
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea 
                                    rows="3" 
                                    value={paymentNotes} 
                                    onChange={(e) => setPaymentNotes(e.target.value)} 
                                    placeholder="Any internal notes..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px 20px', borderTop: '1px solid #e2e8f0' }}>
                            <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleRecordPayment}>Save Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
