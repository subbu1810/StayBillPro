const db = require('../config/db');

// Get all categories for an admin
exports.getCategories = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { type, branch_id } = req.query; // optional filter by type
        
        let query = 'SELECT * FROM categories WHERE admin_id = ?';
        let params = [adminId];
        
        if (type) {
            query += ' AND (type = ? OR type = "both")';
            params.push(type);
        }

        if (branch_id) {
            query += ' AND branch_id = ?';
            params.push(branch_id);
        }
        
        const [categories] = await db.query(query, params);
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { name, type, branch_id } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO categories (admin_id, branch_id, name, type) VALUES (?, ?, ?, ?)',
            [adminId, branch_id, name, type || 'both']
        );
        
        res.status(201).json({ 
            message: "Category created successfully", 
            id: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating category", error: error.message });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { name, type } = req.body;
        
        await db.query(
            'UPDATE categories SET name = ?, type = ? WHERE id = ? AND admin_id = ?',
            [name, type, id, adminId]
        );
        
        res.json({ message: "Category updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating category", error: error.message });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        
        await db.query('DELETE FROM categories WHERE id = ? AND admin_id = ?', [id, adminId]);
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
};
