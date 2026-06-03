const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all staff for a business
exports.getAllStaff = async (req, res) => {
    try {
        const adminId = req.user.id; // Business owner ID
        
        // Only SUPERADMIN can view/manage staff
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Access denied. Superadmin only." });
        }

        const [staff] = await db.query(
            `SELECT u.id, u.admin_name, u.email, u.phone, u.role, u.branch_id, u.permissions, u.status, b.name as branch_name 
             FROM admins u 
             LEFT JOIN branches b ON u.branch_id = b.id 
             WHERE u.parent_admin_id = ? AND u.role = 'USER'`,
            [adminId]
        );
        res.json(staff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching staff", error: error.message });
    }
};

// Create a new staff member
exports.createStaff = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { admin_name, email, phone, password, branch_id } = req.body;

        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Access denied." });
        }

        // Check if email exists
        const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            `INSERT INTO admins (parent_admin_id, branch_id, admin_name, email, phone, password, role, is_active, status, permissions) 
             VALUES (?, ?, ?, ?, ?, ?, 'USER', true, 'active', ?)`,
            [adminId, branch_id, admin_name, email, phone, hashedPassword, req.body.permissions ? JSON.stringify(req.body.permissions) : null]
        );

        res.status(201).json({ message: "Staff member created successfully", id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating staff", error: error.message });
    }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Access denied." });
        }

        await db.query('DELETE FROM admins WHERE id = ? AND parent_admin_id = ?', [id, adminId]);
        res.json({ message: "Staff member removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error removing staff", error: error.message });
    }
};

// Update staff member
exports.updateStaff = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { admin_name, email, phone, password, branch_id, status, permissions } = req.body;

        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Access denied." });
        }

        // Check if user exists and belongs to this admin
        const [user] = await db.query('SELECT id FROM admins WHERE id = ? AND parent_admin_id = ?', [id, adminId]);
        if (user.length === 0) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        let query = 'UPDATE admins SET admin_name = ?, email = ?, phone = ?, branch_id = ?, status = ?, permissions = ?';
        let params = [admin_name, email, phone, branch_id, status, permissions ? JSON.stringify(permissions) : null];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ? AND parent_admin_id = ?';
        params.push(id, adminId);

        await db.query(query, params);
        res.json({ message: "Staff member updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating staff", error: error.message });
    }
};
