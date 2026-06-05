const db = require('../config/db');

// Get all branches for an admin
exports.getAllBranches = async (req, res) => {
    try {
        const adminId = req.user.id;
        const [branches] = await db.query(
            'SELECT * FROM branches WHERE admin_id = ? ORDER BY is_main DESC, name ASC',
            [adminId]
        );
        res.json(branches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching branches", error: error.message });
    }
};

// Create a new branch
exports.createBranch = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { name, email, phone, address, city, state, pincode, gst_number, is_main } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO branches (admin_id, name, email, phone, address, city, state, pincode, gst_number, is_main) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [adminId, name, email, phone, address, city, state, pincode, gst_number, is_main || false]
        );
        
        res.status(201).json({ message: "Branch created successfully", id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating branch", error: error.message });
    }
};

// Update a branch
exports.updateBranch = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { name, email, phone, address, city, state, pincode, gst_number, is_main } = req.body;
        
        await db.query(
            'UPDATE branches SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?, gst_number = ?, is_main = ? WHERE id = ? AND admin_id = ?',
            [name, email, phone, address, city, state, pincode, gst_number, is_main || false, id, adminId]
        );
        
        res.json({ message: "Branch updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating branch", error: error.message });
    }
};

// Delete a branch
exports.deleteBranch = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        
        await db.query('DELETE FROM branches WHERE id = ? AND admin_id = ?', [id, adminId]);
        res.json({ message: "Branch deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting branch", error: error.message });
    }
};

// Get Consolidated Group Reports (Super Admin)
exports.getConsolidatedReports = async (req, res) => {
    try {
        const adminId = req.user.id;

        // 1. Fetch all branches
        const [branches] = await db.query(
            'SELECT id, name FROM branches WHERE admin_id = ?',
            [adminId]
        );

        // 2. Fetch Group Stats
        // Total Revenue (Paid Invoices)
        const [revenueRes] = await db.query(
            'SELECT SUM(total_amount) as total FROM invoices WHERE admin_id = ? AND status = "paid"',
            [adminId]
        );

        // Total Inventory Value
        const [inventoryRes] = await db.query(
            'SELECT SUM(purchase_price * quantity) as total FROM sales_inventory WHERE admin_id = ?',
            [adminId]
        );

        // 3. Branch Performance Matrix
        const matrix = await Promise.all(branches.map(async (branch) => {
            // Sales for this branch
            const [salesRes] = await db.query(
                'SELECT SUM(total_amount) as total FROM invoices WHERE branch_id = ? AND status = "paid"',
                [branch.id]
            );

            // Expenses for this branch
            const [expenseRes] = await db.query(
                'SELECT SUM(amount) as total FROM expenses WHERE branch_id = ?',
                [branch.id]
            );

            // Inventory for this branch
            const [invRes] = await db.query(
                'SELECT SUM(purchase_price * quantity) as total FROM sales_inventory WHERE branch_id = ?',
                [branch.id]
            );

            const sales = parseFloat(salesRes[0].total) || 0;
            const expenses = parseFloat(expenseRes[0].total) || 0;
            const inventory = parseFloat(invRes[0].total) || 0;

            return {
                id: branch.id,
                name: branch.name,
                sales,
                expenses,
                inventory,
                netProfit: sales - expenses,
                growth: 0 // Mock growth for now
            };
        }));

        res.json({
            groupTotalRevenue: parseFloat(revenueRes[0].total) || 0,
            totalActiveStock: parseFloat(inventoryRes[0].total) || 0,
            branchesCount: branches.length,
            matrix: matrix
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating consolidated reports", error: error.message });
    }
};
