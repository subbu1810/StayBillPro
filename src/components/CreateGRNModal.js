import React, { useState, useEffect } from 'react';
import { purchaseAPI, branchesAPI } from '../services/api';
import '../styles/AddItemModal.css';

const CreateGRNModal = ({ isOpen, onClose, onSuccess }) => {
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
        { product_name: '', quantity_received: 1 }
    ]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [branchesData, poData] = await Promise.all([
                branchesAPI.getAll(),
                purchaseAPI.getOrders()
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
                        quantity_received: item.quantity // default to ordered quantity
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
            setItems([{ product_name: '', quantity_received: 1 }]);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItemRow = () => {
        setItems([...items, { product_name: '', quantity_received: 1 }]);
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
            const validItems = items.filter(item => item.product_name.trim() !== '' && item.quantity_received > 0);
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
            setItems([{ product_name: '', quantity_received: 1 }]);
            
            onSuccess();
        } catch (err) {
            setError(err.message || 'Error creating GRN');
        } finally {
            setIsSubmitting(false);
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
                                required
                                value={formData.supplier_name}
                                onChange={e => setFormData({...formData, supplier_name: e.target.value})}
                                className="search-input"
                                placeholder="e.g. Samsung Distro"
                            />
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
                            <button type="button" onClick={addItemRow} className="btn-small success">+ Add Item</button>
                        </div>
                        
                        <table className="crm-table" style={{ marginBottom: '15px' }}>
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th style={{ width: '150px' }}>Quantity Received</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Item name"
                                                className="search-input"
                                                value={item.product_name}
                                                onChange={e => handleItemChange(index, 'product_name', e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                required
                                                min="1"
                                                className="search-input"
                                                value={item.quantity_received}
                                                onChange={e => handleItemChange(index, 'quantity_received', e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td>
                                            {items.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeItemRow(index)}
                                                    style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
