import React, { useState, useEffect } from 'react';
import '../styles/PurchaseScreen.css';
import { purchaseAPI, branchesAPI, suppliersAPI } from '../services/api';
import CreatePOModal from './CreatePOModal';
import CreateGRNModal from './CreateGRNModal';
import ViewPOModal from './ViewPOModal';
import PrintBarcodeModal from './PrintBarcodeModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PurchaseScreen = ({ defaultTab = 'po' }) => {
    const [orders, setOrders] = useState([]);
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPOModal, setShowPOModal] = useState(false);
    const [showGRNModal, setShowGRNModal] = useState(false);
    const [viewPOId, setViewPOId] = useState(null);
    const [branchList, setBranchList] = useState([]);
    const [supplierList, setSupplierList] = useState([]);

    // New Filter States for GRN
    const [filterGrnNo, setFilterGrnNo] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterPoNo, setFilterPoNo] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const [filterItemCode, setFilterItemCode] = useState('');
    const [filterItemName, setFilterItemName] = useState('');

    // Barcode Printing State
    const [selectedGRNItems, setSelectedGRNItems] = useState([]);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    
    // Popup State
    const [popupMessage, setPopupMessage] = useState(null);
    
    useEffect(() => {
        fetchDropdownData();
        if (defaultTab === 'po') {
            fetchPurchaseOrders();
        } else if (defaultTab === 'grn') {
            fetchGRNs();
        }
    }, [defaultTab]);

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
            if (filterItemName) params.itemName = filterItemName;
            
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

    const handleCheckboxChange = (e, item) => {
        if (e.target.checked) {
            setSelectedGRNItems([...selectedGRNItems, item]);
        } else {
            setSelectedGRNItems(selectedGRNItems.filter(i => i.grn_item_id !== item.grn_item_id));
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedGRNItems(grns);
        } else {
            setSelectedGRNItems([]);
        }
    };

    const handleDeleteGRNItem = async (grnItemId) => {
        if (!window.confirm("Are you sure you want to delete this GRN item? This will remove it from inventory.")) return;
        try {
            await purchaseAPI.deleteGRNItem(grnItemId);
            fetchGRNs(); // Refresh the list
        } catch (err) {
            console.error("Error deleting GRN item:", err);
            alert("Failed to delete GRN item");
        }
    };

    const handleViewGRNItem = (item) => {
        setPopupMessage({
            title: "GRN Details",
            content: `GRN Reference: ${item.grn_number}\nItem Name: ${item.item_name}\nSupplier: ${item.supplier_name}\nQuantity Received: ${item.recvd_qty}`
        });
    };

    const handleExportGRNs = () => {
        if (grns.length === 0) {
            alert("No GRNs to export.");
            return;
        }

        const headers = ["Sl No", "Branch", "Supplier", "GRN Ref#", "Date", "PO Ref#", "Item Code", "Item Name", "Order Qty", "Recvd Qty", "Due Qty", "Made By", "Status"];
        const csvRows = [headers.join(',')];

        grns.forEach((item, index) => {
            const orderQty = item.order_qty || 0;
            const recvdQty = item.recvd_qty || 0;
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
                dueQty,
                `"${item.made_by || ''}"`,
                `"${item.status || 'New'}"`
            ];
            csvRows.push(rowData.join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `GRN_Export_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (grns.length === 0) {
            alert("No GRNs to export.");
            return;
        }

        const doc = new jsPDF('landscape');
        doc.setFontSize(14);
        doc.text("Goods Received Notes (GRN) Export", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const tableColumn = ["Sl No", "Branch", "Supplier", "GRN Ref#", "Date", "PO Ref#", "Item Name", "Order", "Recvd", "Due", "Status"];
        const tableRows = [];

        grns.forEach((item, index) => {
            const orderQty = item.order_qty || 0;
            const recvdQty = item.recvd_qty || 0;
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
                dueQty,
                item.status || 'New'
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 73, 94] }
        });

        doc.save(`GRN_Export_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
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

    const renderGRN = () => (
        <div className="crm-content">
            <div className="grn-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>New GRN / GRNs</h3>
                <button className="btn-primary" onClick={() => setShowGRNModal(true)} style={{ background: '#20b2aa' }}>+ New GRN</button>
            </div>

            <div className="grn-filter-panel" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', border: '1px solid #dee2e6', marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', alignItems: 'center' }}>
                    <input type="text" placeholder="GRN no" className="search-input" value={filterGrnNo} onChange={e => setFilterGrnNo(e.target.value)} />
                    <select className="search-input" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                        <option value="">Any Branch</option>
                        {branchList.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <input type="text" placeholder="All Pur. Order No" className="search-input" value={filterPoNo} onChange={e => setFilterPoNo(e.target.value)} />
                    <select className="search-input" value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
                        <option value="">All Supplier</option>
                        {supplierList.map(s => (
                            <option key={s.id} value={s.supplier_name}>{s.supplier_name}</option>
                        ))}
                    </select>
                    
                    <input type="date" className="search-input" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} title="From Date" />
                    <input type="date" className="search-input" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} title="To Date" />
                    
                    <div style={{ gridColumn: '3 / 5', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button className="btn-primary" onClick={fetchGRNs} style={{ background: '#34495e', padding: '8px 20px' }}>Search</button>
                        <button className="btn-primary" onClick={handleExportGRNs} style={{ background: '#16a085', padding: '8px 20px' }}>Export CSV</button>
                        <button className="btn-primary" onClick={handleExportPDF} style={{ background: '#c0392b', padding: '8px 20px' }}>Export PDF</button>
                    </div>
                </div>
            </div>

            <div className="grn-actions-bar" style={{ display: 'flex', gap: '5px', marginBottom: '15px', alignItems: 'center' }}>
                <button className="btn-primary" onClick={() => setShowBarcodeModal(true)} style={{ background: '#e74c3c', padding: '6px 12px', fontSize: '12px' }}>Print Barcode</button>
            </div>

            <div style={{ fontSize: '12px', color: '#2980b9', marginBottom: '5px', fontWeight: 'bold' }}>
                {grns.length < 10 ? `0${grns.length}` : grns.length} Records Found!
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="crm-table single-line-table grn-detailed-table" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <thead>
                        <tr style={{ color: '#00b4d8' }}>
                            <th>
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll} 
                                    checked={grns.length > 0 && selectedGRNItems.length === grns.length}
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
                            <th>Recvd.Qty UOM</th>
                            <th>Free.Qty UOM</th>
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
                        ) : grns.length > 0 ? (
                            grns.map((item, index) => {
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
                                    <td>{orderQty} - Nos</td>
                                    <td>{recvdQty} - Nos</td>
                                    <td>0 - Nos</td>
                                    <td>{dueQty} - Nos</td>
                                    <td>{item.made_by}</td>
                                    <td><button className="btn-icon" style={{color:'#3498db', fontSize:'14px'}} onClick={() => setPopupMessage({ title: 'Log History', content: 'Log history is currently empty for this item.' })}>👁️</button></td>
                                    <td><button className="btn-icon" style={{color:'#e74c3c', fontSize:'14px'}} onClick={() => handleViewGRNItem(item)}>🔍</button></td>
                                    <td><span style={{background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px'}}>{item.status || 'New'}</span></td>
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

    const renderDueTracking = () => (
        <div className="crm-content">
            <div className="crm-grid-3" style={{ marginBottom: '12px' }}>
                <div className="report-card crimson">
                    <span className="card-title">Total Outstanding Dues</span>
                    <div className="card-value">₹8,45,600</div>
                    <div className="card-trend crimson">Across 12 Suppliers</div>
                </div>
                <div className="report-card warning">
                    <span className="card-title">Next 7 Days Payable</span>
                    <div className="card-value">₹1,20,000</div>
                </div>
            </div>
            <table className="crm-table single-line-table">
                <thead>
                    <tr>
                        <th>Supplier Name</th>
                        <th>Total Due (₹)</th>
                        <th>Overdue Amount</th>
                        <th>Credit Days Left</th>
                        <th>Last Payment</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ fontWeight: 'bold' }}>Samsung India</td>
                        <td style={{ color: '#ef4444', fontWeight: '800' }}>₹4,50,000</td>
                        <td>₹0</td>
                        <td>12 Days</td>
                        <td>01-Mar-26</td>
                        <td><button className="btn-small success">Clear Dual</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    const getTitle = () => {
        if (defaultTab === 'po') return 'Purchase Orders';
        if (defaultTab === 'grn') return 'Goods Received Note (GRN)';
        if (defaultTab === 'due') return 'Supplier Due Tracking';
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
        </div>
    );
};

export default PurchaseScreen;
