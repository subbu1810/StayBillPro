import React, { useState, useEffect } from 'react';
import { purchaseAPI } from '../services/api';
import '../styles/AddItemModal.css';
import { usePopup } from './ui/PopupProvider';

const EditGRNItemModal = ({ isOpen, onClose, onSuccess, item }) => {
    const popup = usePopup();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        product_name: '',
        category_name: '',
        hsn: '',
        gst: 0,
        rate: 0,
        netRate: 0,
        discount: 0,
        amount: 0,
        quantity_received: 1,
        damaged_quantity: 0
    });

    useEffect(() => {
        if (item && isOpen) {
            setFormData({
                product_name: item.item_name || '',
                category_name: item.category_name || '',
                hsn: item.hsn || '',
                gst: item.gst || 0,
                rate: item.rate || 0,
                netRate: item.net_rate || 0,
                discount: item.discount || 0,
                amount: item.amount || 0,
                quantity_received: item.recvd_qty || 1,
                damaged_quantity: item.damaged_qty || 0
            });
        }
    }, [item, isOpen]);

    if (!isOpen || !item) return null;

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.damaged_quantity > formData.quantity_received) {
            popup.showError("Damaged quantity cannot exceed received quantity.");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await purchaseAPI.updateGRNItem(item.grn_item_id, formData);
            if (res.success) {
                popup.showSuccess("GRN item updated successfully.");
                onSuccess();
            }
        } catch (err) {
            popup.showError(err.message || 'Failed to update GRN item.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>Edit GRN Item</h2>
                    <button className="close-btn" onClick={onClose} disabled={isSubmitting}>&times;</button>
                </div>
                
                {item.pushed_to_stock ? (
                    <div style={{ background: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '0.9rem' }}>
                        <strong>Warning:</strong> This item has already been pushed to stock. Changing quantities or prices will automatically sync the difference to your live master stock.
                    </div>
                ) : null}

                <form onSubmit={handleSubmit}>
                    <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div className="input-group" style={{ flex: 2 }}>
                            <label>Product Name *</label>
                            <input type="text" name="product_name" value={formData.product_name} onChange={handleChange} required className="search-input" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Category</label>
                            <input type="text" name="category_name" value={formData.category_name} onChange={handleChange} className="search-input" />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>HSN / SAC</label>
                            <input type="text" name="hsn" value={formData.hsn} onChange={handleChange} className="search-input" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>GST %</label>
                            <input type="number" name="gst" value={formData.gst} onChange={handleChange} min="0" step="0.01" className="search-input" />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Net Rate (Purch. Price)</label>
                            <input type="number" name="netRate" value={formData.netRate} onChange={handleChange} min="0" step="0.01" className="search-input" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Rate (MRP/Sales)</label>
                            <input type="number" name="rate" value={formData.rate} onChange={handleChange} min="0" step="0.01" className="search-input" />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Qty Received *</label>
                            <input type="number" name="quantity_received" value={formData.quantity_received} onChange={handleChange} required min="1" className="search-input" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Damaged Qty</label>
                            <input type="number" name="damaged_quantity" value={formData.damaged_quantity} onChange={handleChange} min="0" className="search-input" />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label>Total Amount</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} min="0" step="0.01" className="search-input" />
                        </div>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditGRNItemModal;
