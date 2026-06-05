const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Verify Payment and Activate Subscription
router.post('/verify', async (req, res) => {
    try {
        const { 
            admin_id, plan_name, features, transaction_id, 
            amount, gst_amount, total_paid 
        } = req.body;

        // 1. Calculate validity based on plan
        let months = 12;
        if (plan_name === 'Professional') months = 24;
        if (plan_name === 'Enterprise') months = 36;

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + months);

        // 2. Record the subscription
        await db.query(
            `INSERT INTO subscriptions (
                admin_id, plan_name, features, amount, gst_amount, total_paid, 
                transaction_id, payment_status, start_date, expiry_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Success', ?, ?)`,
            [admin_id, plan_name, features || 'Both Features', amount, gst_amount, total_paid, transaction_id, startDate, expiryDate]
        );

        // 3. Activate the Admin profile
        await db.query(
            `UPDATE admins SET 
                is_active = TRUE, 
                current_plan = ?, 
                subscription_expiry = ? 
            WHERE id = ?`,
            [plan_name, expiryDate, admin_id]
        );

        res.json({ message: "Payment verified. Subscription activated until " + expiryDate.toDateString() });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Verification failed", error: error.message });
    }
});

module.exports = router;
