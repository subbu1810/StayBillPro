import React, { useState, useRef } from 'react';
import '../styles/AddItemModal.css';
import { usePopup } from './ui/PopupProvider';

const AddItemModal = ({ isOpen, onClose, onSave, categories = [], initialData = null }) => {
    const popup = usePopup();
    const [isProduct, setIsProduct] = useState(initialData ? initialData.type === 'sales' : true);
    const [activeTab, setActiveTab] = useState('pricing');
    const codeRef = useRef(null);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        hsn: initialData?.hsn_code || '',
        unit: initialData?.unit && initialData.unit !== 'None' ? initialData.unit : '',
        category: initialData?.category_name || initialData?.category || '',
        code: initialData?.sku || initialData?.part_number || '',
        salePrice: initialData?.price || '',
        salePriceTax: 'Without Tax',
        discount: '',
        discountType: 'Percentage',
        purchasePrice: initialData?.purchase_price || '',
        purchasePriceTax: 'Without Tax',
        taxRate: initialData?.gst_rate ? `GST @ ${initialData.gst_rate}%` : 'None',
        openingStock: initialData?.quantity ?? '',
        lowStockWarning: initialData?.low_stock_warning || 5,
        image: initialData?.image || null,
        wholesalePrice: initialData?.wholesale_price || '',
        wholesaleTax: 'Without Tax',
        minWholesaleQty: initialData?.min_wholesale_qty || '',
        atPrice: initialData?.at_price || '',
        asOfDate: initialData?.as_of_date || new Date().toISOString().split('T')[0],
        location: initialData?.location || '',
        dimensions: initialData?.dimensions || '',
        size: initialData?.size || '',
        serial_number: initialData?.serial_number || '',
        status: initialData?.status || 'available',
        hasExpiry: !!initialData?.expiry_date,
        expiryDate: initialData?.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : ''
    });
    const [showWholesale, setShowWholesale] = useState(!!initialData?.wholesale_price);
    const [imagePreview, setImagePreview] = useState(initialData?.image || null);
    const [unitsList, setUnitsList] = useState([]);
    const [showAddUnit, setShowAddUnit] = useState(false);
    const [newUnit, setNewUnit] = useState('');
    const fileInputRef = React.useRef(null);

        // Update form when initialData changes (e.g. when opening for edit)
    React.useEffect(() => {
        if (initialData) {
            setIsProduct(initialData.type === 'sales');
            setFormData({
                name: initialData.name || '',
                hsn: initialData.hsn_code || '',
                unit: initialData.unit && initialData.unit !== 'None' ? initialData.unit : '',
                category: initialData.category_name || initialData.category || '',
                code: initialData.sku || initialData.part_number || '',
                salePrice: initialData.price || '',
                salePriceTax: 'Without Tax',
                discount: '',
                discountType: 'Percentage',
                purchasePrice: initialData.purchase_price || '',
                purchasePriceTax: 'Without Tax',
                taxRate: initialData.gst_rate ? `GST@${parseFloat(initialData.gst_rate)}%` : 'None',
                openingStock: initialData.quantity ?? '',
                lowStockWarning: initialData.low_stock_warning || 5,
                image: initialData.image || null,
                wholesalePrice: initialData.wholesale_price || '',
                wholesaleTax: 'Without Tax',
                minWholesaleQty: initialData.min_wholesale_qty || '',
                atPrice: initialData.at_price || '',
                asOfDate: initialData.as_of_date || new Date().toISOString().split('T')[0],
                location: initialData.location || '',
                dimensions: initialData.dimensions || '',
                size: initialData.size || '',
                serial_number: initialData.serial_number || '',
                status: initialData.status || 'available',
                hasExpiry: !!initialData.expiry_date,
                expiryDate: initialData.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : ''
            });
            setShowWholesale(!!initialData.wholesale_price);
            setImagePreview(initialData.image || null);
        } else {
            // Reset for new item
            setIsProduct(true);
            setFormData({
                name: '',
                hsn: '',
                unit: '',
                category: '',
                code: '',
                salePrice: '',
                salePriceTax: 'Without Tax',
                discount: '',
                discountType: 'Percentage',
                purchasePrice: '',
                purchasePriceTax: 'Without Tax',
                taxRate: 'None',
                openingStock: '',
                lowStockWarning: 5,
                dimensions: '',
                size: '',
                serial_number: '',
                status: 'available',
                hasExpiry: false,
                expiryDate: ''
            });
        }
    }, [initialData, isOpen]);

    React.useEffect(() => {
        const fetchUnits = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('https://staybillproapi.ssquareg.tech/api/units', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const fetchedUnits = data.map(u => u.name);
                        const merged = [...new Set(fetchedUnits)].sort();
                        setUnitsList(merged);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch units", err);
            }
        };
        fetchUnits();
    }, []);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddUnit = async () => {
        if (newUnit.trim()) {
            const upperUnit = newUnit.trim().toUpperCase();
            if (!unitsList.includes(upperUnit)) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('https://staybillproapi.ssquareg.tech/api/units', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ name: upperUnit })
                    });
                    if (response.ok) {
                        setUnitsList(prev => [...prev, upperUnit].sort());
                    } else {
                        console.error("Failed to save unit to backend");
                    }
                } catch (err) {
                    console.error("Error saving unit", err);
                }
            }
            setFormData(prev => ({ ...prev, unit: upperUnit }));
            setNewUnit('');
            setShowAddUnit(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

        if (name === 'category') {
            const selectedCat = categories.find(c => c.name === value);
            if (selectedCat && selectedCat.type) {
                if (selectedCat.type === 'sales') {
                    setIsProduct(true);
                } else if (selectedCat.type === 'service') {
                    setIsProduct(false);
                }
            }
        }
    };

    const generateUniqueCode = () => {
        const timestamp = Date.now().toString().slice(-8);
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const code = timestamp + randomPart; // Total 12 digits
        setFormData(prev => ({ ...prev, code }));
    };

    const handleSave = () => {
        if (!formData.name) {
            popup.showError('Please enter Item Name');
            return;
        }
        if (!formData.hsn) {
            popup.showError('Please enter HSN Code');
            return;
        }
        if (!formData.unit || formData.unit === 'None') {
            popup.showError('Please select a Unit');
            return;
        }
        if (!formData.category) {
            popup.showError('Please select a Category');
            return;
        }
        if (!formData.code) {
            popup.showError('Please enter Item Code');
            return;
        }

        const parsedGstRate = formData.taxRate === 'None' || formData.taxRate === 'Exempt' ? 0 : parseInt(formData.taxRate.match(/\d+/)?.[0] || 0);

        // Map local state to the schema expected by the API
        const payload = {
            name: formData.name,
            hsn_code: formData.hsn,
            unit: formData.unit,
            category: formData.category,
            part_number: formData.code, // or sku
            price: parseFloat(formData.salePrice) || 0,
            purchase_price: parseFloat(formData.purchasePrice) || 0,
            wholesale_price: showWholesale ? (parseFloat(formData.wholesalePrice) || 0) : null,
            min_wholesale_qty: showWholesale ? (parseInt(formData.minWholesaleQty) || 0) : null,
            gst_rate: parsedGstRate,
            quantity: parseInt(formData.openingStock) || 0,
            at_price: parseFloat(formData.atPrice) || 0,
            as_of_date: formData.asOfDate,
            location: formData.location,
            low_stock_warning: parseInt(formData.lowStockWarning) || 5,
            type: isProduct ? 'sales' : 'service',
            dimensions: formData.dimensions,
            size: formData.size,
            serial_number: formData.serial_number,
            status: formData.status,
            expiry_date: formData.hasExpiry && formData.expiryDate ? formData.expiryDate : null
        };
        onSave(payload);
    };

    return (
        <div className="add-item-overlay">
            <div className="add-item-modal">
                {/* Header */}
                <div className="modal-header">
                    <div className="header-left">
                        <h2>{initialData ? 'Edit Item' : 'Add Item'}</h2>
                        <div className="type-toggle">
                            <span>Product</span>
                            <div 
                                className={`toggle-switch ${!isProduct ? 'service' : ''}`} 
                                onClick={() => setIsProduct(!isProduct)}
                                title={isProduct ? "Switch to Service" : "Switch to Product"}
                            >
                                <div className="toggle-knob"></div>
                            </div>
                            <span>Service</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="icon-btn" title="Settings">⚙️</button>
                        <button className="icon-btn close-btn" onClick={onClose} title="Close">×</button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="modal-body">
                    {/* Top Inputs Grid */}
                    <div className="input-grid">
                        <div className="input-group">
                            <input 
                                type="text" 
                                name="name"
                                placeholder={isProduct ? "Item Name *" : "Service Name *"}
                                value={formData.name}
                                onChange={handleInputChange}
                                required 
                            />
                        </div>
                        <div className="input-group search-group">
                            <input 
                                type="text" 
                                name="hsn"
                                placeholder={isProduct ? "Item HSN *" : "Service HSN *"}
                                value={formData.hsn}
                                onChange={handleInputChange}
                            />
                            <span className="search-icon">🔍</span>
                        </div>
                        <div className="input-group" style={{ flexDirection: 'row', gap: '4px', maxWidth: '160px' }}>
                            {!showAddUnit ? (
                                <>
                                    <div className="unit-group" style={{ flex: 1 }}>
                                        <select 
                                            name="unit" 
                                            value={formData.unit} 
                                            onChange={handleInputChange}
                                            className="select-unit-dropdown"
                                            style={{ width: '100%', padding: '8px' }}
                                        >
                                            <option value="" disabled>Select Unit *</option>
                                            {unitsList.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddUnit(true)}
                                        style={{ padding: '0 10px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        title="Add Custom Unit"
                                    >
                                        +
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input 
                                        type="text" 
                                        placeholder="New Unit"
                                        value={newUnit}
                                        onChange={(e) => setNewUnit(e.target.value)}
                                        style={{ flex: 1 }}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddUnit();
                                            }
                                        }}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddUnit}
                                        style={{ padding: '0 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        ✓
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => { setShowAddUnit(false); setNewUnit(''); }}
                                        style={{ padding: '0 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*" 
                            onChange={handleImageChange}
                        />
                        <div className="add-image" onClick={triggerFileInput}>
                            {imagePreview ? (
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} 
                                />
                            ) : (
                                <span className="image-icon">📷</span>
                            )}
                            <span>{imagePreview ? 'Change Image' : 'Add Item Image'}</span>
                        </div>
                    </div>

                    <div className="input-grid">
                        <div className="input-group" style={{ flex: 2 }}>
                            <select 
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                style={{ width: '100%' }}
                            >
                                <option value="" disabled>Select Category *</option>
                                {categories.map(cat => (
                                    <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group code-group" style={{ flex: 1 }}>
                            <input 
                                ref={codeRef}
                                type="text" 
                                name="code"
                                placeholder={isProduct ? "Item Code *" : "Service Code *"}
                                value={formData.code}
                                onChange={handleInputChange}
                            />
                            {!formData.code && (
                                <div className="code-actions">
                                    <button 
                                        type="button"
                                        className="assign-code-btn" 
                                        onClick={generateUniqueCode}
                                    >
                                        Assign Code
                                    </button>
                                    <button 
                                        type="button"
                                        className="assign-code-btn scan-btn" 
                                        onClick={() => codeRef.current?.focus()}
                                        title="Click here, then use your barcode scanner"
                                    >
                                        📷 Scan
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="input-grid">
                        <div className="input-group" style={{ flex: 1 }}>
                            <input 
                                type="text" 
                                name="serial_number"
                                placeholder={isProduct ? "Serial Number / IMEI" : "Serial Number"}
                                value={formData.serial_number || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <input 
                                type="text" 
                                name="dimensions"
                                placeholder="Dimensions (e.g. 10x10x10)"
                                value={formData.dimensions}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                            <input 
                                type="text" 
                                name="size"
                                placeholder="Size (e.g. 9, XL, 42)"
                                value={formData.size || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="tabs">
                        <button 
                            className={`tab ${activeTab === 'pricing' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pricing')}
                        >
                            Pricing
                        </button>
                        {isProduct && (
                            <button 
                                className={`tab ${activeTab === 'stock' ? 'active' : ''}`}
                                onClick={() => setActiveTab('stock')}
                            >
                                Stock
                            </button>
                        )}
                    </div>

                    {/* Tab Panels */}
                    <div className="tab-panel">
                        {activeTab === 'pricing' && (
                            <div className="pricing-content">
                                <div className="pricing-row">
                                    <div className="section sale-price">
                                        <h4>Sale Price</h4>
                                        <div className="row">
                                            <div className="input-group" style={{ width: '100%' }}>
                                                <input 
                                                    type="number" 
                                                    name="salePrice"
                                                    placeholder="Sale Price" 
                                                    value={formData.salePrice}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        {!showWholesale ? (
                                            <button className="link-btn" onClick={() => setShowWholesale(true)}>+ Add Wholesale Price</button>
                                        ) : (
                                            <div className="wholesale-section">
                                                <div className="section-header">
                                                    <h4>Wholesale Price</h4>
                                                    <button type="button" className="wholesale-remove-btn" onClick={() => setShowWholesale(false)}>⊖ Remove</button>
                                                </div>
                                                <div className="row">
                                                    <div className="input-group" style={{ width: '100%' }}>
                                                        <input 
                                                            type="number" 
                                                            name="wholesalePrice"
                                                            placeholder="Wholesale Price" 
                                                            value={formData.wholesalePrice}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                    <div className="input-group">
                                                        <input 
                                                            type="number" 
                                                            name="minWholesaleQty"
                                                            placeholder="Minimum Wholesale Qty" 
                                                            value={formData.minWholesaleQty}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {isProduct && (
                                    <div className="pricing-row">
                                        <div className="section purchase-price">
                                            <h4>Purchase Price</h4>
                                            <div className="input-group" style={{ width: '100%' }}>
                                                <input 
                                                    type="number" 
                                                    name="purchasePrice"
                                                    placeholder="Purchase Price" 
                                                    value={formData.purchasePrice}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="section taxes">
                                            <h4>Taxes</h4>
                                            <div className="input-group">
                                                <label style={{fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px'}}>Tax Rate</label>
                                                <select 
                                                    name="taxRate"
                                                    value={formData.taxRate}
                                                    onChange={handleInputChange}
                                                >
                                                    {['None', 'IGST@0%', 'GST@0%', 'IGST@0.25%', 'GST@0.25%', 'IGST@3%', 'GST@3%', 'IGST@5%', 'GST@5%', 'IGST@12%', 'GST@12%', 'IGST@18%', 'GST@18%', 'IGST@28%', 'GST@28%', 'IGST@40%', 'GST@40%', 'Exempt'].map(rate => (
                                                        <option key={rate} value={rate}>{rate}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!isProduct && (
                                    <div className="pricing-row">
                                        <div className="section taxes">
                                            <h4>Taxes</h4>
                                            <div className="input-group">
                                                <label style={{fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px'}}>Tax Rate</label>
                                                <select 
                                                    name="taxRate"
                                                    value={formData.taxRate}
                                                    onChange={handleInputChange}
                                                >
                                                    {['None', 'IGST@0%', 'GST@0%', 'IGST@0.25%', 'GST@0.25%', 'IGST@3%', 'GST@3%', 'IGST@5%', 'GST@5%', 'IGST@12%', 'GST@12%', 'IGST@18%', 'GST@18%', 'IGST@28%', 'GST@28%', 'IGST@40%', 'GST@40%', 'Exempt'].map(rate => (
                                                        <option key={rate} value={rate}>{rate}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'stock' && (
                            <div className="stock-content">
                                <div className="pricing-row">
                                    <div className="section no-bg">
                                        <div className="input-grid-3">
                                            <div className="input-group">
                                                <input 
                                                    type="number" 
                                                    name="openingStock"
                                                    placeholder="Opening Quantity" 
                                                    value={formData.openingStock}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <input 
                                                    type="number" 
                                                    name="atPrice"
                                                    placeholder="At Price" 
                                                    value={formData.atPrice}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="input-group date-input-group">
                                                <label className="floating-label">As Of Date</label>
                                                <input 
                                                    type="date" 
                                                    name="asOfDate"
                                                    value={formData.asOfDate}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="input-grid-3" style={{marginTop: '20px'}}>
                                            <div className="input-group">
                                                <input 
                                                    type="number" 
                                                    name="lowStockWarning"
                                                    placeholder="Min Stock To Maintain" 
                                                    value={formData.lowStockWarning}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <input 
                                                    type="text" 
                                                    name="location"
                                                    placeholder="Location" 
                                                    value={formData.location}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <select 
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="available">Available</option>
                                                    <option value="unavailable">Unavailable</option>
                                                    <option value="out_of_stock">Out of Stock</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="input-grid" style={{marginTop: '20px', alignItems: 'center'}}>
                                            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    name="hasExpiry"
                                                    checked={formData.hasExpiry}
                                                    onChange={handleInputChange}
                                                    id="hasExpiryCheck"
                                                    style={{ width: 'auto' }}
                                                />
                                                <label htmlFor="hasExpiryCheck" style={{ fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>Item has an Expiry Date</label>
                                            </div>
                                            {formData.hasExpiry && (
                                                <div className="input-group date-input-group">
                                                    <label className="floating-label">Expiry Date</label>
                                                    <input 
                                                        type="date" 
                                                        name="expiryDate"
                                                        value={formData.expiryDate}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="modal-footer">
                    <button className="save-new-btn" onClick={handleSave}>Save & New</button>
                    <button className="save-btn" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default AddItemModal;
