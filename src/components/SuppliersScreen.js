import React, { useState, useEffect } from 'react';
import '../styles/SuppliersScreen.css';
import { usePopup } from './ui/PopupProvider';

export default function SuppliersScreen({ defaultTab }) {
    const popup = usePopup();
    const [viewMode, setViewMode] = useState(defaultTab || 'manage');
    const [search, setSearch] = useState('');
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    }, []);

    // Sync with Sidebar
    useEffect(() => {
        if (defaultTab) setViewMode(defaultTab);
    }, [defaultTab]);

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
                    <div className="crm-filters" style={{ marginBottom: '12px' }}>
                        <select style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '280px', fontSize: '0.85rem' }}>
                            <option>Select Vendor: Samsung India Electronics</option>
                            <option>Apex Spare Parts</option>
                        </select>
                    </div>
                    <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                        <div className="summary-card" style={{ borderLeft: '3px solid #14b8a6' }}>
                            <h3>Total Purchase</h3>
                            <p className="big-number" style={{ fontSize: '1.1rem' }}>₹4,85,000</p>
                        </div>
                        <div className="summary-card" style={{ borderLeft: '3px solid #10b981' }}>
                            <h3>Total Paid</h3>
                            <p className="big-number" style={{ fontSize: '1.1rem' }}>₹5,30,000</p>
                        </div>
                        <div className="summary-card" style={{ borderLeft: '3px solid #f59e0b' }}>
                            <h3>Total Returns</h3>
                            <p className="big-number" style={{ fontSize: '1.1rem' }}>₹0.00</p>
                        </div>
                        <div className="summary-card" style={{ borderLeft: '3px solid #10b981' }}>
                            <h3>Net Advance</h3>
                            <p className="big-number" style={{ fontSize: '1.1rem', color: '#10b981' }}>₹45,000</p>
                        </div>
                    </div>
                    <table className="crm-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Ref No</th>
                                <th>Purchases (Dr)</th>
                                <th>Payments (Cr)</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2025-01-05</td>
                                <td>Opening Bal</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>₹0</td>
                            </tr>
                            <tr>
                                <td>2025-01-10</td>
                                <td>Purchase</td>
                                <td>PUR-8812</td>
                                <td>₹4,85,000</td>
                                <td>-</td>
                                <td>₹4,85,000 Dr</td>
                            </tr>
                            <tr>
                                <td>2025-01-10</td>
                                <td>Payment</td>
                                <td>BANK-991</td>
                                <td>-</td>
                                <td>₹5,30,000</td>
                                <td>₹45,000 Cr (Adv)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {viewMode === 'payables' && (
                <div className="crm-content">
                    <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                        <div className="summary-card" style={{ background: '#fff1f2', borderLeft: '3px solid #e11d48' }}>
                            <h3 style={{ fontSize: '0.65rem' }}>Total Payables</h3>
                            <p className="big-number" style={{ fontSize: '1.3rem', color: '#e11d48' }}>₹1,12,400</p>
                        </div>
                        <div className="summary-card">
                            <h3 style={{ fontSize: '0.65rem' }}>Due this week</h3>
                            <p className="big-number" style={{ fontSize: '1.3rem' }}>₹48,500</p>
                        </div>
                        <div className="summary-card">
                            <h3 style={{ fontSize: '0.65rem' }}>Total Creditors</h3>
                            <p className="big-number" style={{ fontSize: '1.3rem' }}>4 Vendors</p>
                        </div>
                    </div>
                    <table className="crm-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Last Purchase</th>
                                <th>Credit Period</th>
                                <th>Outstanding</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: '700' }}>Apex Spare Parts</td>
                                <td>2025-01-12</td>
                                <td>15 Days</td>
                                <td style={{ fontWeight: '800', color: '#ef4444' }}>₹12,400</td>
                                <td><span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 'bold' }}>● OVERDUE</span></td>
                                <td><button className="btn-small-crimson">Pay Now</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {['payments', 'advance', 'purchases', 'returns', 'po', 'performance'].includes(viewMode) && (
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
        </div>
    );
}
