const db = require('../config/db');

// Get all stock logs
exports.getAllLogs = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { type, branch_id } = req.query; // 'sales' or 'service'
        
        let query = 'SELECT * FROM stock_log WHERE admin_id = ?';
        let params = [adminId];
        
        if (type) {
            query += ' AND item_type = ?';
            params.push(type);
        }

        if (branch_id) {
            query += ' AND branch_id = ?';
            params.push(branch_id);
        }
        
        query += ' ORDER BY created_at DESC LIMIT 500';
        
        const [logs] = await db.query(query, params);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching stock logs", error: error.message });
    }
};

// Create a stock log entry
exports.createLog = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason, branch_id } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO stock_log (admin_id, branch_id, item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, branch_id, item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason]
        );
        
        res.status(201).json({ message: "Stock log entry created", id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating stock log", error: error.message });
    }
};
