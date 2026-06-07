const db = require('../config/db');

// Get all spares (Service Inventory)
exports.getAllSpares = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id } = req.query;
        let query = `
             SELECT s.*, c.name as category_name 
             FROM service_inventory s 
             LEFT JOIN categories c ON s.category_id = c.id 
             WHERE s.admin_id = ?`;
        let params = [adminId];

        if (branch_id) {
            query += ' AND s.branch_id = ?';
            params.push(branch_id);
        }

        const [spares] = await db.query(query, params);
        res.json(spares);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching spares", error: error.message });
    }
};

// Create a new spare part
exports.createSpare = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id, category_id, name, brand, part_number, price, quantity, status, hsn_code, unit, gst_rate, serial_number, dimensions, size, purchase_price, wholesale_price, min_wholesale_qty, expiry_date } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO service_inventory (admin_id, branch_id, category_id, name, brand, part_number, price, quantity, status, hsn_code, unit, gst_rate, serial_number, dimensions, size, purchase_price, wholesale_price, min_wholesale_qty, expiry_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, branch_id, category_id, name, brand, part_number, price || 0, quantity || 0, status || 'available', hsn_code, unit || null, gst_rate || 18, serial_number, dimensions, size, purchase_price || 0, wholesale_price || null, min_wholesale_qty || null, expiry_date || null]
        );
        
        res.status(201).json({ message: "Spare part created successfully", id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating spare part", error: error.message });
    }
};

// Update a spare part
exports.updateSpare = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { branch_id, category_id, name, brand, part_number, price, quantity, status, hsn_code, unit, gst_rate, serial_number, dimensions, size, purchase_price, wholesale_price, min_wholesale_qty, expiry_date } = req.body;
        
        await db.query(
            `UPDATE service_inventory 
             SET category_id = ?, name = ?, brand = ?, part_number = ?, price = ?, quantity = ?, status = ?, hsn_code = ?, unit = ?, gst_rate = ?, serial_number = ?, dimensions = ?, size = ?, purchase_price = ?, wholesale_price = ?, min_wholesale_qty = ?, expiry_date = ? 
             WHERE id = ? AND admin_id = ?`,
            [category_id, name, brand, part_number, price, quantity, status, hsn_code, unit || null, gst_rate, serial_number, dimensions, size, purchase_price, wholesale_price || null, min_wholesale_qty || null, expiry_date || null, id, adminId]
        );
        
        res.json({ message: "Spare part updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating spare part", error: error.message });
    }
};

// Delete a spare part
exports.deleteSpare = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        
        await db.query('DELETE FROM service_inventory WHERE id = ? AND admin_id = ?', [id, adminId]);
        res.json({ message: "Spare part deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting spare part", error: error.message });
    }
};

// Low stock spares
exports.getLowStockSpares = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id, threshold = 5 } = req.query;
        
        let query = 'SELECT * FROM service_inventory WHERE admin_id = ? AND quantity <= ?';
        let params = [adminId, threshold];

        if (branch_id) {
            query += ' AND branch_id = ?';
            params.push(branch_id);
        }

        const [spares] = await db.query(query, params);
        res.json(spares);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching low stock spares", error: error.message });
    }
};
