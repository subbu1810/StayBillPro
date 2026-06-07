const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');

// Initialize Razorpay
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
} catch (error) {
    console.warn("Failed to initialize Razorpay:", error.message);
}

exports.createRechargeOrder = async (req, res) => {
    try {
        const { amount } = req.body; // Amount in rupees
        
        if (!amount || amount < 10) {
            return res.status(400).json({ success: false, message: 'Minimum recharge amount is ₹10' });
        }

        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency: 'INR',
            receipt: `recharge_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            order_id: order.id,
            amount: options.amount,
            currency: options.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ success: false, message: 'Could not create payment order' });
    }
};

exports.verifyRecharge = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount_paid } = req.body;
        
        const businessId = req.user.businessId || req.user.id;

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(body.toString())
            .digest('hex');

        // Verify against real signature only
        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Add funds to wallet
            const [bizUsers] = await db.query('SELECT scan_wallet_balance FROM admins WHERE id = ?', [businessId]);
            if (bizUsers.length === 0) {
                return res.status(404).json({ success: false, message: 'Admin not found' });
            }

            const currentBalance = parseFloat(bizUsers[0].scan_wallet_balance || 0);
            // Amount paid is sent in rupees
            const rechargeAmount = parseFloat(amount_paid || 0);
            const newBalance = currentBalance + rechargeAmount;

            await db.query('UPDATE admins SET scan_wallet_balance = ? WHERE id = ?', [newBalance, businessId]);
            
            // Log transaction
            await db.query(
                'INSERT INTO wallet_transactions (admin_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)',
                [businessId, 'recharge', rechargeAmount, 'Wallet Recharge via Razorpay', razorpay_payment_id || 'dummy_recharge']
            );

            res.json({ 
                success: true, 
                message: 'Wallet recharged successfully',
                newWalletBalance: newBalance
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ success: false, message: 'Could not verify payment' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const businessId = req.user.businessId || req.user.id;
        
        const [transactions] = await db.query(
            'SELECT * FROM wallet_transactions WHERE admin_id = ? ORDER BY created_at DESC',
            [businessId]
        );
        
        res.json({ success: true, transactions });
    } catch (error) {
        console.error('Wallet History Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Could not fetch wallet history' });
    }
};
