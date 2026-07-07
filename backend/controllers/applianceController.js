const db = require('../config/db');

// Get all appliances
exports.getAllAppliances = async (req, res) => {
    try {
        const adminId = req.user.id;
        const branchId = req.query.branch_id;
        
        let query = 'SELECT * FROM appliances WHERE admin_id = ?';
        let params = [adminId];

        if (branchId) {
            query += ' AND (branch_id = ? OR branch_id IS NULL)';
            params.push(branchId);
        }
        
        query += ' ORDER BY created_at DESC';

        const [appliances] = await db.query(query, params);
        res.json(appliances);
    } catch (error) {
        console.error("Error fetching appliances:", error);
        res.status(500).json({ message: "Error fetching appliances", error: error.message });
    }
};

// Create a new appliance
exports.createAppliance = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { 
            name, category, brand, model, notes, branch_id 
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO appliances (
                admin_id, branch_id, name, category, brand, model, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId, branch_id || null, name, category || null, 
                brand || null, model || null, notes || null
            ]
        );

        const [newAppliance] = await db.query('SELECT * FROM appliances WHERE id = ?', [result.insertId]);

        res.status(201).json(newAppliance[0]);
    } catch (error) {
        console.error("Error creating appliance:", error);
        res.status(500).json({ message: "Error creating appliance", error: error.message });
    }
};

// Get appliance by ID
exports.getApplianceById = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        const [appliances] = await db.query('SELECT * FROM appliances WHERE id = ? AND admin_id = ?', [id, adminId]);
        
        if (appliances.length === 0) {
            return res.status(404).json({ message: "Appliance not found" });
        }

        res.json(appliances[0]);
    } catch (error) {
        console.error("Error fetching appliance:", error);
        res.status(500).json({ message: "Error fetching appliance", error: error.message });
    }
};

// Update an appliance
exports.updateAppliance = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { 
            name, category, brand, model, notes, branch_id 
        } = req.body;

        const [appliance] = await db.query('SELECT id FROM appliances WHERE id = ? AND admin_id = ?', [id, adminId]);
        if (appliance.length === 0) {
            return res.status(404).json({ message: "Appliance not found" });
        }

        // Build dynamic update query
        let query = 'UPDATE appliances SET ';
        const params = [];
        const updates = [];

        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (category !== undefined) { updates.push('category = ?'); params.push(category); }
        if (brand !== undefined) { updates.push('brand = ?'); params.push(brand); }
        if (model !== undefined) { updates.push('model = ?'); params.push(model); }
        if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
        if (branch_id !== undefined) { updates.push('branch_id = ?'); params.push(branch_id); }

        if (updates.length > 0) {
            query += updates.join(', ') + ' WHERE id = ? AND admin_id = ?';
            params.push(id, adminId);
            await db.query(query, params);
        }

        const [updated] = await db.query('SELECT * FROM appliances WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error("Error updating appliance:", error);
        res.status(500).json({ message: "Error updating appliance", error: error.message });
    }
};

// Delete an appliance
exports.deleteAppliance = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM appliances WHERE id = ? AND admin_id = ?', [id, adminId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Appliance not found" });
        }

        res.json({ message: "Appliance deleted successfully" });
    } catch (error) {
        console.error("Error deleting appliance:", error);
        res.status(500).json({ message: "Error deleting appliance", error: error.message });
    }
};

