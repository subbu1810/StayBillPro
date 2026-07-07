const db = require('../config/db');

// Get all technicians for a business
exports.getAllTechnicians = async (req, res) => {
    try {
        const adminId = req.user.id;
        const branchId = req.query.branch_id;
        
        let query = 'SELECT * FROM technicians WHERE admin_id = ?';
        let params = [adminId];

        if (branchId) {
            query += ' AND (branch_id = ? OR branch_id IS NULL)';
            params.push(branchId);
        }
        
        query += ' ORDER BY created_at DESC';

        const [technicians] = await db.query(query, params);
        res.json(technicians);
    } catch (error) {
        console.error("Error fetching technicians:", error);
        res.status(500).json({ message: "Error fetching technicians", error: error.message });
    }
};

// Create a new technician
exports.createTechnician = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { name, email, phone, specialization, status, notes, branch_id } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: "Name and phone are required" });
        }

        const [result] = await db.query(
            `INSERT INTO technicians (admin_id, branch_id, name, email, phone, specialization, status, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, branch_id || null, name, email || null, phone, specialization || null, status || 'active', notes || null]
        );

        const [newTech] = await db.query('SELECT * FROM technicians WHERE id = ?', [result.insertId]);

        res.status(201).json(newTech[0]);
    } catch (error) {
        console.error("Error creating technician:", error);
        res.status(500).json({ message: "Error creating technician", error: error.message });
    }
};

// Get technician by ID
exports.getTechnicianById = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        const [technicians] = await db.query('SELECT * FROM technicians WHERE id = ? AND admin_id = ?', [id, adminId]);
        
        if (technicians.length === 0) {
            return res.status(404).json({ message: "Technician not found" });
        }

        res.json(technicians[0]);
    } catch (error) {
        console.error("Error fetching technician:", error);
        res.status(500).json({ message: "Error fetching technician", error: error.message });
    }
};

// Update a technician
exports.updateTechnician = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { name, email, phone, specialization, status, notes, branch_id } = req.body;

        const [tech] = await db.query('SELECT id FROM technicians WHERE id = ? AND admin_id = ?', [id, adminId]);
        if (tech.length === 0) {
            return res.status(404).json({ message: "Technician not found" });
        }

        await db.query(
            `UPDATE technicians 
             SET name = ?, email = ?, phone = ?, specialization = ?, status = ?, notes = ?, branch_id = ?
             WHERE id = ? AND admin_id = ?`,
            [name, email, phone, specialization, status, notes, branch_id || null, id, adminId]
        );

        const [updated] = await db.query('SELECT * FROM technicians WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error("Error updating technician:", error);
        res.status(500).json({ message: "Error updating technician", error: error.message });
    }
};

// Delete a technician
exports.deleteTechnician = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM technicians WHERE id = ? AND admin_id = ?', [id, adminId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Technician not found" });
        }

        res.json({ message: "Technician deleted successfully" });
    } catch (error) {
        console.error("Error deleting technician:", error);
        res.status(500).json({ message: "Error deleting technician", error: error.message });
    }
};

// Get active technicians
exports.getActiveTechnicians = async (req, res) => {
    try {
        const adminId = req.user.id;
        const [technicians] = await db.query(
            'SELECT * FROM technicians WHERE admin_id = ? AND status = "active"',
            [adminId]
        );
        res.json(technicians);
    } catch (error) {
        console.error("Error fetching active technicians:", error);
        res.status(500).json({ message: "Error fetching active technicians", error: error.message });
    }
};

// Get technicians by specialization
exports.getBySpecialization = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { spec } = req.params;
        
        const [technicians] = await db.query(
            'SELECT * FROM technicians WHERE admin_id = ? AND specialization LIKE ?',
            [adminId, `%${spec}%`]
        );
        res.json(technicians);
    } catch (error) {
        console.error("Error fetching technicians by specialization:", error);
        res.status(500).json({ message: "Error fetching technicians", error: error.message });
    }
};
