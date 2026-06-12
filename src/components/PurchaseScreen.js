import React, { useState, useEffect } from 'react';
import '../styles/PurchaseScreen.css';
import { purchaseAPI, branchesAPI, suppliersAPI } from '../services/api';
import CreatePOModal from './CreatePOModal';
import CreateGRNModal from './CreateGRNModal';
import ViewPOModal from './ViewPOModal';
import PrintBarcodeModal from './PrintBarcodeModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePopup } from './ui/PopupProvider';

import API_BASE from '../config/serverConfig';

const PurchaseScreen = ({ defaultTab = 'po', autoOpenModal = false }) => {
    const popup = usePopup();
    const [orders, setOrders] = useState([]);
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPOModal, setShowPOModal] = useState(false);
    const [showGRNModal, setShowGRNModal] = useState(false);
    const [viewPOId, setViewPOId] = useState(null);
    const [branchList, setBranchList] = useState([]);
    const [supplierList, setSupplierList] = useState([]);

    const getLocalDateStr = () => {
        const today = new Date();
        return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    };

    // GRN Filters
    const [filterGrnNo, setFilterGrnNo] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterPoNo, setFilterPoNo] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterFromDate, setFilterFromDate] = useState(getLocalDateStr());
    const [filterToDate, setFilterToDate] = useState(getLocalDateStr());

    // Barcode Printing State
    const [selectedGRNItems, setSelectedGRNItems] = useState([]);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    
    // Popup State
    const [popupMessage, setPopupMessage] = useState(null);
    
    // Damaged Returns State
    const [damagedItems, setDamagedItems] = useState([]);
    const [filterDamagedDate, setFilterDamagedDate] = useState('');
    const [filterDamagedSupplier, setFilterDamagedSupplier] = useState('');
    const [filterDamagedItem, setFilterDamagedItem] = useState('');
    
    // Dues tracking state
    const [duesData, setDuesData] = useState({ summary: {}, suppliers: [] });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    
    useEffect(() => {
        fetchDropdownData();
        if (defaultTab === 'po') {
            fetchPurchaseOrders();
        } else if (defaultTab === 'grn') {
            fetchGRNs();
            if (autoOpenModal) {
                setShowGRNModal(true);
            }
        } else if (defaultTab === 'returns') {
            fetchDamagedItems();
        } else if (defaultTab === 'due') {
            fetchDuesData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultTab, autoOpenModal]);

    const fetchDropdownData = async () => {
        try {
            const [bRes, sRes] = await Promise.all([
                branchesAPI.getAll(),
                suppliersAPI.getAll()
            ]);
            if (Array.isArray(bRes)) setBranchList(bRes);
            if (Array.isArray(sRes)) setSupplierList(sRes);
        } catch (error) {
            console.error("Failed to fetch dropdown data:", error);
        }
    };

    const fetchPurchaseOrders = async () => {
        try {
            setLoading(true);
            const res = await purchaseAPI.getOrders();
            if (res.success) {
                setOrders(res.purchaseOrders);
            }
        } catch (err) {
            console.error("Failed to fetch POs:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGRNs = async () => {
        try {
            setLoading(true);
            // Clean empty params safely
            const params = {};
            if (filterGrnNo) params.grnNo = filterGrnNo;
            if (filterBranch) params.branchId = filterBranch;
            if (filterPoNo) params.poNo = filterPoNo;
            if (filterSupplier) params.supplier = filterSupplier;
            if (filterFromDate) params.fromDate = filterFromDate;
            if (filterToDate) params.toDate = filterToDate;

            
            const res = await purchaseAPI.getGRNs(params);
            if (res.success) {
                setGrns(res.grns);
            }
        } catch (err) {
            console.error("Failed to fetch GRNs:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDamagedItems = async () => {
        try {
            setLoading(true);
            const res = await purchaseAPI.getDamaged();
            if (res.success) {
                setDamagedItems(res.damagedItems);
            }
        } catch (err) {
            console.error("Failed to fetch damaged items:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDuesData = async () => {
        try {
            setLoading(true);
            const res = await suppliersAPI.getDues();
            if (res.success) {
                setDuesData({ summary: res.summary, suppliers: res.suppliers });
            }
        } catch (err) {
            console.error("Failed to fetch dues:", err);
            popup.showError("Failed to fetch supplier dues.");
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!paymentAmount || paymentAmount <= 0) {
            popup.showError("Please enter a valid payment amount.");
            return;
        }

        try {
            setLoading(true);
            const res = await suppliersAPI.addPayment({
                supplier_name: selectedSupplierForPayment.supplier_name,
                amount: paymentAmount,
                payment_method: paymentMethod,
                notes: paymentNotes
            });

            if (res.success) {
                popup.showSuccess("Payment recorded successfully!");
                setShowPaymentModal(false);
                setPaymentAmount('');
                setPaymentNotes('');
                fetchDuesData(); // Refresh the data
            } else {
                popup.showError(res.message || "Failed to record payment.");
            }
        } catch (err) {
            console.error("Error recording payment:", err);
            popup.showError("An error occurred while recording the payment.");
        } finally {
            setLoading(false);
        }
    };

    const handleProcessReturn = async (itemId) => {
        const ok = await popup.confirm("Mark this item as returned to vendor?");
        if (!ok) return;

        try {
            setLoading(true);
            const res = await purchaseAPI.processReturn(itemId);
            if (res.success) {
                popup.showSuccess("Item marked as returned successfully!");
                fetchDamagedItems(); // Refresh the list
            } else {
                popup.showError(res.message || "Failed to process return.");
            }
        } catch (err) {
            popup.showError("An error occurred while processing the return.");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (e, item) => {
        if (e.target.checked) {
            setSelectedGRNItems([...selectedGRNItems, item]);
        } else {
            setSelectedGRNItems(selectedGRNItems.filter(i => i.grn_item_id !== item.grn_item_id));
        }
    };

    const handleSelectAll = (e) => {
        const availableItems = grns.filter(item => !item.pushed_to_stock);
        if (selectedGRNItems.length === availableItems.length && availableItems.length > 0) {
            setSelectedGRNItems([]);
        } else {
            setSelectedGRNItems(availableItems);
        }
    };

    const handlePushToStock = async () => {
        if (selectedGRNItems.length === 0) {
            popup.showError("Please select at least one GRN item to push to stock.");
            return;
        }

        // Only include items that haven't been pushed yet
        const unpushedItems = selectedGRNItems.filter(i => !i.pushed_to_stock);
        if (unpushedItems.length === 0) {
            popup.showInfo("All selected items have already been pushed to stock.");
            return;
        }

        const ok = await popup.confirm(`Are you sure you want to push ${unpushedItems.length} item(s) to the main inventory stock?`);
        if (!ok) return;

        try {
            const itemIds = unpushedItems.map(i => i.grn_item_id);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/purchases/grn/push-to-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ itemIds })
            });
            const data = await response.json();
            
            if (data.success) {
                popup.showSuccess(data.message || "Items successfully pushed to stock!");
                setSelectedGRNItems([]);
                fetchGRNs(); // Refresh the list to show updated status
            } else {
                throw new Error(data.message || "Failed to push to stock");
            }
        } catch (err) {
            console.error("Error pushing to stock:", err);
            popup.showError(err.message || "Failed to push items to stock");
        }
    };

    const handleDeleteGRNItem = async (grnItemId) => {
        const ok = await popup.confirm("Are you sure you want to delete this GRN item? This will remove it from inventory.");
        if (!ok) return;
        try {
            await purchaseAPI.deleteGRNItem(grnItemId);
            fetchGRNs(); // Refresh the list
        } catch (err) {
            console.error("Error deleting GRN item:", err);
            popup.showError("Failed to delete GRN item");
        }
    };

    const handleViewGRNItem = (item) => {
        setPopupMessage({
            title: "GRN Details",
            content: `GRN Reference: ${item.grn_number}\nItem Name: ${item.item_name}\nSupplier: ${item.supplier_name}\nQuantity Received: ${item.recvd_qty}\nDamaged Quantity: ${item.damaged_qty || 0}\nGood Quantity: ${item.recvd_qty - (item.damaged_qty || 0)}`
        });
    };

    const handleExportGRNs = () => {
        if (grns.length === 0) {
            popup.showInfo("No GRNs to export.");
            return;
        }

        const headers = ["Sl No", "Branch", "Supplier", "GRN Ref#", "Date", "PO Ref#", "Item Code", "Item Name", "Order Qty", "Recvd Qty", "Damaged Qty", "Good Qty", "Due Qty", "Made By", "Status"];
        const csvRows = [headers.join(',')];

        grns.forEach((item, index) => {
            const orderQty = item.order_qty || 0;
            const recvdQty = item.recvd_qty || 0;
            const damagedQty = item.damaged_qty || 0;
            const goodQty = recvdQty - damagedQty;
            const dueQty = Math.max(0, orderQty - recvdQty);
            const rowData = [
                index + 1,
                `"${item.branch_name || ''}"`,
                `"${item.supplier_name || ''}"`,
                `"${item.grn_number || ''}"`,
                `"${new Date(item.grn_date).toLocaleDateString()}"`,
                `"${item.po_number || '-'}"`,
                `"841030"`, // Item Code Placeholder
                `"${item.item_name || ''}"`,
                orderQty,
                recvdQty,
                damagedQty,
                goodQty,
                dueQty,
                `"${item.made_by || ''}"`,
                `"${item.status || ''}"`
            ];
            csvRows.push(rowData.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grn_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportDamagedItems = () => {
        if (filteredDamagedItems.length === 0) {
            popup.showInfo("No items to export.");
            return;
        }
        
        const headers = ["GRN No", "Date", "Supplier", "Branch", "Item Name", "Damaged Qty", "Status", "Returned Date"];
        const csvRows = [headers.join(',')];
        
        filteredDamagedItems.forEach(item => {
            const rowData = [
                `"${item.grn_number}"`,
                `"${new Date(item.grn_date).toLocaleDateString()}"`,
                `"${item.supplier_name || ''}"`,
                `"${item.branch_name || 'N/A'}"`,
                `"${item.item_name || ''}"`,
                item.damaged_quantity,
                `"${item.return_status}"`,
                `"${item.return_status === 'Returned' && item.return_date ? new Date(item.return_date).toLocaleDateString() : ''}"`
            ];
            csvRows.push(rowData.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `damaged_returns_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportDamagedPDF = () => {
        if (filteredDamagedItems.length === 0) {
            popup.showInfo("No items to export.");
            return;
        }

        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text("Damaged Goods & Returns Report", 14, 22);
        
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = ["GRN No", "Date", "Supplier", "Branch", "Item Name", "Damaged Qty", "Status", "Returned Date"];
        const tableRows = [];

        filteredDamagedItems.forEach(item => {
            const rowData = [
                item.grn_number,
                new Date(item.grn_date).toLocaleDateString(),
                item.supplier_name || '',
                item.branch_name || 'N/A',
                item.item_name || '',
                item.damaged_quantity,
                item.return_status,
                item.return_status === 'Returned' && item.return_date ? new Date(item.return_date).toLocaleDateString() : ''
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
    };


    const handleExportPDF = () => {
        if (grns.length === 0) {
            popup.showInfo("No GRNs to export.");
            return;
        }

        const doc = new jsPDF('landscape');
        doc.setFontSize(14);
        doc.text("Goods Received Notes (GRN) Export", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const tableColumn = ["Sl No", "Branch", "Supplier", "GRN Ref#", "Date", "PO Ref#", "Item Name", "Order", "Recvd", "Damaged", "Good", "Due", "Status"];
        const tableRows = [];

        grns.forEach((item, index) => {
            const orderQty = item.order_qty || 0;
            const recvdQty = item.recvd_qty || 0;
            const damagedQty = item.damaged_qty || 0;
            const goodQty = recvdQty - damagedQty;
            const dueQty = Math.max(0, orderQty - recvdQty);
            const rowData = [
                index + 1,
                item.branch_name || '-',
                item.supplier_name || '-',
                item.grn_number || '-',
                new Date(item.grn_date).toLocaleDateString(),
                item.po_number || '-',
                item.item_name || '-',
                orderQty,
                recvdQty,
                damagedQty,
                goodQty,
                dueQty,
                item.status || 'New'
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 73, 94] }
        });

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
    };

    const renderPurchaseOrders = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <input type="text" placeholder="Search PO # / Vendor..." className="search-input" />
                <button className="btn-primary" onClick={() => setShowPOModal(true)}>+ Create New PO</button>
            </div>
            <table className="crm-table single-line-table">
                <thead>
                    <tr>
                        <th>Order Date</th>
                        <th>PO #</th>
                        <th>Supplier</th>
                        <th>Expected Date</th>
                        <th>Total Val (₹)</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="7">Loading...</td></tr>
                    ) : orders.length > 0 ? (
                        orders.map(po => (
                            <tr key={po.id}>
                                <td>{new Date(po.order_date).toLocaleDateString()}</td>
                                <td style={{ fontWeight: '800' }}>{po.po_number}</td>
                                <td>{po.supplier_name}</td>
                                <td>{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}</td>
                                <td>₹{Number(po.total_amount).toLocaleString()}</td>
                                <td>
                                    <span className={`status-pill ${po.status === 'Pending' ? 'warning' : po.status === 'Received' ? 'success' : 'danger'}`}>
                                        {po.status}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn-icon" onClick={() => setViewPOId(po.id)} title="Print PO">🖨️</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="7">No Purchase Orders found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderGRN = () => {
        const pendingGrns = grns.filter(item => !item.pushed_to_stock);
        return (
        <div className="crm-content">
            <div className="grn-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>New GRN / GRNs</h3>
                <button className="btn-primary" onClick={() => setShowGRNModal(true)} style={{ background: '#20b2aa' }}>+ New GRN</button>
            </div>

            <div className="grn-filter-panel" style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', border: '1px solid #dee2e6', marginBottom: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', alignItems: 'center' }}>
                    <input type="text" placeholder="GRN no" className="search-input" style={{ padding: '6px' }} value={filterGrnNo} onChange={e => setFilterGrnNo(e.target.value)} />
                    <select className="search-input" style={{ padding: '6px' }} value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                        <option value="">Any Branch</option>
                        {branchList.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <input type="text" placeholder="All Pur. Order No" className="search-input" style={{ padding: '6px' }} value={filterPoNo} onChange={e => setFilterPoNo(e.target.value)} />
                    <select className="search-input" style={{ padding: '6px' }} value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
                        <option value="">All Supplier</option>
                        {supplierList.map(s => (
                            <option key={s.id} value={s.supplier_name}>{s.supplier_name}</option>
                        ))}
                    </select>
                    
                    <input type="date" className="search-input" style={{ padding: '6px' }} value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} title="From Date" />
                    <input type="date" className="search-input" style={{ padding: '6px' }} value={filterToDate} onChange={e => setFilterToDate(e.target.value)} title="To Date" />
                    
                    <div style={{ gridColumn: '3 / 5', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn-primary" onClick={fetchGRNs} style={{ background: '#34495e', padding: '6px 15px', fontSize: '12px' }}>Search</button>
                        <button className="btn-primary" onClick={handleExportGRNs} style={{ background: '#16a085', padding: '6px 15px', fontSize: '12px' }}>Export CSV</button>
                        <button className="btn-primary" onClick={handleExportPDF} style={{ background: '#c0392b', padding: '6px 15px', fontSize: '12px' }}>Export PDF</button>
                    </div>
                </div>
            </div>

            <div className="grn-actions-bar" style={{ display: 'flex', gap: '5px', marginBottom: '15px', alignItems: 'center' }}>
                <button className="btn-primary" onClick={handlePushToStock} style={{ background: '#27ae60', padding: '6px 12px', fontSize: '12px' }}>📦 Push to Stock</button>
                <button className="btn-primary" onClick={() => setShowBarcodeModal(true)} style={{ background: '#e74c3c', padding: '6px 12px', fontSize: '12px' }}>Print Barcode</button>
            </div>

            <div style={{ fontSize: '12px', color: '#2980b9', marginBottom: '5px', fontWeight: 'bold' }}>
                {pendingGrns.length < 10 ? `0${pendingGrns.length}` : pendingGrns.length} Records Found!
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="crm-table single-line-table grn-detailed-table" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <thead>
                        <tr style={{ color: '#00b4d8' }}>
                            <th>
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll} 
                                    checked={pendingGrns.length > 0 && selectedGRNItems.length === pendingGrns.length}
                                    disabled={pendingGrns.length === 0}
                                />
                            </th>
                            <th>Sl No</th>
                            <th>Branch ↕</th>
                            <th>Supplier ↕</th>
                            <th>GRN Ref# ↕</th>
                            <th>Date ↕</th>
                            <th>PO Ref# ↕</th>
                            <th>Item Code ↕</th>
                            <th>Item Name ↕</th>
                            <th>Order Qty</th>
                            <th>Recvd.Qty</th>
                            <th>Damaged</th>
                            <th>Good.Qty</th>
                            <th>Due Qty</th>
                            <th>Made By</th>
                            <th>Log</th>
                            <th>View</th>
                            <th>Status</th>
                            <th>Edit</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="19" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr>
                        ) : pendingGrns.length > 0 ? (
                            pendingGrns.map((item, index) => {
                                const orderQty = item.order_qty || 0;
                                const recvdQty = item.recvd_qty || 0;
                                const dueQty = Math.max(0, orderQty - recvdQty);

                                return (
                                <tr key={item.grn_item_id}>
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedGRNItems.some(i => i.grn_item_id === item.grn_item_id)}
                                            onChange={(e) => handleCheckboxChange(e, item)}
                                            disabled={item.pushed_to_stock}
                                        />
                                    </td>
                                    <td>{index + 1}</td>
                                    <td>{item.branch_name}</td>
                                    <td style={{ color: '#2980b9', fontWeight: 'bold' }}>{item.supplier_name}</td>
                                    <td>{item.grn_number}</td>
                                    <td>{new Date(item.grn_date).toLocaleDateString()}</td>
                                    <td>{item.po_number || '-'}</td>
                                    <td>{/* Placeholder Item Code */} 841030</td>
                                    <td>{item.item_name}</td>
                                    <td>{orderQty}</td>
                                    <td>{recvdQty}</td>
                                    <td style={{ color: item.damaged_qty > 0 ? '#e74c3c' : 'inherit' }}>{item.damaged_qty || 0}</td>
                                    <td style={{ fontWeight: 'bold', color: '#27ae60' }}>{recvdQty - (item.damaged_qty || 0)}</td>
                                    <td>{dueQty} - Nos</td>
                                    <td>{item.made_by}</td>
                                    <td><button className="btn-icon" style={{color:'#3498db', fontSize:'14px'}} onClick={() => setPopupMessage({ title: 'Log History', content: 'Log history is currently empty for this item.' })}>👁️</button></td>
                                    <td><button className="btn-icon" style={{color:'#e74c3c', fontSize:'14px'}} onClick={() => handleViewGRNItem(item)}>🔍</button></td>
                                    <td>
                                        <span style={{
                                            background: item.pushed_to_stock ? '#27ae60' : '#e74c3c', 
                                            color: 'white', 
                                            padding: '2px 6px', 
                                            borderRadius: '4px', 
                                            fontSize: '10px'
                                        }}>
                                            {item.pushed_to_stock ? 'In Stock' : (item.status || 'New')}
                                        </span>
                                    </td>
                                    <td><button className="btn-icon" style={{color:'#2ecc71', fontSize:'14px'}} onClick={() => setPopupMessage({ title: 'Editing Disabled', content: 'Editing GRN items directly is disabled to maintain integrity. Please delete and recreate if an error was made.' })}>✏️</button></td>
                                    <td><button className="btn-icon" style={{color:'#e74c3c', fontSize:'14px'}} onClick={() => handleDeleteGRNItem(item.grn_item_id)}>🗑️</button></td>
                                </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan="19" style={{textAlign: 'center', padding: '20px'}}>No records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        );
    };

    const renderDueTracking = () => (
        <div className="crm-content">
            <div className="crm-grid-3" style={{ marginBottom: '12px' }}>
                <div className="report-card crimson">
                    <span className="card-title">Total Outstanding Dues</span>
                    <div className="card-value">₹{Number(duesData.summary.total_outstanding || 0).toLocaleString()}</div>
                    <div className="card-trend crimson">Across {duesData.summary.supplier_count || 0} Suppliers</div>
                </div>
                <div className="report-card warning">
                    <span className="card-title">Next 7 Days Payable</span>
                    <div className="card-value">₹{Number(duesData.summary.next_7_days_payable || 0).toLocaleString()}</div>
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
                    {loading ? (
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
                                            className="btn-small success" 
                                            onClick={() => {
                                                setSelectedSupplierForPayment(supplier);
                                                setPaymentAmount(supplier.total_due);
                                                setShowPaymentModal(true);
                                            }}
                                        >
                                            Record Payment
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
    );

    const filteredDamagedItems = damagedItems.filter(item => {
        const matchDate = filterDamagedDate ? item.grn_date.startsWith(filterDamagedDate) : true;
        const matchSupplier = filterDamagedSupplier ? item.supplier_name.toLowerCase().includes(filterDamagedSupplier.toLowerCase()) : true;
        const matchItem = filterDamagedItem ? item.item_name.toLowerCase().includes(filterDamagedItem.toLowerCase()) : true;
        return matchDate && matchSupplier && matchItem;
    });

    const renderDamagedReturns = () => (
        <div className="crm-content">
            <div className="crm-toolbar" style={{ padding: '15px 15px 0 15px' }}>
                <input 
                    type="date" 
                    className="crm-search" 
                    value={filterDamagedDate}
                    onChange={(e) => setFilterDamagedDate(e.target.value)}
                    title="Filter by GRN Date"
                    style={{ flex: '0 0 auto', width: '150px' }}
                />
                <input 
                    type="text" 
                    className="crm-search" 
                    placeholder="Search by Supplier..." 
                    value={filterDamagedSupplier}
                    onChange={(e) => setFilterDamagedSupplier(e.target.value)}
                />
                <input 
                    type="text" 
                    className="crm-search" 
                    placeholder="Search by Item Name..." 
                    value={filterDamagedItem}
                    onChange={(e) => setFilterDamagedItem(e.target.value)}
                />
                <button className="btn-add-customer" onClick={handleExportDamagedItems}>
                    Export CSV
                </button>
                <button className="btn-add-customer" onClick={handleExportDamagedPDF} style={{ marginLeft: '10px', background: '#e74c3c' }}>
                    Export PDF
                </button>
            </div>
            <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '15px' }}>
                <table className="crm-table single-line-table">
                    <thead>
                        <tr>
                            <th>GRN No</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th>Branch</th>
                            <th>Item Name</th>
                            <th>Damaged Qty</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Loading damaged items...</td></tr>
                        ) : filteredDamagedItems.length > 0 ? (
                            filteredDamagedItems.map((item) => (
                                <tr key={item.grn_item_id}>
                                    <td><strong>{item.grn_number}</strong></td>
                                    <td>{new Date(item.grn_date).toLocaleDateString()}</td>
                                    <td>{item.supplier_name}</td>
                                    <td>{item.branch_name || 'N/A'}</td>
                                    <td>{item.item_name}</td>
                                    <td style={{ color: '#e74c3c', fontWeight: 'bold' }}>{item.damaged_quantity}</td>
                                    <td>
                                        <span className={`status-badge ${item.return_status === 'Returned' ? 'success' : 'warning'}`}>
                                            {item.return_status}
                                        </span>
                                    </td>
                                    <td>
                                        {item.return_status !== 'Returned' ? (
                                            <button 
                                                className="btn-small success" 
                                                onClick={() => handleProcessReturn(item.grn_item_id)}
                                            >
                                                Process Return
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                                                Returned on {new Date(item.return_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>No damaged items found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const getTitle = () => {
        if (defaultTab === 'po') return 'Purchase Orders';
        if (defaultTab === 'grn') return 'Goods Received Note (GRN)';
        if (defaultTab === 'due') return 'Supplier Due Tracking';
        if (defaultTab === 'returns') return 'Damaged Goods & Returns';
        return 'Management';
    };

    return (
        <div className="purchase-screen">
            <div className="admin-content-header" style={{ marginBottom: '12px' }}>
                <h2 className="screen-title" style={{ fontSize: '1rem', fontWeight: '800' }}>
                    📦 {getTitle()}
                </h2>
            </div>

            {defaultTab === 'po' && renderPurchaseOrders()}
            {defaultTab === 'grn' && renderGRN()}
            {defaultTab === 'due' && renderDueTracking()}
            {defaultTab === 'returns' && renderDamagedReturns()}

            <CreatePOModal 
                isOpen={showPOModal} 
                onClose={() => setShowPOModal(false)}
                onSuccess={() => {
                    setShowPOModal(false);
                    fetchPurchaseOrders();
                }}
            />

            <CreateGRNModal 
                isOpen={showGRNModal} 
                onClose={() => setShowGRNModal(false)}
                onSuccess={() => {
                    setShowGRNModal(false);
                    fetchGRNs();
                }}
            />

            <ViewPOModal 
                isOpen={!!viewPOId}
                poId={viewPOId}
                onClose={() => setViewPOId(null)}
            />

            <PrintBarcodeModal 
                isOpen={showBarcodeModal} 
                onClose={() => setShowBarcodeModal(false)} 
                items={selectedGRNItems} 
            />

            {/* Custom Information Popup */}
            {popupMessage && (
                <div className="branch-modal-overlay">
                    <div className="branch-modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                            {popupMessage.title || 'Information'}
                        </h3>
                        <p style={{ whiteSpace: 'pre-line', color: '#555', lineHeight: '1.5', marginBottom: '20px' }}>
                            {popupMessage.content}
                        </p>
                        <div className="modal-actions" style={{ justifyContent: 'center' }}>
                            <button className="btn-primary" onClick={() => setPopupMessage(null)}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && selectedSupplierForPayment && (
                <div className="branch-modal-overlay">
                    <div className="branch-modal">
                        <h3>Record Payment to {selectedSupplierForPayment.supplier_name}</h3>
                        <form onSubmit={handleRecordPayment}>
                            <div className="form-group">
                                <label>Outstanding Balance</label>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                                    ₹{Number(selectedSupplierForPayment.total_due).toLocaleString()}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Amount Paying Now (₹)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required 
                                    className="form-control"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={selectedSupplierForPayment.total_due}
                                />
                            </div>
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select 
                                    className="form-control"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Notes / Reference No</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Recording...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseScreen;
