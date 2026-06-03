import React, { useState } from 'react';
import '../styles/AddItemModal.css';

const AddItemModal = ({ isOpen, onClose, onSave, categories = [], initialData = null }) => {
    const [isProduct, setIsProduct] = useState(initialData ? initialData.type === 'sales' : true);
    const [activeTab, setActiveTab] = useState('pricing');
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        hsn: initialData?.hsn_code || '',
        unit: initialData?.unit || 'None',
        category: initialData?.category_name || initialData?.category || '',
        code: initialData?.sku || initialData?.part_number || '',
        salePrice: initialData?.price || '',
        salePriceTax: 'Without Tax',
        discount: '',
        discountType: 'Percentage',
        purchasePrice: initialData?.purchase_price || '',
        purchasePriceTax: 'Without Tax',
        taxRate: initialData?.gst_rate ? `GST @ ${initialData.gst_rate}%` : 'None',
        openingStock: initialData?.quantity || 0,
        lowStockWarning: initialData?.low_stock_warning || 5,
        image: initialData?.image || null,
        wholesalePrice: initialData?.wholesale_price || '',
        wholesaleTax: 'Without Tax',
        minWholesaleQty: initialData?.min_wholesale_qty || '',
        atPrice: initialData?.at_price || '',
        asOfDate: initialData?.as_of_date || new Date().toISOString().split('T')[0],
        location: initialData?.location || ''
    });
    const [showWholesale, setShowWholesale] = useState(!!initialData?.wholesale_price);
    const [imagePreview, setImagePreview] = useState(initialData?.image || null);
    const fileInputRef = React.useRef(null);

    // Update form when initialData changes (e.g. when opening for edit)
    React.useEffect(() => {
        if (initialData) {
            setIsProduct(initialData.type === 'sales');
            setFormData({
                name: initialData.name || '',
                hsn: initialData.hsn_code || '',
                unit: initialData.unit || 'None',
                category: initialData.category_name || initialData.category || '',
                code: initialData.sku || initialData.part_number || '',
                salePrice: initialData.price || '',
                salePriceTax: 'Without Tax',
                discount: '',
                discountType: 'Percentage',
                purchasePrice: initialData.purchase_price || '',
                purchasePriceTax: 'Without Tax',
                taxRate: initialData.gst_rate ? `GST @ ${initialData.gst_rate}%` : 'None',
                openingStock: initialData.quantity || 0,
                lowStockWarning: initialData.low_stock_warning || 5,
                image: initialData.image || null,
                wholesalePrice: initialData.wholesale_price || '',
                wholesaleTax: 'Without Tax',
                minWholesaleQty: initialData.min_wholesale_qty || '',
                atPrice: initialData.at_price || '',
                asOfDate: initialData.as_of_date || new Date().toISOString().split('T')[0],
                location: initialData.location || ''
            });
            setShowWholesale(!!initialData.wholesale_price);
            setImagePreview(initialData.image || null);
        } else {
            // Reset for new item
            setIsProduct(true);
            setFormData({
                name: '',
                hsn: '',
                unit: 'None',
                category: '',
                code: '',
                salePrice: '',
                salePriceTax: 'Without Tax',
                discount: '',
                discountType: 'Percentage',
                purchasePrice: '',
                purchasePriceTax: 'Without Tax',
                taxRate: 'None',
                openingStock: 0,
                lowStockWarning: 5
            });
        }
    }, [initialData, isOpen]);

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

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateUniqueCode = () => {
        const timestamp = Date.now().toString().slice(-8);
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const code = timestamp + randomPart; // Total 12 digits
        setFormData(prev => ({ ...prev, code }));
    };

    const handleSave = () => {
        // Map local state to the schema expected by the API
        const payload = {
            name: formData.name,
            hsn_code: formData.hsn,
            category: formData.category,
            part_number: formData.code, // or sku
            price: parseFloat(formData.salePrice) || 0,
            purchase_price: parseFloat(formData.purchasePrice) || 0,
            wholesale_price: showWholesale ? (parseFloat(formData.wholesalePrice) || 0) : null,
            min_wholesale_qty: showWholesale ? (parseInt(formData.minWholesaleQty) || 0) : null,
            gst_rate: formData.taxRate === 'None' ? 0 : parseInt(formData.taxRate.match(/\d+/)[0]),
            quantity: parseInt(formData.openingStock) || 0,
            at_price: parseFloat(formData.atPrice) || 0,
            as_of_date: formData.asOfDate,
            location: formData.location,
            low_stock_warning: parseInt(formData.lowStockWarning) || 5,
            type: isProduct ? 'sales' : 'service',
            status: 'available'
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
                                placeholder={isProduct ? "Item HSN" : "Service HSN"}
                                value={formData.hsn}
                                onChange={handleInputChange}
                            />
                            <span className="search-icon">🔍</span>
                        </div>
                        <div className="input-group unit-group">
                            <select 
                                name="unit" 
                                value={formData.unit} 
                                onChange={handleInputChange}
                                className="select-unit-dropdown"
                            >
                                <option value="" disabled>Select Unit</option>
                                {['None', 'BAGS (Bag)', 'BOTTLES (Btl)', 'BOX (Box)', 'BUNDLES (Bdl)', 'CANS (Can)', 'CARTONS (Ctn)', 'DOZENS (Dzn)', 'GRAMMES (Gm)', 'KILOGRAMS (Kg)', 'LITRE (Ltr)', 'METERS (Mtr)', 'MILILITRE (Ml)', 'NUMBERS (Nos)', 'PACKS (Pac)', 'PAIRS (Prs)', 'PIECES (Pcs)', 'QUINTAL (Qtl)', 'ROLLS (Rol)', 'SQUARE FEET (Sqf)', 'SQUARE METERS (Sqm)', 'TABLETS (Tbs)'].map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
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
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group code-group" style={{ flex: 1 }}>
                            <input 
                                type="text" 
                                name="code"
                                placeholder={isProduct ? "Item Code" : "Service Code"}
                                value={formData.code}
                                onChange={handleInputChange}
                            />
                            {!formData.code && (
                                <button 
                                    type="button"
                                    className="assign-code-btn" 
                                    onClick={generateUniqueCode}
                                >
                                    Assign Code
                                </button>
                            )}
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
                                            <div className="input-with-select">
                                                <input 
                                                    type="number" 
                                                    name="salePrice"
                                                    placeholder="Sale Price" 
                                                    value={formData.salePrice}
                                                    onChange={handleInputChange}
                                                />
                                                <select 
                                                    name="salePriceTax" 
                                                    value={formData.salePriceTax}
                                                    onChange={handleInputChange}
                                                >
                                                    <option>Without Tax</option>
                                                    <option>With Tax</option>
                                                </select>
                                            </div>
                                            <div className="input-with-select">
                                                <input 
                                                    type="number" 
                                                    name="discount"
                                                    placeholder="Disc. On Sale Price" 
                                                    value={formData.discount}
                                                    onChange={handleInputChange}
                                                />
                                                <select 
                                                    name="discountType"
                                                    value={formData.discountType}
                                                    onChange={handleInputChange}
                                                >
                                                    <option>Percentage</option>
                                                    <option>Amount</option>
                                                </select>
                                            </div>
                                        </div>
                                        {!showWholesale ? (
                                            <button className="link-btn" onClick={() => setShowWholesale(true)}>+ Add Wholesale Price</button>
                                        ) : (
                                            <div className="wholesale-section">
                                                <div className="section-header">
                                                    <h4>Wholesale Price</h4>
                                                    <button className="remove-btn" onClick={() => setShowWholesale(false)}>⊖ Remove</button>
                                                </div>
                                                <div className="row">
                                                    <div className="input-with-select">
                                                        <input 
                                                            type="number" 
                                                            name="wholesalePrice"
                                                            placeholder="Wholesale Price" 
                                                            value={formData.wholesalePrice}
                                                            onChange={handleInputChange}
                                                        />
                                                        <select 
                                                            name="wholesaleTax" 
                                                            value={formData.wholesaleTax}
                                                            onChange={handleInputChange}
                                                        >
                                                            <option>Without Tax</option>
                                                            <option>With Tax</option>
                                                        </select>
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
                                            <div className="input-with-select">
                                                <input 
                                                    type="number" 
                                                    name="purchasePrice"
                                                    placeholder="Purchase Price" 
                                                    value={formData.purchasePrice}
                                                    onChange={handleInputChange}
                                                />
                                                <select 
                                                    name="purchasePriceTax"
                                                    value={formData.purchasePriceTax}
                                                    onChange={handleInputChange}
                                                >
                                                    <option>Without Tax</option>
                                                    <option>With Tax</option>
                                                </select>
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
