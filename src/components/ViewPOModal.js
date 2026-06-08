import React, { useState, useEffect } from 'react';
import { purchaseAPI } from '../services/api';

const ViewPOModal = ({ isOpen, onClose, poId }) => {
    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && poId) {
            fetchPODetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, poId]);

    const fetchPODetails = async () => {
        try {
            setLoading(true);
            const res = await purchaseAPI.getOrder(poId);
            if (res.success) {
                setPo(res.purchaseOrder);
            } else {
                setError(res.message || "Failed to fetch PO details");
            }
        } catch (err) {
            console.error("Error fetching PO:", err);
            setError("Error fetching PO details");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <div className="po-modal-overlay">
            <style>{`
                .po-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .po-modal-container {
                    background: #fff;
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    overflow: hidden;
                }
                .po-modal-header {
                    padding: 15px 20px;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .po-modal-body {
                    padding: 20px;
                    overflow-y: auto;
                    flex: 1;
                }
                .po-modal-footer {
                    padding: 15px 20px;
                    border-top: 1px solid #ddd;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                .btn-print {
                    background: #20b2aa;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .btn-close {
                    background: #f1f1f1;
                    border: 1px solid #ccc;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                /* Printable Area Styles based on user screenshot */
                .printable-area {
                    font-family: Arial, sans-serif;
                    color: #333;
                    font-size: 13px;
                }
                .po-header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: stretch;
                    margin-bottom: 20px;
                }
                .po-logo-area {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 24px;
                    color: #666;
                }
                .po-logo-box {
                    width: 40px;
                    height: 40px;
                    background: #666;
                }
                .po-title-area {
                    background: linear-gradient(to right, #40e0d0, #20b2aa);
                    color: white;
                    padding: 15px 30px;
                    font-size: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    flex: 1;
                    margin-left: 20px;
                    clip-path: polygon(20px 0, 100% 0, 100% 100%, 0 100%);
                }
                .po-meta-info {
                    text-align: right;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }
                .po-addresses {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .po-address-box {
                    flex: 1;
                }
                .po-address-header {
                    background: #66cdaa;
                    color: white;
                    padding: 5px 15px;
                    font-weight: bold;
                    border-radius: 15px;
                    display: inline-block;
                    margin-bottom: -10px;
                    position: relative;
                    z-index: 1;
                }
                .po-address-content {
                    border: 1px solid #66cdaa;
                    padding: 20px 15px 15px;
                    min-height: 100px;
                    line-height: 1.6;
                }
                .po-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .po-table th, .po-table td {
                    border: 1px solid #66cdaa;
                    padding: 8px;
                    text-align: center;
                }
                .po-table th {
                    background: #e0f7fa;
                    color: #008080;
                    font-weight: bold;
                }
                .po-main-table th {
                    background: #e0f7fa;
                }
                .po-main-table td {
                    height: 30px;
                }
                .po-bottom-section {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 40px;
                }
                .po-notes {
                    flex: 2;
                }
                .po-notes-header {
                    background: #e0f7fa;
                    color: #008080;
                    padding: 5px;
                    text-align: center;
                    border: 1px solid #66cdaa;
                    border-bottom: none;
                    font-weight: bold;
                }
                .po-notes-content {
                    border: 1px solid #66cdaa;
                    padding: 10px;
                    height: 80px;
                }
                .po-totals {
                    flex: 1;
                }
                .po-totals-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .po-totals-table td {
                    border: 1px solid #66cdaa;
                    padding: 5px 10px;
                }
                .po-totals-table td:first-child {
                    text-align: right;
                }
                .po-signature {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 50px;
                }
                .po-sign-line {
                    border-top: 1px solid #333;
                    width: 250px;
                    text-align: center;
                    padding-top: 5px;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 20px;
                        margin: 0;
                    }
                    .po-modal-overlay {
                        background: none;
                        padding: 0;
                    }
                    .po-modal-container {
                        box-shadow: none;
                        border: none;
                        max-width: 100%;
                    }
                    .po-modal-header, .po-modal-footer {
                        display: none;
                    }
                }
            `}</style>

            <div className="po-modal-container">
                <div className="po-modal-header">
                    <h2>View Purchase Order</h2>
                    <button className="close-btn" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>

                <div className="po-modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
                    ) : error ? (
                        <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>{error}</div>
                    ) : po ? (
                        <div className="printable-area">
                            {/* Header */}
                            <div className="po-header-section">
                                <div className="po-logo-area">
                                    <div className="po-logo-box"></div>
                                    <span>Company Logo</span>
                                </div>
                                <div className="po-title-area">
                                    Purchase Order 🛒
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="po-meta-info">
                                <div><strong>Date:</strong> {new Date(po.order_date).toLocaleDateString()}</div>
                                <div><strong>P.O.Number:</strong> {po.po_number}</div>
                                <div><strong>Branch ID:</strong> {po.branch_id}</div>
                            </div>

                            {/* Addresses */}
                            <div className="po-addresses">
                                <div className="po-address-box">
                                    <div className="po-address-header">VENDOR</div>
                                    <div className="po-address-content">
                                        <div><strong>Name:</strong> {po.supplier_details?.supplier_name || po.supplier_name}</div>
                                        {po.supplier_details?.contact_person && <div><strong>Contact:</strong> {po.supplier_details.contact_person}</div>}
                                        {po.supplier_details?.address_line1 && <div><strong>Address:</strong> {po.supplier_details.address_line1}{po.supplier_details.city ? `, ${po.supplier_details.city}` : ''}</div>}
                                        {po.supplier_details?.mobile && <div><strong>Phone:</strong> {po.supplier_details.mobile}</div>}
                                        {po.supplier_details?.email && <div><strong>Email:</strong> {po.supplier_details.email}</div>}
                                    </div>
                                </div>
                                <div className="po-address-box">
                                    <div className="po-address-header">SHIP TO</div>
                                    <div className="po-address-content">
                                        <div><strong>Name:</strong> {po.branch_details?.name || `Branch ID: ${po.branch_id}`}</div>
                                        {po.branch_details?.address && <div><strong>Address:</strong> {po.branch_details.address}{po.branch_details.city ? `, ${po.branch_details.city}` : ''}</div>}
                                        {po.branch_details?.phone && <div><strong>Phone:</strong> {po.branch_details.phone}</div>}
                                        {po.branch_details?.email && <div><strong>Email:</strong> {po.branch_details.email}</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Details */}
                            <table className="po-table">
                                <thead>
                                    <tr>
                                        <th>Shipping Method</th>
                                        <th>Shipping Terms</th>
                                        <th>Expected Delivery Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Standard</td>
                                        <td>As per agreement</td>
                                        <td>{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Main Items Table */}
                            <table className="po-table po-main-table">
                                <thead>
                                    <tr>
                                        <th style={{width: '40%'}}>Product Name/Description</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {po.items && po.items.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{textAlign: 'left'}}>{item.product_name}</td>
                                            <td>{item.quantity}</td>
                                            <td>₹{Number(item.unit_price).toLocaleString()}</td>
                                            <td>₹{Number(item.total_price).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {/* Empty rows for padding if needed, optional */}
                                    {[...Array(Math.max(0, 5 - (po.items?.length || 0)))].map((_, i) => (
                                        <tr key={`empty-${i}`}>
                                            <td></td><td></td><td></td><td></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Bottom Section */}
                            <div className="po-bottom-section">
                                <div className="po-notes">
                                    <div className="po-notes-header">Notes and Instructions</div>
                                    <div className="po-notes-content">
                                        All items must meet quality standards.
                                    </div>
                                </div>
                                <div className="po-totals">
                                    <table className="po-totals-table">
                                        <tbody>
                                            <tr>
                                                <td>Total Excl Tax</td>
                                                <td>₹{Number(po.total_amount).toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Discount</td>
                                                <td>₹0</td>
                                            </tr>
                                            <tr>
                                                <td>Tax/VAT</td>
                                                <td>₹0</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Subtotal</strong></td>
                                                <td><strong>₹{Number(po.total_amount).toLocaleString()}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Signature */}
                            <div className="po-signature">
                                <div>Date: __________________</div>
                                <div className="po-sign-line">Authorised Signature</div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="po-modal-footer">
                    <button className="btn-close" onClick={onClose}>Close</button>
                    <button className="btn-print" onClick={handlePrint} disabled={loading || error}>Print PO</button>
                </div>
            </div>
        </div>
    );
};

export default ViewPOModal;
