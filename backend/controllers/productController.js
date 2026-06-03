const db = require('../config/db');

// Get all products (Sales Inventory)
exports.getAllProducts = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id } = req.query;
        
        let query = `
            SELECT p.*, c.name as category_name 
            FROM sales_inventory p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.admin_id = ?
        `;
        let params = [adminId];
        
        if (branch_id) {
            query += ' AND p.branch_id = ?';
            params.push(branch_id);
        }
        
        const [products] = await db.query(query, params);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching products", error: error.message });
    }
};

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id, category_id, name, brand, sku, price, quantity, status, hsn_code, gst_rate, serial_number, dimensions, purchase_price } = req.body;
        
        if (!branch_id) {
            return res.status(400).json({ message: "branch_id is required" });
        }

        const [result] = await db.query(
            `INSERT INTO sales_inventory (admin_id, branch_id, category_id, name, brand, sku, price, quantity, status, hsn_code, gst_rate, serial_number, dimensions, purchase_price) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, branch_id, category_id, name, brand, sku, price || 0, quantity || 0, status || 'available', hsn_code, gst_rate || 18, serial_number, dimensions, purchase_price || 0]
        );
        
        res.status(201).json({ message: "Product created successfully", id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { category_id, name, brand, sku, price, quantity, status, hsn_code, gst_rate, serial_number, dimensions, purchase_price } = req.body;
        
        await db.query(
            `UPDATE sales_inventory 
             SET category_id = ?, name = ?, brand = ?, sku = ?, price = ?, quantity = ?, status = ?, hsn_code = ?, gst_rate = ?, serial_number = ?, dimensions = ?, purchase_price = ? 
             WHERE id = ? AND admin_id = ?`,
            [category_id, name, brand, sku, price, quantity, status, hsn_code, gst_rate, serial_number, dimensions, purchase_price, id, adminId]
        );
        
        res.json({ message: "Product updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        
        await db.query('DELETE FROM sales_inventory WHERE id = ? AND admin_id = ?', [id, adminId]);
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting product", error: error.message });
    }
};

// Low stock products
exports.getLowStockProducts = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id, threshold = 5 } = req.query;
        
        let query = 'SELECT * FROM sales_inventory WHERE admin_id = ? AND quantity <= ?';
        let params = [adminId, threshold];
        
        if (branch_id) {
            query += ' AND branch_id = ?';
            params.push(branch_id);
        }

        const [products] = await db.query(query, params);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching low stock products", error: error.message });
    }
};
