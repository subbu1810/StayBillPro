const Razorpay = require('razorpay');

let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });
} catch (error) {
    console.warn("Failed to initialize Razorpay:", error.message);
}

exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay works in paise
            currency,
            receipt: `sub_${Date.now()}`
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
