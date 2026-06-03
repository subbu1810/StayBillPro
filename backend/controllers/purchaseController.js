const db = require('../config/db');

// Get All Purchases
exports.getAllPurchases = async (req, res) => {
    const { branchId, startDate, endDate } = req.query;
    const adminId = req.user.id;

    try {
        let query = 'SELECT * FROM purchases WHERE admin_id = ?';
        let params = [adminId];

        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }

        if (startDate && endDate) {
            query += ' AND purchase_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY purchase_date DESC';

        const [purchases] = await db.execute(query, params);
        res.json(purchases);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ message: 'Error fetching purchases' });
    }
};

// Add Purchase
exports.addPurchase = async (req, res) => {
    const { branch_id, supplier_name, bill_number, total_amount, gst_amount, purchase_date } = req.body;
    const adminId = req.user.id;

    if (!branch_id || !supplier_name || !total_amount) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO purchases (admin_id, branch_id, supplier_name, bill_number, total_amount, gst_amount, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                adminId, 
                branch_id, 
                supplier_name, 
                bill_number, 
                total_amount, 
                gst_amount || 0, 
                purchase_date || new Date().toISOString().split('T')[0]
            ]
        );
        res.status(201).json({ message: 'Purchase recorded successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding purchase:', error);
        res.status(500).json({ message: 'Error recording purchase' });
    }
};
