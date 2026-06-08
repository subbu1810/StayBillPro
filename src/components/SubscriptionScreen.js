import React, { useState, useEffect } from 'react';
import { subscriptionAPI, paymentAPI } from '../services/api';
import '../styles/SubscriptionScreen.css';
import { usePopup } from './ui/PopupProvider';
import { getSubscriptionInvoiceHtml } from '../utils/printFormat';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function SubscriptionScreen() {
    const popup = usePopup();
    const [currentPlan, setCurrentPlan] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('Professional (2-Year)');
    const [selectedFeatures, setSelectedFeatures] = useState('both');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [currentData, historyData] = await Promise.all([
                subscriptionAPI.getCurrent(),
                subscriptionAPI.getHistory()
            ]);
            setCurrentPlan(currentData);
            setHistory(historyData);
        } catch (error) {
            console.error('Error fetching subscription data:', error);
            popup.showError('Failed to load subscription details');
        } finally {
            setLoading(false);
        }
    };

    const getPlanPricing = () => {
        let planPricing;
        if (selectedFeatures === 'both') {
            planPricing = {
                'Starter (1-Year)': { monthlyPrice: 800, duration: 12, name: 'Starter' },
                'Professional (2-Year)': { monthlyPrice: 700, duration: 24, name: 'Professional' },
                'Enterprise (3-Year)': { monthlyPrice: 600, duration: 36, name: 'Enterprise' }
            };
        } else {
            planPricing = {
                'Starter (1-Year)': { monthlyPrice: 400, duration: 12, name: 'Starter' },
                'Professional (2-Year)': { monthlyPrice: 350, duration: 24, name: 'Professional' },
                'Enterprise (3-Year)': { monthlyPrice: 300, duration: 36, name: 'Enterprise' }
            };
        }

        const plan = planPricing[selectedPlan];
        if (!plan) return null;

        const subtotal = plan.monthlyPrice * plan.duration;
        const gst = subtotal * 0.18;
        const total = subtotal + gst;

        return { ...plan, subtotal, gst, total };
    };

    const handleUpgrade = async () => {
        const planDetails = getPlanPricing();
        if (!planDetails) return;

        try {
            setIsSubmitting(true);
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                throw new Error('Failed to load Razorpay SDK. Check internet connection.');
            }

            const orderResponse = await paymentAPI.createOrder(planDetails.total);
            if (!orderResponse.success) {
                throw new Error(orderResponse.message || 'Failed to initialize payment.');
            }

            const options = {
                key: orderResponse.key_id,
                amount: orderResponse.amount,
                currency: orderResponse.currency,
                name: "StayBillPro Subscription Upgrade",
                description: `Upgrade to ${planDetails.name} Plan`,
                order_id: orderResponse.order_id,
                handler: async function (response) {
                    try {
                        const adminUserStr = localStorage.getItem('adminUser');
                        const adminUser = JSON.parse(adminUserStr);
                        
                        await subscriptionAPI.verify({
                            admin_id: adminUser.businessId,
                            plan_name: planDetails.name,
                            features: selectedFeatures === 'both' ? 'Both Features' : selectedFeatures === 'billing' ? 'POS Billing' : 'Service Center',
                            amount: planDetails.subtotal,
                            gst_amount: planDetails.gst,
                            total_paid: planDetails.total,
                            transaction_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        popup.showSuccess('Plan upgraded successfully!');
                        setShowPlanModal(false);
                        fetchData();
                    } catch (verifyErr) {
                        popup.showError('Payment verification failed');
                    }
                },
                theme: { color: "#4f46e5" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                popup.showError('Payment failed: ' + response.error.description);
                setIsSubmitting(false);
            });
            rzp.open();

        } catch (error) {
            popup.showError(error.message);
            setIsSubmitting(false);
        }
    };

    const handleDownloadInvoice = (invoice) => {
        try {
            const adminUserStr = localStorage.getItem('adminUser');
            const adminUser = adminUserStr ? JSON.parse(adminUserStr) : {};
            const html = getSubscriptionInvoiceHtml(invoice, adminUser);
            const printWindow = window.open('', 'PRINT', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.onload = function() {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                };
                setTimeout(() => {
                    if (!printWindow.closed) {
                        printWindow.focus();
                        printWindow.print();
                        printWindow.close();
                    }
                }, 2500);
            }
        } catch (error) {
            popup.showError('Failed to generate invoice');
        }
    };

    if (loading) {
        return <div className="loading">Loading subscription details...</div>;
    }

    return (
        <div className="subscription-screen">
            <div className="subscription-header">
                <h2>Subscription Management</h2>
                <p>Manage your billing, invoices, and plan details.</p>
            </div>

            <div className="subscription-content">
                {/* Current Plan Card */}
                <div className="plan-card">
                    <div className="plan-details">
                        <h3>Current Plan</h3>
                        <div className="plan-info-grid">
                            <div className="plan-info-item">
                                <span className="label">Plan Name</span>
                                <span className="value">{currentPlan?.current_plan || 'Free'}</span>
                            </div>
                            <div className="plan-info-item">
                                <span className="label">Features</span>
                                <span className="value">{currentPlan?.features || 'Basic'}</span>
                            </div>
                            <div className="plan-info-item">
                                <span className="label">Status</span>
                                <span className={`value ${currentPlan?.is_active ? 'active' : 'expired'}`}>
                                    {currentPlan?.is_active ? 'Active' : 'Expired/Inactive'}
                                </span>
                            </div>
                            <div className="plan-info-item">
                                <span className="label">Expiry Date</span>
                                <span className="value">
                                    {currentPlan?.subscription_expiry 
                                        ? new Date(currentPlan.subscription_expiry).toLocaleDateString() 
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="plan-actions">
                        <button className="change-plan-btn" onClick={() => setShowPlanModal(true)}>
                            Change Plan
                        </button>
                    </div>
                </div>

                {/* History Table */}
                <div className="invoice-history-section">
                    <h3>Billing History & Invoices</h3>
                    <div className="invoice-table-wrapper">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Plan</th>
                                    <th>Amount Paid</th>
                                    <th>Transaction ID</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length > 0 ? (
                                    history.map((invoice, idx) => (
                                        <tr key={idx}>
                                            <td>{new Date(invoice.start_date).toLocaleDateString()}</td>
                                            <td>{invoice.plan_name}</td>
                                            <td>₹{parseFloat(invoice.total_paid).toFixed(2)}</td>
                                            <td>{invoice.transaction_id || 'N/A'}</td>
                                            <td>
                                                <span className={`status-badge ${invoice.payment_status === 'Success' ? 'success' : 'failed'}`}>
                                                    {invoice.payment_status || 'Success'}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => handleDownloadInvoice(invoice)} title="Download Invoice" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No billing history found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Change Plan Modal */}
            {showPlanModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Change Subscription Plan</h2>
                            <button className="close-btn" onClick={() => setShowPlanModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-field">
                                <label>Features</label>
                                <select 
                                    className="form-input" 
                                    value={selectedFeatures} 
                                    onChange={(e) => setSelectedFeatures(e.target.value)}
                                >
                                    <option value="both">Both Features (Billing + Service Center)</option>
                                    <option value="billing">POS Billing Only</option>
                                    <option value="service">Service Center Only</option>
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Select Plan</label>
                                <select 
                                    className="form-input" 
                                    value={selectedPlan} 
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                >
                                    {selectedFeatures === 'both' ? (
                                        <>
                                            <option value="Starter (1-Year)">Starter (1-Year) - ₹800/mo</option>
                                            <option value="Professional (2-Year)">Professional (2-Year) - ₹700/mo</option>
                                            <option value="Enterprise (3-Year)">Enterprise (3-Year) - ₹600/mo</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Starter (1-Year)">Starter (1-Year) - ₹400/mo</option>
                                            <option value="Professional (2-Year)">Professional (2-Year) - ₹350/mo</option>
                                            <option value="Enterprise (3-Year)">Enterprise (3-Year) - ₹300/mo</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {getPlanPricing() && (
                                <div className="order-summary" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>Subtotal</span>
                                        <span>₹{getPlanPricing().subtotal}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span>GST (18%)</span>
                                        <span>₹{getPlanPricing().gst.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                                        <span>Total</span>
                                        <span>₹{getPlanPricing().total.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpgrade} disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : 'Proceed to Pay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubscriptionScreen;
