import React, { useState, useEffect } from 'react';
import API_BASE from '../config/serverConfig';
import '../styles/BranchScreen.css';
import { branchesAPI } from '../services/api';
import { usePopup } from './ui/PopupProvider';

const BranchScreen = ({ defaultTab = 'manage', branchId }) => {
    const popup = usePopup();
    // Determine User Context
    const storedUser = localStorage.getItem('adminUser');
    let loggedInUser = null;
    if (storedUser) {
        try {
            loggedInUser = JSON.parse(storedUser);
        } catch (e) {
            console.error(e);
        }
    }
    const isSuperAdmin = loggedInUser && (loggedInUser.role?.toUpperCase() === 'SUPERADMIN');
    const loginBranchId = loggedInUser ? loggedInUser.branchId : null;

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranchId, setEditingBranchId] = useState(null);
    const [newBranch, setNewBranch] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gst_number: '',
        is_main: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Stock Transfer State
    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    
    // Batch Transfer State
    const [transferItems, setTransferItems] = useState([]);
    const [transferData, setTransferData] = useState({
        from_branch_id: !isSuperAdmin && loginBranchId ? loginBranchId.toString() : '',
        to_branch_id: '',
        product_id: '',
        quantity: 1,
        notes: ''
    });
    const [selectedProductStock, setSelectedProductStock] = useState(0);
    
    // Consolidated Reports State
    const [reportData, setReportData] = useState({
        groupTotalRevenue: 0,
        totalActiveStock: 0,
        branchesCount: 0,
        matrix: []
    });

    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchInvoices, setBranchInvoices] = useState([]);
    const [branchExpenses, setBranchExpenses] = useState([]);
    const [showInvoicesModal, setShowInvoicesModal] = useState(false);
    const [showExpensesModal, setShowExpensesModal] = useState(false);
    const [loadingSubData, setLoadingSubData] = useState(false);
    
    // Cancellation Modal State
    const [cancelTransferId, setCancelTransferId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        fetchBranches();
        if (defaultTab === 'transfer') {
            fetchTransfers();
            fetchProducts();
        }
        if (defaultTab === 'consolidated') {
            fetchConsolidatedReports();
        }
    }, [defaultTab]);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const data = await branchesAPI.getAll();
            setBranches(data);
        } catch (error) {
            console.error("Error fetching branches:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransfers = async () => {
        try {
            const response = await fetch(`${API_BASE}/stock-transfers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) setTransfers(data);
        } catch (error) {
            console.error("Error fetching transfers:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            // Fetch all products (across all branches) for transfer selection
            const response = await fetch(`${API_BASE}/products`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchConsolidatedReports = async () => {
        try {
            const response = await fetch(`${API_BASE}/branches/reports/consolidated`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) setReportData(data);
        } catch (error) {
            console.error("Error fetching consolidated reports:", error);
        }
    };

    const handleViewInvoices = async (branch) => {
        setSelectedBranch(branch);
        setLoadingSubData(true);
        setShowInvoicesModal(true);
        try {
            const response = await fetch(`${API_BASE}/billing?branchId=${branch.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setBranchInvoices(data.invoices || []);
            }
        } catch (error) {
            console.error("Error fetching branch invoices:", error);
        } finally {
            setLoadingSubData(false);
        }
    };

    const handleViewExpenses = async (branch) => {
        setSelectedBranch(branch);
        setLoadingSubData(true);
        setShowExpensesModal(true);
        try {
            const response = await fetch(`${API_BASE}/expenses?branch_id=${branch.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setBranchExpenses(data || []);
            }
        } catch (error) {
            console.error("Error fetching branch expenses:", error);
        } finally {
            setLoadingSubData(false);
        }
    };

    const downloadGroupReport = () => {
        if (!reportData.matrix || reportData.matrix.length === 0) return;
        const headers = ["Branch Name", "Sales (INR)", "Expenses (INR)", "Inventory Value (INR)", "Net Profit (INR)", "Status"];
        const rows = reportData.matrix.map(b => [
            `"${b.name}"`,
            b.sales,
            b.expenses,
            b.inventory,
            b.netProfit,
            "Active"
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Consolidated_Group_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadBranchReport = (branch) => {
        const headers = ["Metric", "Value"];
        const rows = [
            ["Branch Name", `"${branch.name}"`],
            ["Sales Revenue (INR)", branch.sales],
            ["Expenses (INR)", branch.expenses],
            ["Inventory Value (INR)", branch.inventory],
            ["Net Profit (INR)", branch.netProfit],
            ["Status", "Active"]
        ];
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Branch_Report_${branch.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const printInvoice = (inv) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
			<html>
				<head>
					<title>Invoice - #${inv.id}</title>
					<style>
						body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
						.header { display: flex; justify-content: space-between; border-bottom: 2px solid #14b8a6; padding-bottom: 20px; }
						.invoice-info { text-align: right; }
						.section { margin-top: 30px; }
						table { width: 100%; border-collapse: collapse; margin-top: 20px; }
						th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
						th { background: #f8fafc; font-weight: bold; }
						.total { text-align: right; font-size: 1.5rem; font-weight: bold; margin-top: 30px; }
						.footer { margin-top: 50px; font-size: 0.8rem; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
					</style>
				</head>
				<body>
					<div class="header">
						<div>
							<h1>STAYBILL PRO</h1>
							<p><strong>Branch Outlet:</strong> ${selectedBranch ? selectedBranch.name : 'N/A'}</p>
						</div>
						<div class="invoice-info">
							<h2>INVOICE</h2>
							<p><strong>Invoice ID:</strong> #${inv.id}</p>
							<p><strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}</p>
						</div>
					</div>
					
					<div class="section">
						<h3>Customer Details</h3>
						<p><strong>Name:</strong> ${inv.customer_name || 'Walk-in Customer'}</p>
						<p><strong>Phone:</strong> ${inv.customer_phone || '-'}</p>
					</div>

					<div class="section">
						<h3>Transaction Details</h3>
						<table>
							<thead>
								<tr>
									<th>Description</th>
									<th>Payment Method</th>
									<th>Status</th>
									<th>Total Amount</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Sales Invoice Items Bill</td>
									<td>${inv.payment_method.toUpperCase()}</td>
									<td>${inv.status.toUpperCase()}</td>
									<td style="font-weight: bold;">₹${parseFloat(inv.total_amount).toLocaleString()}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div class="total">Total Paid Amount: ₹ ${parseFloat(inv.total_amount).toLocaleString()}</div>
					
					<div class="footer">Thank you for choosing StayBill Pro. This is a computer-generated transaction record.</div>
					<script>window.print();</script>
				</body>
			</html>
        `);
        printWindow.document.close();
    };

    const handleSaveBranch = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingBranchId) {
                await branchesAPI.update(editingBranchId, newBranch);
            } else {
                await branchesAPI.create(newBranch);
            }
            setShowModal(false);
            setEditingBranchId(null);
            setNewBranch({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', gst_number: '', is_main: false });
            fetchBranches();
        } catch (error) {
            popup.showError(`Error ${editingBranchId ? 'updating' : 'creating'} branch: ` + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (branch) => {
        setNewBranch({
            name: branch.name || '',
            email: branch.email || '',
            phone: branch.phone || '',
            address: branch.address || '',
            city: branch.city || '',
            state: branch.state || '',
            pincode: branch.pincode || '',
            gst_number: branch.gst_number || '',
            is_main: branch.is_main || false
        });
        setEditingBranchId(branch.id);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBranchId(null);
        setNewBranch({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', gst_number: '', is_main: false });
    };

    const onProductSelect = (id) => {
        const prod = products.find(p => p.id === parseInt(id));
        if (prod) {
            setSelectedProductStock(prod.quantity);
            setTransferData({...transferData, product_id: id});
        } else {
            setSelectedProductStock(0);
            setTransferData({...transferData, product_id: ''});
        }
    };

    const addTransferItem = () => {
        if (!transferData.from_branch_id || !transferData.to_branch_id) {
            popup.showError("Please select source and destination branches first.");
            return;
        }
        if (transferData.from_branch_id === transferData.to_branch_id) {
            popup.showError("Source and destination branches must be different.");
            return;
        }
        if (!transferData.product_id) {
            popup.showError("Please select a product to transfer.");
            return;
        }
        if (transferData.quantity <= 0 || transferData.quantity > selectedProductStock) {
            popup.showError(`Invalid quantity. Only ${selectedProductStock} units available.`);
            return;
        }

        const prod = products.find(p => p.id === parseInt(transferData.product_id));
        
        // Check if product is already in the transfer list
        if (transferItems.find(item => item.product_id === prod.id)) {
            popup.showError("Product already added to the transfer list. Remove it first if you want to change the quantity.");
            return;
        }

        setTransferItems([...transferItems, {
            ...transferData,
            product_name: prod.name,
            product_sku: prod.sku
        }]);

        // Reset product selection but keep branches
        setTransferData({
            ...transferData,
            product_id: '',
            quantity: 1
        });
        setSelectedProductStock(0);
    };

    const removeTransferItem = (productId) => {
        setTransferItems(transferItems.filter(item => item.product_id !== productId));
    };

    const handleInitiateBatchTransfer = async (e) => {
        e.preventDefault();
        if (transferItems.length === 0) {
            popup.showError("Transfer list is empty. Add some products first.");
            return;
        }

        setIsSubmitting(true);
        let successCount = 0;
        let failCount = 0;

        try {
            // Loop and sequentially send POST requests for each item
            for (const item of transferItems) {
                const response = await fetch(`${API_BASE}/stock-transfers`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}` 
                    },
                    body: JSON.stringify(item)
                });
                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            }

            if (failCount === 0) {
                // All success
                setShowTransferModal(false);
                setTransferItems([]);
                setTransferData({ 
                    from_branch_id: !isSuperAdmin && loginBranchId ? loginBranchId.toString() : '', 
                    to_branch_id: '', 
                    product_id: '', 
                    quantity: 1, 
                    notes: '' 
                });
                fetchTransfers();
                fetchProducts(); // Refresh stock counts
            } else {
                popup.showError(`Completed ${successCount} transfers. Failed ${failCount} transfers.`);
                fetchTransfers();
                fetchProducts();
            }
        } catch (error) {
            popup.showError("Error executing batch transfer: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderManageBranches = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <input type="text" placeholder="Search Branch / Outlet..." className="search-input" />
                <button className="btn-primary" onClick={() => { setEditingBranchId(null); setNewBranch({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', gst_number: '', is_main: false }); setShowModal(true); }}>+ Register New Branch</button>
            </div>
            <div className="crm-grid-3">
                {loading ? (
                    <div className="loading-placeholder">Loading branches...</div>
                ) : branches.length > 0 ? (
                    branches.map(branch => (
                        <div key={branch.id} className="branch-card">
                            <div className="branch-header">
                                <span className="branch-id">#{branch.id}</span>
                                <span className="status-pill success">Active</span>
                            </div>
                            <h3 className="branch-name">{branch.name}</h3>
                            <p className="branch-loc">📍 {branch.address || branch.city || 'No Location Set'}</p>
                            <div className="branch-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Location</span>
                                    <span className="stat-val">{branch.city || 'N/A'}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Contact</span>
                                    <span className="stat-val emerald">{branch.phone || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="branch-actions" style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-secondary btn-full">View Branch Dashboard</button>
                                <button className="btn-primary" style={{ padding: '8px', minWidth: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleEditClick(branch)} title="Edit Branch">✏️</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">No branches found. Click Register to add your first branch.</div>
                )}
            </div>
        </div>
    );
    const handleUpdateTransferStatus = async (id, status, reason) => {
        try {
            const response = await fetch(`${API_BASE}/stock-transfers/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status, reason })
            });
            const data = await response.json();
            if (response.ok) {
                fetchTransfers();
                fetchBranches(); // Refresh branch lists & stock values
                fetchProducts(); // Refresh stock catalog
            } else {
                popup.showError(data.message || "Failed to update transfer status");
            }
        } catch (error) {
            console.error("Error updating transfer status:", error);
        }
    };

    const handleCancelClick = (id) => {
        setCancelTransferId(id);
        setCancelReason('');
    };

    const confirmCancelTransfer = () => {
        if (!cancelReason.trim()) {
            popup.showError("A cancellation reason is required.");
            return;
        }
        handleUpdateTransferStatus(cancelTransferId, 'CANCELLED', cancelReason);
        setCancelTransferId(null);
        setCancelReason('');
    };

    const renderStockTransfer = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <button className="btn-primary" onClick={() => setShowTransferModal(true)}>+ Initiate New Transfer</button>
            </div>
            <table className="crm-table single-line-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Transfer #</th>
                        <th>Source Branch</th>
                        <th>Dest. Branch</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {transfers.length > 0 ? transfers.map(t => (
                        <tr key={t.id}>
                            <td>{new Date(t.transfer_date).toLocaleDateString()}</td>
                            <td>TRF-{t.id.toString().padStart(4, '0')}</td>
                            <td>{t.from_branch_name}</td>
                            <td>{t.to_branch_name}</td>
                            <td>{t.product_name} {t.product_sku ? `(${t.product_sku})` : ''}</td>
                            <td><strong>{t.quantity}</strong> units</td>
                            <td>
                                <span className={`status-pill ${
                                    t.status === 'COMPLETED' ? 'success' : 
                                    t.status === 'CANCELLED' ? 'danger' : 
                                    t.status === 'IN_TRANSIT' ? 'info' : 'warning'
                                }`} style={{
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                    ...(t.status === 'IN_TRANSIT' && { background: '#e0f2fe', color: '#0369a1' }),
                                    ...(t.status === 'CANCELLED' && { background: '#fee2e2', color: '#ef4444' })
                                }}>
                                    {t.status}
                                </span>
                            </td>
                            <td style={{ minWidth: '180px' }}>
                                {t.status === 'PENDING' && (
                                    <>
                                        <button className="btn-small" onClick={() => handleUpdateTransferStatus(t.id, 'IN_TRANSIT')} style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', marginRight: '6px' }}>
                                            🚚 Ship
                                        </button>
                                        <button className="btn-small btn-danger" onClick={() => handleCancelClick(t.id)}>
                                            ❌ Cancel
                                        </button>
                                    </>
                                )}
                                {t.status === 'IN_TRANSIT' && (
                                    <>
                                        {(Number(branchId) === Number(t.to_branch_id)) ? (
                                            <button className="btn-small" onClick={() => handleUpdateTransferStatus(t.id, 'COMPLETED')} style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0', marginRight: '6px' }}>
                                                📥 Receive
                                            </button>
                                        ) : (
                                            <span style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic', marginRight: '8px' }}>In Transit (Awaiting Dest.)</span>
                                        )}
                                        <button className="btn-small btn-danger" onClick={() => handleCancelClick(t.id)}>
                                            ❌ Cancel
                                        </button>
                                    </>
                                )}
                                {(t.status === 'COMPLETED' || t.status === 'CANCELLED') && (
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                        {t.status === 'CANCELLED' && t.notes ? `Cancelled: ${t.notes.split('\n').pop()}` : 'Lifecycle Complete'}
                                    </span>
                                )}
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="8" className="no-results">No transfers logged yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderConsolidatedReports = () => {
        const groupTotalExpenses = reportData.matrix ? reportData.matrix.reduce((acc, curr) => acc + (parseFloat(curr.expenses) || 0), 0) : 0;
        const groupTotalNetProfit = reportData.groupTotalRevenue - groupTotalExpenses;

        return (
            <div className="crm-content">
                <div className="crm-grid-4">
                    <div className="report-card blue">
                        <span className="card-title">Group Total Revenue</span>
                        <div className="card-value">₹{reportData.groupTotalRevenue.toLocaleString()}</div>
                        <div className="card-trend emerald">Across {reportData.branchesCount} Branches</div>
                    </div>
                    <div className="report-card" style={{ borderLeft: '4px solid #ef4444' }}>
                        <span className="card-title">Group Total Expenses</span>
                        <div className="card-value" style={{ color: '#ef4444' }}>₹{groupTotalExpenses.toLocaleString()}</div>
                        <div className="card-trend" style={{ color: '#ef4444' }}>All spending logs</div>
                    </div>
                    <div className="report-card emerald">
                        <span className="card-title">Group Net Profit</span>
                        <div className="card-value">₹{groupTotalNetProfit.toLocaleString()}</div>
                        <div className="card-trend emerald">Net income margin</div>
                    </div>
                    <div className="report-card highlight">
                        <span className="card-title">Total Active Stock</span>
                        <div className="card-value">₹{reportData.totalActiveStock.toLocaleString()}</div>
                        <div className="card-trend">Inventory asset valuation</div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '12px' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>Branch Performance Matrix</h3>
                    <button className="btn-primary" onClick={downloadGroupReport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}>
                        📥 Download Group Report
                    </button>
                </div>
            <table className="crm-table">
                <thead>
                    <tr>
                        <th>Branch</th>
                        <th>Sales</th>
                        <th>Expenses</th>
                        <th>Inventory</th>
                        <th>Net Profit</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.matrix.map(b => (
                        <tr key={b.id}>
                            <td style={{ fontWeight: 'bold' }}>{b.name}</td>
                            <td>₹{b.sales.toLocaleString()}</td>
                            <td>₹{b.expenses.toLocaleString()}</td>
                            <td>₹{b.inventory.toLocaleString()}</td>
                            <td className={b.netProfit >= 0 ? 'emerald' : 'text-red'}>
                                ₹{b.netProfit.toLocaleString()}
                            </td>
                            <td><span className="card-trend emerald">↑ Active</span></td>
                            <td style={{ textAlign: 'right' }}>
                                <button className="btn-small" onClick={() => downloadBranchReport(b)} style={{ padding: '4px 8px', fontSize: '0.75rem', marginRight: '6px' }} title="Download branch CSV report">
                                    📥 CSV
                                </button>
                                <button className="btn-small" onClick={() => handleViewInvoices(b)} style={{ padding: '4px 8px', fontSize: '0.75rem', marginRight: '6px' }} title="View branch invoices">
                                    🧾 Invoices
                                </button>
                                <button className="btn-small" onClick={() => handleViewExpenses(b)} style={{ padding: '4px 8px', fontSize: '0.75rem' }} title="View branch expenses">
                                    💸 Expenses
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

    const getTitle = () => {
        if (defaultTab === 'manage') return 'Multi-Branch & Outlet Management';
        if (defaultTab === 'transfer') return 'Branch Stock Transfer (Logistics)';
        if (defaultTab === 'consolidated') return 'Consolidated Group Reports';
        return 'Branch Hub';
    };

    return (
        <div className="branch-screen">
            <div className="admin-content-header" style={{ marginBottom: '12px' }}>
                <h2 className="screen-title" style={{ fontSize: '1rem', fontWeight: '800' }}>
                    🏢 {getTitle()}
                </h2>
            </div>
            {defaultTab === 'manage' && renderManageBranches()}
            {defaultTab === 'transfer' && renderStockTransfer()}
            {defaultTab === 'consolidated' && renderConsolidatedReports()}

            {/* Register/Edit Branch Modal */}
            {showModal && (
                <div className="branch-modal-overlay">
                    <div className="branch-modal">
                        <h3>🏢 {editingBranchId ? 'Edit Branch' : 'Register New Branch'}</h3>
                        <form onSubmit={handleSaveBranch}>
                            <div className="form-group">
                                <label>Branch Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={newBranch.name} 
                                    onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                                    placeholder="e.g. Downtown Service Center"
                                />
                            </div>
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={newBranch.email} 
                                        onChange={e => setNewBranch({...newBranch, email: e.target.value})}
                                        placeholder="branch@example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input 
                                        type="tel" 
                                        maxLength="10"
                                        required 
                                        value={newBranch.phone} 
                                        onChange={e => setNewBranch({...newBranch, phone: e.target.value})}
                                        placeholder="Contact number"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Full Address</label>
                                <textarea 
                                    required 
                                    value={newBranch.address} 
                                    onChange={e => setNewBranch({...newBranch, address: e.target.value})}
                                    placeholder="Street, Area, Building"
                                />
                            </div>
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label>City</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={newBranch.city} 
                                        onChange={e => setNewBranch({...newBranch, city: e.target.value})}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <select 
                                        required 
                                        value={newBranch.state} 
                                        onChange={e => setNewBranch({...newBranch, state: e.target.value})}
                                        className="form-input"
                                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #f1f5f9' }}
                                    >
                                        <option value="">Select State</option>
                                        <option value="Maharashtra">Maharashtra</option>
                                        <option value="Karnataka">Karnataka</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Tamil Nadu">Tamil Nadu</option>
                                        <option value="Gujarat">Gujarat</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label>Pincode</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={newBranch.pincode} 
                                        onChange={e => setNewBranch({...newBranch, pincode: e.target.value})}
                                        placeholder="6 digits"
                                        maxLength="6"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>GST Number (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={newBranch.gst_number} 
                                        onChange={e => setNewBranch({...newBranch, gst_number: e.target.value})}
                                        placeholder="15-digit GSTIN"
                                        maxLength="15"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editingBranchId ? 'Update Branch' : 'Register Branch')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Batch Stock Transfer Modal - Premium Full Screen */}
            {showTransferModal && (
                <div className="premium-modal-overlay">
                    <div className="premium-full-modal">
                        <h3>🚚 Batch Stock Transfer Builder</h3>
                        
                        <div className="transfer-builder-layout">
                            {/* LEFT SIDEBAR: Builder Tools */}
                            <div className="transfer-builder-sidebar">
                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Source Branch (From)</label>
                                    <select 
                                        className="premium-input"
                                        value={transferData.from_branch_id}
                                        onChange={e => setTransferData({...transferData, from_branch_id: e.target.value})}
                                        disabled={transferItems.length > 0 || (!isSuperAdmin && loginBranchId)}
                                    >
                                        <option value="">-- Select Source --</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    {transferItems.length > 0 && <span className="help-text">Locked while items are in list</span>}
                                </div>

                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Destination Branch (To)</label>
                                    <select 
                                        className="premium-input"
                                        value={transferData.to_branch_id}
                                        onChange={e => setTransferData({...transferData, to_branch_id: e.target.value})}
                                        disabled={transferItems.length > 0}
                                    >
                                        <option value="">-- Select Destination --</option>
                                        {branches.filter(b => b.id !== parseInt(transferData.from_branch_id)).map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    {transferItems.length > 0 && <span className="help-text">Locked while items are in list</span>}
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e1', margin: '8px 0' }} />

                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Select Product</label>
                                    <select 
                                        className="premium-input"
                                        value={transferData.product_id}
                                        onChange={e => onProductSelect(e.target.value)}
                                        disabled={!transferData.from_branch_id}
                                    >
                                        <option value="">-- Choose Product --</option>
                                        {products.filter(p => Number(p.branch_id) === Number(transferData.from_branch_id)).map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.sku || 'No SKU'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="premium-input-wrapper">
                                    <label className="premium-input-label">Quantity to Move</label>
                                    <input 
                                        type="number" 
                                        className="premium-input"
                                        min="1"
                                        max={selectedProductStock}
                                        value={transferData.quantity} 
                                        onChange={e => setTransferData({...transferData, quantity: parseInt(e.target.value) || 0})}
                                    />
                                    {transferData.product_id && (
                                        <span className="help-text stock-avail" style={{ marginTop: '8px' }}>
                                            Available Stock: {selectedProductStock} units
                                        </span>
                                    )}
                                </div>
                                
                                <button type="button" className="btn-primary" onClick={addTransferItem} style={{ marginTop: '8px' }}>
                                    + Add to Transfer List
                                </button>
                                
                                <div className="premium-input-wrapper" style={{ marginTop: '16px' }}>
                                    <label className="premium-input-label">Global Transfer Notes</label>
                                    <textarea 
                                        className="premium-input"
                                        style={{ height: '80px', paddingTop: '8px', resize: 'none' }}
                                        value={transferData.notes} 
                                        onChange={e => setTransferData({...transferData, notes: e.target.value})}
                                        placeholder="Reason for stock movement..."
                                    />
                                </div>
                            </div>

                            {/* RIGHT MAIN: Transfer Cart */}
                            <div className="transfer-builder-main">
                                <div className="transfer-main-scrollable">
                                    {transferItems.length === 0 ? (
                                        <div className="transfer-empty-state">
                                            <span style={{ fontSize: '3rem' }}>📦</span>
                                            <h4>No Products Added Yet</h4>
                                            <p>Select branches and a product from the sidebar, then add it to build your transfer list.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="transfer-cart-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Product Details</th>
                                                            <th>SKU</th>
                                                            <th>Quantity to Move</th>
                                                            <th style={{ width: '60px', textAlign: 'center' }}>Remove</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {transferItems.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.product_name}</td>
                                                                <td style={{ color: '#64748b' }}>{item.product_sku || 'N/A'}</td>
                                                                <td>
                                                                    <span className="transfer-qty-badge">{item.quantity}</span>
                                                                </td>
                                                                <td style={{ textAlign: 'center' }}>
                                                                    <button type="button" className="btn-icon-danger" onClick={() => removeTransferItem(item.product_id)} style={{ margin: '0 auto' }}>
                                                                        🗑️
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="transfer-summary-footer">
                                    <div className="transfer-stats">
                                        <div className="t-stat">
                                            <span>Total Products</span>
                                            <strong>{transferItems.length}</strong>
                                        </div>
                                        <div className="t-stat">
                                            <span>Total Units</span>
                                            <strong>{transferItems.reduce((acc, curr) => acc + curr.quantity, 0)}</strong>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button 
                                            type="button" 
                                            className="btn-premium-cancel" 
                                            onClick={() => {
                                                setShowTransferModal(false);
                                                setTransferItems([]);
                                            }}
                                        >
                                            Discard Transfer
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-premium-save"
                                            disabled={isSubmitting || transferItems.length === 0}
                                            onClick={handleInitiateBatchTransfer}
                                        >
                                            {isSubmitting ? 'Executing...' : 'Execute Batch Transfer'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Branch Invoices Drilldown Modal */}
            {showInvoicesModal && selectedBranch && (
                <div className="premium-modal-overlay">
                    <div className="premium-full-modal">
                        <h3>🧾 Invoices for {selectedBranch.name}</h3>
                        <div className="premium-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {loadingSubData ? (
                                <p style={{ padding: '24px', textAlign: 'center' }}>Loading invoices...</p>
                            ) : branchInvoices.length === 0 ? (
                                <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No invoices logged for this branch yet.</p>
                            ) : (
                                <div style={{ overflowX: 'auto', flex: 1 }}>
                                    <table className="crm-table single-line-table">
                                        <thead>
                                            <tr>
                                                <th>Invoice ID</th>
                                                <th>Customer</th>
                                                <th>Phone</th>
                                                <th>Amount</th>
                                                <th>Payment Method</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {branchInvoices.map(inv => (
                                                <tr key={inv.id}>
                                                    <td style={{ fontWeight: 'bold' }}>#{inv.id}</td>
                                                    <td>{inv.customer_name || 'Walk-in'}</td>
                                                    <td>{inv.customer_phone || '-'}</td>
                                                    <td>₹{parseFloat(inv.total_amount).toLocaleString()}</td>
                                                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{inv.payment_method}</span></td>
                                                    <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                                                    <td><span className={`status-pill ${inv.status === 'paid' ? 'success' : 'warning'}`}>{inv.status}</span></td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button className="btn-small" onClick={() => printInvoice(inv)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '0.75rem' }}>
                                                            🖨️ View & Print
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-premium-cancel" onClick={() => setShowInvoicesModal(false)}>Close Screen</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Branch Expenses Drilldown Modal */}
            {showExpensesModal && selectedBranch && (
                <div className="premium-modal-overlay">
                    <div className="premium-full-modal">
                        <h3>💸 Expenses for {selectedBranch.name}</h3>
                        <div className="premium-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {loadingSubData ? (
                                <p style={{ padding: '24px', textAlign: 'center' }}>Loading expenses...</p>
                            ) : branchExpenses.length === 0 ? (
                                <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No expenses logged for this branch yet.</p>
                            ) : (
                                <div style={{ overflowX: 'auto', flex: 1 }}>
                                    <table className="crm-table single-line-table">
                                        <thead>
                                            <tr>
                                                <th>Expense ID</th>
                                                <th>Description</th>
                                                <th>Category</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {branchExpenses.map(exp => (
                                                <tr key={exp.id}>
                                                    <td style={{ fontWeight: 'bold' }}>#{exp.id}</td>
                                                    <td>{exp.description}</td>
                                                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{exp.category}</span></td>
                                                    <td style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{parseFloat(exp.amount).toLocaleString()}</td>
                                                    <td>{new Date(exp.expense_date || exp.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-premium-cancel" onClick={() => setShowExpensesModal(false)}>Close Screen</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Transfer Modal */}
            {cancelTransferId && (
                <div className="premium-modal-overlay">
                    <div className="premium-modal" style={{ maxWidth: '400px', padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#0f172a' }}>❌ Cancel Transfer</h3>
                        <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '0.9rem' }}>
                            Please enter the reason for cancelling this stock transfer:
                        </p>
                        <textarea
                            className="premium-input"
                            style={{ height: '80px', paddingTop: '8px', resize: 'none', width: '100%', boxSizing: 'border-box' }}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            autoFocus
                        />
                        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" className="btn-cancel" onClick={() => setCancelTransferId(null)}>Close</button>
                            <button type="button" className="btn-danger" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={confirmCancelTransfer}>Confirm Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchScreen;
