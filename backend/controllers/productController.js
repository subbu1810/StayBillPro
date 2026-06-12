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
        let { branch_id, category_id, category, name, brand, sku, price, quantity, status, hsn_code, unit, gst_rate, serial_number, dimensions, size, purchase_price, wholesale_price, min_wholesale_qty, expiry_date } = req.body;
        
        if (!branch_id) {
            return res.status(400).json({ message: "branch_id is required" });
        }

        // Handle string category name (lookup or create)
        if (!category_id && category) {
            const [existing] = await db.query('SELECT id FROM categories WHERE admin_id = ? AND name = ?', [adminId, category]);
            if (existing.length > 0) {
                category_id = existing[0].id;
            } else {
                const [newCat] = await db.query(
                    'INSERT INTO categories (admin_id, branch_id, name, type) VALUES (?, ?, ?, ?)',
                    [adminId, branch_id, category, 'sales']
                );
                category_id = newCat.insertId;
            }
        }

        const [result] = await db.query(
            `INSERT INTO sales_inventory (admin_id, branch_id, category_id, name, brand, sku, price, quantity, status, hsn_code, unit, gst_rate, serial_number, dimensions, size, purchase_price, wholesale_price, min_wholesale_qty, expiry_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, branch_id, category_id || null, name, brand, sku, price || 0, quantity || 0, status || 'available', hsn_code, unit || null, gst_rate || 18, serial_number, dimensions, size, purchase_price || 0, wholesale_price || null, min_wholesale_qty || null, expiry_date || null]
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
        let { category_id, category, name, brand, sku, price, quantity, status, hsn_code, unit, gst_rate, serial_number, dimensions, size, purchase_price, wholesale_price, min_wholesale_qty, expiry_date } = req.body;
        
        // Handle string category name (lookup or create)
        if (!category_id && category) {
            const [existing] = await db.query('SELECT id FROM categories WHERE admin_id = ? AND name = ?', [adminId, category]);
            if (existing.length > 0) {
                category_id = existing[0].id;
            } else {
                // Get branch_id from product
                const [prod] = await db.query('SELECT branch_id FROM sales_inventory WHERE id = ?', [id]);
                const branch_id = prod.length > 0 ? prod[0].branch_id : null;
                
                if (branch_id) {
                    const [newCat] = await db.query(
                        'INSERT INTO categories (admin_id, branch_id, name, type) VALUES (?, ?, ?, ?)',
                        [adminId, branch_id, category, 'sales']
                    );
                    category_id = newCat.insertId;
                }
            }
        }

        await db.query(
            `UPDATE sales_inventory 
             SET category_id = ?, name = ?, brand = ?, sku = ?, price = ?, quantity = ?, status = ?, hsn_code = ?, unit = ?, gst_rate = ?, serial_number = ?, dimensions = ?, size = ?, purchase_price = ?, wholesale_price = ?, min_wholesale_qty = ?, expiry_date = ? 
             WHERE id = ? AND admin_id = ?`,
            [category_id || null, name, brand, sku, price, quantity, status, hsn_code, unit || null, gst_rate, serial_number, dimensions, size, purchase_price, wholesale_price || null, min_wholesale_qty || null, expiry_date || null, id, adminId]
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

// Expiry stock products
exports.getExpiryStock = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id } = req.query;
        
        let query = `
            SELECT p.*, c.name as category_name 
            FROM sales_inventory p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.admin_id = ? AND p.expiry_date IS NOT NULL
        `;
        let params = [adminId];
        
        if (branch_id) {
            query += ' AND p.branch_id = ?';
            params.push(branch_id);
        }

        query += ' ORDER BY p.expiry_date ASC';

        const [products] = await db.query(query, params);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching expiry stock products", error: error.message });
    }
};
