import React, { useState, useEffect, useRef } from 'react';
import { purchaseAPI, branchesAPI, productsAPI, sparesAPI, suppliersAPI } from '../services/api';
import '../styles/AddItemModal.css';
import { usePopup } from './ui/PopupProvider';
import ScanningOverlay from './ScanningOverlay';

const SearchableSelect = ({ options, value, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredOptions = options.filter(opt => (opt.label || '').toLowerCase().includes((search || '').toLowerCase()));
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%', fontSize: '0.9rem', padding: '6px 8px', border: '1px solid #cbd5e1', 
                    borderRadius: '4px', background: '#f8fafc', color: value ? '#047857' : '#64748b',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    minHeight: '34px'
                }}
                title="Map to existing master inventory product to avoid creating duplicates"
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span style={{ fontSize: '0.8rem' }}>▼</span>
            </div>
            
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                    background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '2px',
                    minHeight: '150px', maxHeight: '220px', overflowY: 'auto'
                }}>
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Search..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px', border: 'none', borderBottom: '1px solid #eee', outline: 'none', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}
                    />
                    <div>
                        <div 
                            onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
                            style={{ padding: '8px', fontSize: '0.9rem', cursor: 'pointer', color: '#64748b' }}
                            onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                            -- Create as New Product --
                        </div>
                        {filteredOptions.map(opt => (
                            <div 
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(""); }}
                                style={{ padding: '8px', fontSize: '0.9rem', cursor: 'pointer', background: value === opt.value ? '#e0f2fe' : 'transparent', color: '#333' }}
                                onMouseEnter={e => e.target.style.background = value === opt.value ? '#e0f2fe' : '#f8fafc'}
                                onMouseLeave={e => e.target.style.background = value === opt.value ? '#e0f2fe' : 'transparent'}
                            >
                                {opt.label}
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div style={{ padding: '8px', fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center' }}>No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const CreateGRNModal = ({ isOpen, onClose, onSuccess }) => {
    const popup = usePopup();
    const fileInputRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    
    const [branches, setBranches] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    
    const [formData, setFormData] = useState({
        branch_id: '',
        po_id: '',
        supplier_name: '',
        warehouse: 'Main Warehouse',
        grn_date: new Date().toISOString().split('T')[0],
        status: 'Stocked'
    });
    
    const [items, setItems] = useState([
        { product_name: '', quantity_received: 1, damaged_quantity: 0 }
    ]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [inventoryList, setInventoryList] = useState([]);
    const [supplierList, setSupplierList] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [branchesData, poData, productsData, sparesData, suppliersData] = await Promise.all([
                branchesAPI.getAll(),
                purchaseAPI.getOrders(),
                productsAPI.getAll(),
                sparesAPI.getAll(),
                suppliersAPI.getAll()
            ]);
            
            setBranches(branchesData);
            if (branchesData.length > 0) {
                setFormData(prev => ({ ...prev, branch_id: branchesData[0].id }));
            }

            if (poData.success) {
                // Only show POs that haven't been fully received yet
                const pendingPOs = poData.purchaseOrders.filter(po => po.status !== 'Received' && po.status !== 'Cancelled');
                setPurchaseOrders(pendingPOs);
            }

            // Combine sales and service inventory
            let combinedInventory = [];
            if (productsData && Array.isArray(productsData)) {
                combinedInventory = [...combinedInventory, ...productsData.map(p => ({...p, inv_type: 'sales'}))];
            }
            if (sparesData && Array.isArray(sparesData)) {
                combinedInventory = [...combinedInventory, ...sparesData.map(s => ({...s, inv_type: 'service'}))];
            }
            setInventoryList(combinedInventory);

            if (suppliersData && Array.isArray(suppliersData)) {
                setSupplierList(suppliersData);
            }

        } catch (err) {
            console.error("Error fetching initial data:", err);
        }
    };

    const handlePOChange = async (e) => {
        const selectedPOId = e.target.value;
        setFormData(prev => ({ ...prev, po_id: selectedPOId }));

        if (selectedPOId) {
            // Auto-fill supplier name from PO
            const selectedPO = purchaseOrders.find(po => po.id.toString() === selectedPOId);
            if (selectedPO) {
                setFormData(prev => ({ ...prev, supplier_name: selectedPO.supplier_name, branch_id: selectedPO.branch_id }));
            }

            // Fetch detailed items for the selected PO
            try {
                const res = await purchaseAPI.getOrder(selectedPOId);
                if (res.success && res.purchaseOrder && res.purchaseOrder.items) {
                    const poItems = res.purchaseOrder.items.map(item => ({
                        product_name: item.product_name,
                        quantity_received: item.quantity, // default to ordered quantity
                        damaged_quantity: 0
                    }));
                    if (poItems.length > 0) {
                        setItems(poItems);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch PO details:", err);
            }
        } else {
            // Reset to empty row if "None" selected
            setItems([{ product_name: '', quantity_received: 1, damaged_quantity: 0 }]);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItemRow = () => {
        setItems([...items, { product_name: '', quantity_received: 1, damaged_quantity: 0 }]);
    };

    const removeItemRow = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Validate items
            const validItems = items.filter(item => 
                item.product_name.trim() !== '' && 
                item.quantity_received > 0 &&
                (item.damaged_quantity || 0) <= item.quantity_received
            );
            if (validItems.length === 0) {
                throw new Error("Please add at least one valid item to the GRN.");
            }

            const payload = {
                ...formData,
                po_id: formData.po_id === '' ? null : formData.po_id,
                items: validItems
            };

            await purchaseAPI.createGRN(payload);
            
            // Reset form
            setFormData({
                branch_id: branches.length > 0 ? branches[0].id : '',
                po_id: '',
                supplier_name: '',
                warehouse: 'Main Warehouse',
                grn_date: new Date().toISOString().split('T')[0],
                status: 'Stocked'
            });
            setItems([{ product_name: '', quantity_received: 1, damaged_quantity: 0 }]);
            
            onSuccess();
        } catch (err) {
            setError(err.message || 'Error creating GRN');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsScanning(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            const formDataData = new FormData();
            formDataData.append('document', file);

            // Using the same endpoint as InventoryScreen
            const { API_CONFIG } = require('../config/apiConfig');
            const API_BASE = API_CONFIG.BASE_URL;
            const response = await fetch(`${API_BASE}/ocr/scan-bill`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataData
            });

            if (response.status === 402) {
                const data = await response.json();
                popup.showError(data.message || 'Insufficient wallet balance to scan.');
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to scan bill');
            }

            const data = await response.json();
            if (data.success) {
                // Deduct balance locally if provided
                if (data.newWalletBalance !== undefined) {
                    try {
                        const saved = localStorage.getItem('adminUser');
                        if (saved) {
                            const user = JSON.parse(saved);
                            user.scan_wallet_balance = data.newWalletBalance;
                            localStorage.setItem('adminUser', JSON.stringify(user));
                            window.dispatchEvent(new Event('walletUpdated'));
                        }
                    } catch (e) {}
                }

                // Populate items
                if (data.items && data.items.length > 0) {
                    const scannedItems = data.items.map(item => ({
                        product_name: item.name || '',
                        hsn: item.hsn || '',
                        gst: item.gst || 0,
                        quantity_received: item.quantity || 1,
                        damaged_quantity: 0,
                        netRate: item.netRate || 0,
                        rate: item.rate || 0,
                        discount: item.discount || 0,
                        amount: item.amount || 0
                    }));
                    setItems(scannedItems);
                    popup.showSuccess(`Successfully scanned ${scannedItems.length} items!`);
                } else {
                    popup.showError('No items could be read from the document.');
                }
            } else {
                throw new Error(data.message || 'Scan failed');
            }
        } catch (err) {
            console.error('Scan Error:', err);
            popup.showError(err.message || 'Failed to process invoice image.');
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '100vw', height: '100vh', maxWidth: '100%', maxHeight: '100%', margin: 0, borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>+ New Goods Receipt (GRN)</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
                    
                    <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Linked Purchase Order</label>
                            <select 
                                value={formData.po_id}
                                onChange={handlePOChange}
                                className="search-input"
                            >
                                <option value="">-- None (Direct Receipt) --</option>
                                {purchaseOrders.map(po => (
                                    <option key={po.id} value={po.id}>{po.po_number} - {po.supplier_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Supplier Name *</label>
                            <input 
                                type="text" 
                                list="grn-supplier-list"
                                required
                                value={formData.supplier_name}
                                onChange={e => setFormData({...formData, supplier_name: e.target.value})}
                                className="search-input"
                                placeholder="e.g. Samsung Distro"
                            />
                            <datalist id="grn-supplier-list">
                                {supplierList.map(sup => (
                                    <option key={sup.id} value={sup.supplier_name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Branch *</label>
                            <select 
                                required
                                value={formData.branch_id}
                                onChange={e => setFormData({...formData, branch_id: e.target.value})}
                                className="search-input"
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Warehouse</label>
                            <input 
                                type="text" 
                                value={formData.warehouse}
                                onChange={e => setFormData({...formData, warehouse: e.target.value})}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>GRN Date *</label>
                            <input 
                                type="date" 
                                required
                                value={formData.grn_date}
                                onChange={e => setFormData({...formData, grn_date: e.target.value})}
                                className="search-input"
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Status *</label>
                            <select 
                                required
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value})}
                                className="search-input"
                            >
                                <option value="Stocked">Stocked (Received & Available)</option>
                                <option value="Pending QA">Pending QA (Received but not available)</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    <div className="items-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Items Received</h3>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <button 
                                    type="button" 
                                    onClick={async () => {
                                        const isConfirmed = await popup.confirm("5 Points will be deducted from your wallet for this AI scan. Do you want to proceed?");
                                        if (isConfirmed) {
                                            fileInputRef.current.click();
                                        }
                                    }} 
                                    disabled={isScanning}
                                    style={{ 
                                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                                        color: '#fff', 
                                        border: 'none', 
                                        padding: '6px 12px', 
                                        borderRadius: '4px', 
                                        fontWeight: 'bold', 
                                        cursor: isScanning ? 'not-allowed' : 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    {isScanning ? '⏳ Scanning...' : '✨ Scan Bill with AI'}
                                </button>
                                <button type="button" onClick={addItemRow} className="btn-small success">+ Add Item</button>
                            </div>
                        </div>
                        <div style={{ position: 'relative' }}>
                            {isScanning && <ScanningOverlay />}
                            <table className="crm-table" style={{ marginBottom: '15px', overflow: 'visible' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '30%' }}>Product Name</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>HSN/SAC</th>
                                    <th style={{ width: '60px', textAlign: 'center' }}>GST%</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Damaged</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}>Net Rate</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}>Rate</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}>Discount</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}>Amount</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Item name"
                                                value={item.product_name}
                                                onChange={e => handleItemChange(index, 'product_name', e.target.value)}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '6px' }}
                                            />
                                            <SearchableSelect
                                                value={item.mapped_inventory_id ? `${item.inventory_type}_${item.mapped_inventory_id}` : ''}
                                                onChange={val => {
                                                    if (!val) {
                                                        handleItemChange(index, 'mapped_inventory_id', null);
                                                        handleItemChange(index, 'inventory_type', null);
                                                    } else {
                                                        const [type, id] = val.split('_');
                                                        handleItemChange(index, 'mapped_inventory_id', Number(id));
                                                        handleItemChange(index, 'inventory_type', type);
                                                    }
                                                }}
                                                placeholder="-- Create as New Product --"
                                                options={inventoryList.map(inv => ({
                                                    value: `${inv.inv_type}_${inv.id}`,
                                                    label: inv.category_name ? `${inv.name || 'Unnamed'} (${inv.category_name})` : (inv.name || 'Unnamed')
                                                }))}
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="text" 
                                                value={item.hsn || ''}
                                                onChange={e => handleItemChange(index, 'hsn', e.target.value)}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="number" step="any" 
                                                value={item.gst || 0}
                                                onChange={e => handleItemChange(index, 'gst', Number(e.target.value))}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '8px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="number" step="any" 
                                                required
                                                min="1"
                                                value={item.quantity_received}
                                                onChange={e => handleItemChange(index, 'quantity_received', Number(e.target.value))}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '8px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="number" step="any" 
                                                min="0"
                                                max={item.quantity_received}
                                                value={item.damaged_quantity || 0}
                                                onChange={e => handleItemChange(index, 'damaged_quantity', Number(e.target.value))}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '8px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', color: (item.damaged_quantity > 0) ? '#ef4444' : 'inherit' }}
                                                title="Enter number of items that arrived damaged (will not be pushed to stock)"
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="number" step="any" 
                                                value={item.netRate || 0}
                                                onChange={e => handleItemChange(index, 'netRate', Number(e.target.value))}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '8px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="number" step="any" 
                                                value={item.rate || 0}
                                                onChange={e => handleItemChange(index, 'rate', Number(e.target.value))}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '8px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="number" step="any" 
                                                value={item.discount || 0}
                                                onChange={e => handleItemChange(index, 'discount', Number(e.target.value))}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '8px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '4px' }}>
                                            <input 
                                                type="number" step="any" 
                                                value={item.amount || 0}
                                                onChange={e => handleItemChange(index, 'amount', Number(e.target.value))}
                                                style={{ width: '100%', fontSize: '0.95rem', padding: '8px', textAlign: 'right', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '4px', textAlign: 'center' }}>
                                            {items.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeItemRow(index)}
                                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                                                    title="Remove Item"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create GRN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGRNModal;
