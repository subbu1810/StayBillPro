import React from 'react';
import '../styles/PurchaseScreen.css';

const PurchaseScreen = ({ defaultTab = 'po' }) => {
    const renderPurchaseOrders = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <input type="text" placeholder="Search PO # / Vendor..." className="search-input" />
                <button className="btn-primary">+ Create New PO</button>
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
                    <tr>
                        <td>18-Apr-26</td>
                        <td style={{ fontWeight: '800' }}>PO-5001</td>
                        <td>Samsung India Wholesales</td>
                        <td>25-Apr-26</td>
                        <td>₹12,50,000</td>
                        <td><span className="status-pill warning">Pending</span></td>
                        <td><button className="btn-icon">👁️</button><button className="btn-icon">🖨️</button></td>
                    </tr>
                    <tr>
                        <td>15-Apr-26</td>
                        <td style={{ fontWeight: '800' }}>PO-5002</td>
                        <td>Logitech Distro Pvt Ltd</td>
                        <td>18-Apr-26</td>
                        <td>₹85,000</td>
                        <td><span className="status-pill success">Received</span></td>
                        <td><button className="btn-icon">👁️</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    const renderGRN = () => (
        <div className="crm-content">
            <div className="crm-filters">
                <button className="btn-primary">+ New Goods Receipt (GRN)</button>
            </div>
            <table className="crm-table single-line-table">
                <thead>
                    <tr>
                        <th>GRN Date</th>
                        <th>GRN #</th>
                        <th>Linked PO</th>
                        <th>Supplier</th>
                        <th>Warehouse</th>
                        <th>SKU Count</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>18-Apr-26</td>
                        <td style={{ fontWeight: '800' }}>GRN-801</td>
                        <td>PO-5002</td>
                        <td>Logitech Distro</td>
                        <td>Main Warehouse</td>
                        <td>12 Items</td>
                        <td><span className="status-pill success">Stocked</span></td>
                    </tr>
                </tbody>
            </table>
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
        </div>
    );
};

export default PurchaseScreen;
