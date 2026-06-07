import React, { useState } from 'react';
import { walletAPI } from '../services/api';

export default function RechargeModal({ onClose, onSuccess }) {
    const [amount, setAmount] = useState(100);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const presetAmounts = [50, 100, 200, 500, 1000];

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

    const handleRecharge = async () => {
        if (!amount || amount < 10) {
            setError("Minimum recharge amount is ₹10.");
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);

            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                throw new Error("Failed to load Razorpay SDK. Check your connection.");
            }

            // 1. Create Order on Backend
            const orderData = await walletAPI.createOrder({ amount });

            if (!orderData.success) {
                throw new Error(orderData.message || "Failed to create order");
            }

            // 2. Open Razorpay Checkout
            const userStr = localStorage.getItem('adminUser');
            const user = userStr ? JSON.parse(userStr) : {};

            const options = {
                key: orderData.key_id, // Dummy key for now
                amount: orderData.amount,
                currency: orderData.currency,
                name: "StayBillPro AI Wallet",
                description: "Recharge Scan Wallet",
                order_id: orderData.order_id,
                handler: async function (response) {
                    try {
                        // 3. Verify Payment
                        const verifyResult = await walletAPI.verifyRecharge({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount_paid: amount
                        });

                        if (verifyResult.success) {
                            onSuccess(verifyResult.newWalletBalance);
                        } else {
                            setError(verifyResult.message || "Payment verification failed.");
                        }
                    } catch (err) {
                        setError("Payment verification error: " + err.message);
                    }
                },
                prefill: {
                    name: user.name || "Admin User",
                    email: user.email || "admin@example.com",
                    contact: user.phone || ""
                },
                theme: {
                    color: "#2563eb"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError(response.error.description);
            });
            rzp.open();

        } catch (err) {
            setError(err.message || "An error occurred during payment setup.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h3 style={titleStyle}>Recharge AI Wallet</h3>
                <p style={subtitleStyle}>Add funds to your wallet to continue using the AI Bill Scanner.</p>
                
                {error && <div style={errorStyle}>⚠️ {error}</div>}

                <div style={presetsContainerStyle}>
                    {presetAmounts.map(val => (
                        <button 
                            key={val}
                            style={amount === val ? activePresetStyle : presetStyle}
                            onClick={() => setAmount(val)}
                            disabled={isProcessing}
                        >
                            ₹{val}
                        </button>
                    ))}
                </div>

                <div style={inputContainerStyle}>
                    <label style={labelStyle}>Custom Amount (₹)</label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(Number(e.target.value))}
                        min="10"
                        style={inputStyle}
                        disabled={isProcessing}
                    />
                </div>

                <div style={actionContainerStyle}>
                    <button style={cancelBtnStyle} onClick={onClose} disabled={isProcessing}>Cancel</button>
                    <button style={payBtnStyle} onClick={handleRecharge} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : `Pay ₹${amount}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Inline Styles
const overlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)'
};

const modalStyle = {
    background: '#ffffff', padding: '24px', borderRadius: '12px',
    width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
};

const titleStyle = { margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.25rem' };
const subtitleStyle = { margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.4' };
const errorStyle = { background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px' };

const presetsContainerStyle = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' };

const presetStyle = {
    background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569',
    padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: '500', flex: '1 1 auto'
};

const activePresetStyle = {
    ...presetStyle,
    background: '#eff6ff', border: '1px solid #3b82f6', color: '#2563eb'
};

const inputContainerStyle = { marginBottom: '24px' };
const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '6px', fontWeight: '500' };
const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1',
    borderRadius: '6px', fontSize: '1rem', outline: 'none'
};

const actionContainerStyle = { display: 'flex', gap: '12px' };

const cancelBtnStyle = {
    flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0',
    color: '#64748b', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
};

const payBtnStyle = {
    flex: 1, padding: '12px', background: '#2563eb', border: 'none',
    color: '#ffffff', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
};
