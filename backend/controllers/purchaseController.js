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
        res.status(500).json({ message: 'Error recording purchase' });
    }
};

// ================= PURCHASE ORDERS ================= //

// Get All Purchase Orders
exports.getAllPurchaseOrders = async (req, res) => {
    const adminId = req.user.id;
    const { branchId, status } = req.query;

    try {
        let query = 'SELECT * FROM purchase_orders WHERE admin_id = ?';
        let params = [adminId];

        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY order_date DESC, created_at DESC';

        const [purchaseOrders] = await db.execute(query, params);
        res.json({ success: true, purchaseOrders });
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        res.status(500).json({ message: 'Error fetching purchase orders' });
    }
};

// Get Single Purchase Order with Items
exports.getPurchaseOrder = async (req, res) => {
    const adminId = req.user.id;
    const { id } = req.params;

    try {
        const [poRows] = await db.execute(
            'SELECT * FROM purchase_orders WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );

        if (poRows.length === 0) {
            return res.status(404).json({ message: 'Purchase order not found' });
        }

        const purchaseOrder = poRows[0];

        // Fetch items
        const [itemRows] = await db.query(
            'SELECT * FROM purchase_order_items WHERE po_id = ?',
            [id]
        );
        purchaseOrder.items = itemRows;

        // Fetch branch details
        const [branchRows] = await db.query(
            'SELECT * FROM branches WHERE id = ?',
            [purchaseOrder.branch_id]
        );
        purchaseOrder.branch_details = branchRows[0] || null;

        // Fetch supplier details
        const [supplierRows] = await db.query(
            'SELECT * FROM suppliers WHERE supplier_name = ? AND admin_id = ?',
            [purchaseOrder.supplier_name, adminId]
        );
        purchaseOrder.supplier_details = supplierRows[0] || null;

        res.json({ success: true, purchaseOrder });
    } catch (error) {
        console.error('Error fetching purchase order:', error);
        res.status(500).json({ message: 'Error fetching purchase order' });
    }
};

// Create a New Purchase Order
exports.createPurchaseOrder = async (req, res) => {
    const adminId = req.user.id;
    const { branch_id, supplier_name, order_date, expected_date, items } = req.body;

    if (!branch_id || !supplier_name || !order_date || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields or items' });
    }

    try {
        // Calculate total amount
        const total_amount = items.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);

        // Generate PO Number (PO-timestamp)
        const po_number = `PO-${Date.now()}`;

        // Begin transaction
        await db.query('START TRANSACTION');

        // Insert into purchase_orders
        const [poResult] = await db.execute(
            `INSERT INTO purchase_orders (admin_id, branch_id, supplier_name, po_number, order_date, expected_date, total_amount, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [adminId, branch_id, supplier_name, po_number, order_date, expected_date || null, total_amount]
        );

        const po_id = poResult.insertId;

        // Insert items into purchase_order_items
        for (const item of items) {
            await db.execute(
                `INSERT INTO purchase_order_items (po_id, product_name, quantity, unit_price, total_price) 
                 VALUES (?, ?, ?, ?, ?)`,
                [po_id, item.product_name, item.quantity, item.unit_price, item.total_price]
            );
        }

        // Commit transaction
        await db.query('COMMIT');

        res.status(201).json({ success: true, message: 'Purchase Order created successfully', po_id, po_number });
    } catch (error) {
        // Rollback on error
        await db.query('ROLLBACK');
        console.error('Error creating purchase order:', error);
        res.status(500).json({ message: 'Error creating purchase order', error: error.message });
        res.status(500).json({ message: 'Error creating purchase order', error: error.message });
    }
};

// ================= GOODS RECEIVED NOTES (GRN) ================= //

// Get All GRNs (Item Level)
exports.getAllGRNs = async (req, res) => {
    const adminId = req.user.id;
    const { branchId, supplier, grnNo, poNo, fromDate, toDate, itemName } = req.query;

    try {
        let query = `
            SELECT 
                gi.id as grn_item_id,
                gi.product_name as item_name,
                gi.quantity_received as recvd_qty,
                g.id as grn_id,
                g.grn_number,
                g.grn_date,
                g.supplier_name,
                g.status,
                p.po_number,
                pi.quantity as order_qty,
                b.name as branch_name,
                a.admin_name as made_by
            FROM grn_items gi
            JOIN grns g ON gi.grn_id = g.id
            LEFT JOIN purchase_orders p ON g.po_id = p.id
            LEFT JOIN purchase_order_items pi ON p.id = pi.po_id AND pi.product_name = gi.product_name
            LEFT JOIN branches b ON g.branch_id = b.id
            LEFT JOIN admins a ON g.admin_id = a.id
            WHERE g.admin_id = ?
        `;
        let params = [adminId];

        if (branchId) {
            query += ' AND g.branch_id = ?';
            params.push(branchId);
        }
        if (supplier) {
            query += ' AND g.supplier_name LIKE ?';
            params.push(`%${supplier}%`);
        }
        if (grnNo) {
            query += ' AND g.grn_number LIKE ?';
            params.push(`%${grnNo}%`);
        }
        if (poNo) {
            query += ' AND p.po_number LIKE ?';
            params.push(`%${poNo}%`);
        }
        if (itemName) {
            query += ' AND gi.product_name LIKE ?';
            params.push(`%${itemName}%`);
        }
        if (fromDate) {
            query += ' AND g.grn_date >= ?';
            params.push(fromDate);
        }
        if (toDate) {
            query += ' AND g.grn_date <= ?';
            params.push(toDate);
        }

        query += ' ORDER BY g.grn_date DESC, gi.id DESC';

        const [grnItems] = await db.query(query, params);
        res.json({ success: true, grns: grnItems });
    } catch (error) {
        console.error('Error fetching GRN items:', error);
        res.status(500).json({ message: 'Error fetching GRN items' });
    }
};

// Create a New GRN
exports.createGRN = async (req, res) => {
    const adminId = req.user.id;
    const { branch_id, po_id, grn_date, supplier_name, warehouse, status, items } = req.body;

    if (!branch_id || !grn_date || !supplier_name || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields or items' });
    }

    try {
        // Generate GRN Number (GRN-timestamp)
        const grn_number = `GRN-${Date.now()}`;

        // Begin transaction
        await db.query('START TRANSACTION');

        // Insert into grns
        const [grnResult] = await db.execute(
            `INSERT INTO grns (admin_id, branch_id, po_id, grn_number, grn_date, supplier_name, warehouse, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, branch_id, po_id || null, grn_number, grn_date, supplier_name, warehouse || 'Main Warehouse', status || 'Stocked']
        );

        const grn_id = grnResult.insertId;

        // Insert items into grn_items
        for (const item of items) {
            await db.execute(
                `INSERT INTO grn_items (grn_id, product_name, quantity_received) 
                 VALUES (?, ?, ?)`,
                [grn_id, item.product_name, item.quantity_received]
            );
        }

        // Update the linked PO status if po_id is provided
        if (po_id && status === 'Stocked') {
             await db.execute('UPDATE purchase_orders SET status = "Received" WHERE id = ?', [po_id]);
        }

        // Commit transaction
        await db.query('COMMIT');

        res.status(201).json({ success: true, message: 'GRN created successfully', grn_id, grn_number });
    } catch (error) {
        // Rollback on error
        await db.query('ROLLBACK');
        console.error('Error creating GRN:', error);
        res.status(500).json({ message: 'Error creating GRN', error: error.message });
    }
};

// Delete GRN Item
exports.deleteGRNItem = async (req, res) => {
    const adminId = req.user.id;
    const { id } = req.params; // this is grn_item_id

    try {
        // First verify ownership
        const [rows] = await db.query(`
            SELECT gi.id 
            FROM grn_items gi 
            JOIN grns g ON gi.grn_id = g.id 
            WHERE gi.id = ? AND g.admin_id = ?
        `, [id, adminId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'GRN item not found or unauthorized' });
        }

        await db.query('DELETE FROM grn_items WHERE id = ?', [id]);
        res.json({ success: true, message: 'GRN item deleted successfully' });
    } catch (error) {
        console.error('Error deleting GRN item:', error);
        res.status(500).json({ success: false, message: 'Error deleting GRN item' });
    }
};
