import React, { useState, useEffect } from 'react';
import { purchaseAPI, branchesAPI, suppliersAPI } from '../services/api';
import '../styles/AddItemModal.css'; // Reuse existing modal styles

const CreatePOModal = ({ isOpen, onClose, onSuccess }) => {
    const [branches, setBranches] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [formData, setFormData] = useState({
        branch_id: '',
        supplier_name: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        status: 'Pending'
    });
    
    const [items, setItems] = useState([
        { product_name: '', quantity: 1, unit_price: 0, total_price: 0 }
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
            const [branchesData, suppliersData] = await Promise.all([
                branchesAPI.getAll(),
                suppliersAPI.getAll()
            ]);
            
            setBranches(branchesData);
            if (branchesData.length > 0) {
                setFormData(prev => ({ ...prev, branch_id: branchesData[0].id }));
            }
            
            // Assume the API returns an array, or res.suppliers if paginated
            const supplierList = Array.isArray(suppliersData) ? suppliersData : suppliersData.suppliers || [];
            setSuppliers(supplierList);
        } catch (err) {
            console.error("Error fetching initial data:", err);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        
        if (field === 'quantity' || field === 'unit_price') {
            const qty = Number(newItems[index].quantity) || 0;
            const price = Number(newItems[index].unit_price) || 0;
            newItems[index].total_price = qty * price;
        }
        
        setItems(newItems);
    };

    const addItemRow = () => {
        setItems([...items, { product_name: '', quantity: 1, unit_price: 0, total_price: 0 }]);
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
            const validItems = items.filter(item => item.product_name.trim() !== '' && item.quantity > 0);
            if (validItems.length === 0) {
                throw new Error("Please add at least one valid item to the order.");
            }

            const payload = {
                ...formData,
                items: validItems
            };

            await purchaseAPI.createOrder(payload);
            
            // Reset form
            setFormData({
                branch_id: branches.length > 0 ? branches[0].id : '',
                supplier_name: '',
                order_date: new Date().toISOString().split('T')[0],
                expected_date: ''
            });
            setItems([{ product_name: '', quantity: 1, unit_price: 0, total_price: 0 }]);
            
            onSuccess();
        } catch (err) {
            setError(err.message || 'Error creating Purchase Order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const grandTotal = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '100vw', height: '100vh', maxWidth: '100%', maxHeight: '100%', margin: 0, borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>+ Create New Purchase Order</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
                    
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
                        <div className="input-group" style={{ flex: 1, position: 'relative' }}>
                            <label>Supplier Name *</label>
                            <input 
                                type="text" 
                                required
                                value={formData.supplier_name}
                                onChange={e => {
                                    setFormData({...formData, supplier_name: e.target.value});
                                    setShowSupplierDropdown(true);
                                }}
                                onFocus={() => setShowSupplierDropdown(true)}
                                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 150)}
                                className="search-input"
                                placeholder="Search or enter supplier..."
                            />
                            {showSupplierDropdown && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '100%', 
                                    left: 0, 
                                    right: 0, 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #ccc', 
                                    borderRadius: '4px', 
                                    maxHeight: '200px', 
                                    overflowY: 'auto', 
                                    zIndex: 1000,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}>
                                    {suppliers.filter(s => s.supplier_name.toLowerCase().includes(formData.supplier_name.toLowerCase())).map(s => (
                                        <div 
                                            key={s.id} 
                                            onMouseDown={(e) => {
                                                // Prevent default so the input doesn't lose focus prematurely
                                                e.preventDefault(); 
                                                setFormData({...formData, supplier_name: s.supplier_name});
                                                setShowSupplierDropdown(false);
                                            }}
                                            style={{ 
                                                padding: '10px', 
                                                cursor: 'pointer', 
                                                borderBottom: '1px solid #eee' 
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f4f8'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                                        >
                                            {s.supplier_name}
                                        </div>
                                    ))}
                                    {suppliers.filter(s => s.supplier_name.toLowerCase().includes(formData.supplier_name.toLowerCase())).length === 0 && formData.supplier_name !== '' && (
                                        <div style={{ padding: '10px', color: '#666', fontStyle: 'italic' }}>
                                            Will add "{formData.supplier_name}" as new supplier
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Order Date *</label>
                            <input 
                                type="date" 
                                required
                                value={formData.order_date}
                                onChange={e => setFormData({...formData, order_date: e.target.value})}
                                className="search-input"
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Expected Delivery Date</label>
                            <input 
                                type="date" 
                                value={formData.expected_date}
                                onChange={e => setFormData({...formData, expected_date: e.target.value})}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="items-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Order Items</h3>
                            <button type="button" onClick={addItemRow} className="btn-small success">+ Add Item</button>
                        </div>
                        
                        <table className="crm-table" style={{ marginBottom: '15px' }}>
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th style={{ width: '100px' }}>Quantity</th>
                                    <th style={{ width: '150px' }}>Unit Price (₹)</th>
                                    <th style={{ width: '150px' }}>Total (₹)</th>
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
                                                type="number" step="any" 
                                                required
                                                min="1"
                                                className="search-input"
                                                value={item.quantity}
                                                onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                required
                                                min="0"
                                                step="0.01"
                                                className="search-input"
                                                value={item.unit_price}
                                                onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>
                                            ₹{item.total_price.toFixed(2)}
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
                            <tfoot>
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
                                    <td colSpan="2" style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '1.1rem' }}>
                                        ₹{grandTotal.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePOModal;
