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
                gi.category_name as category_name,
                gi.hsn as hsn,
                gi.gst as gst,
                gi.net_rate as net_rate,
                gi.rate as rate,
                gi.discount as discount,
                gi.amount as amount,
                gi.quantity_received as recvd_qty,
                gi.damaged_quantity as damaged_qty,
                gi.pushed_to_stock,
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
                `INSERT INTO grn_items (grn_id, product_name, category_name, quantity_received, damaged_quantity, mapped_inventory_id, inventory_type, hsn, gst, net_rate, rate, discount, amount) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    grn_id, 
                    item.product_name, 
                    item.category_name || null,
                    item.quantity_received, 
                    item.damaged_quantity || 0,
                    item.mapped_inventory_id || null, 
                    item.inventory_type || 'sales',
                    item.hsn || null,
                    item.gst || 0,
                    item.netRate || 0,
                    item.rate || 0,
                    item.discount || 0,
                    item.amount || 0
                ]
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

// Update GRN Item
exports.updateGRNItem = async (req, res) => {
    const adminId = req.user.id;
    const { id } = req.params; // this is grn_item_id
    const { product_name, category_name, hsn, gst, rate, netRate, discount, amount, quantity_received, damaged_quantity } = req.body;

    try {
        await db.query('START TRANSACTION');

        // First verify ownership and fetch old item
        const [rows] = await db.query(`
            SELECT gi.*, g.branch_id
            FROM grn_items gi 
            JOIN grns g ON gi.grn_id = g.id 
            WHERE gi.id = ? AND g.admin_id = ?
        `, [id, adminId]);

        if (rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'GRN item not found or unauthorized' });
        }

        const oldItem = rows[0];
        const oldValidQty = oldItem.quantity_received - (oldItem.damaged_quantity || 0);
        const newValidQty = quantity_received - (damaged_quantity || 0);
        const deltaQty = newValidQty - oldValidQty;

        // Update the GRN item
        await db.execute(`
            UPDATE grn_items 
            SET product_name = ?, category_name = ?, hsn = ?, gst = ?, rate = ?, net_rate = ?, discount = ?, amount = ?, quantity_received = ?, damaged_quantity = ?
            WHERE id = ?
        `, [product_name, category_name || null, hsn || null, gst || 0, rate || 0, netRate || 0, discount || 0, amount || 0, quantity_received, damaged_quantity || 0, id]);

        // If it was already pushed to stock, sync the stock
        if (oldItem.pushed_to_stock) {
            if (oldItem.mapped_inventory_id) {
                const tableName = oldItem.inventory_type === 'service' ? 'service_inventory' : 'sales_inventory';
                
                let updateFields = 'quantity = quantity + ?';
                let queryParams = [deltaQty];
                
                if (rate > 0) { updateFields += ', price = ?'; queryParams.push(rate); }
                if (netRate > 0) { updateFields += ', purchase_price = ?, wholesale_price = ?'; queryParams.push(netRate, netRate); }
                if (hsn) { updateFields += ', hsn_code = ?'; queryParams.push(hsn); }
                if (gst > 0) { updateFields += ', gst_rate = ?'; queryParams.push(gst); }
                
                queryParams.push(oldItem.mapped_inventory_id, oldItem.branch_id, adminId);
                
                const [updateResult] = await db.execute(`
                    UPDATE ${tableName} 
                    SET ${updateFields}
                    WHERE id = ? AND branch_id = ? AND admin_id = ?
                `, queryParams);

                if (updateResult.affectedRows > 0 && deltaQty !== 0) {
                    const changeType = deltaQty > 0 ? 'in' : 'out';
                    const absDelta = Math.abs(deltaQty);
                    const [invRows] = await db.query(`SELECT quantity, name FROM ${tableName} WHERE id = ?`, [oldItem.mapped_inventory_id]);
                    if (invRows.length > 0) {
                        await db.execute(`
                            INSERT INTO stock_log (admin_id, branch_id, item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [adminId, oldItem.branch_id, oldItem.mapped_inventory_id, oldItem.inventory_type || 'sales', invRows[0].name, changeType, absDelta, invRows[0].quantity, 'GRN Item Edit Sync']);
                    }
                }
            } else {
                // Fallback by name
                let updateFieldsFb = 'quantity = quantity + ?';
                let queryParamsFb = [deltaQty];
                
                if (rate > 0) { updateFieldsFb += ', price = ?'; queryParamsFb.push(rate); }
                if (netRate > 0) { updateFieldsFb += ', purchase_price = ?, wholesale_price = ?'; queryParamsFb.push(netRate, netRate); }
                if (hsn) { updateFieldsFb += ', hsn_code = ?'; queryParamsFb.push(hsn); }
                if (gst > 0) { updateFieldsFb += ', gst_rate = ?'; queryParamsFb.push(gst); }
                
                queryParamsFb.push(oldItem.product_name, oldItem.branch_id, adminId);
                
                await db.execute(`
                    UPDATE sales_inventory 
                    SET ${updateFieldsFb}
                    WHERE name = ? AND branch_id = ? AND admin_id = ?
                `, queryParamsFb);
            }
        }

        await db.query('COMMIT');
        res.json({ success: true, message: 'GRN item updated successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error updating GRN item:', error);
        res.status(500).json({ success: false, message: 'Error updating GRN item', error: error.message });
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

// Push GRN Items to Stock
exports.pushToStock = async (req, res) => {
    const adminId = req.user.id;
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No items selected' });
    }

    try {
        await db.query('START TRANSACTION');

        for (const itemId of itemIds) {
            const [rows] = await db.query(`
                SELECT gi.*, g.branch_id
                FROM grn_items gi 
                JOIN grns g ON gi.grn_id = g.id 
                WHERE gi.id = ? AND g.admin_id = ?
            `, [itemId, adminId]);

            if (rows.length === 0) continue;
            const item = rows[0];

            if (item.pushed_to_stock) continue;

            const valid_quantity = item.quantity_received - (item.damaged_quantity || 0);
            if (valid_quantity <= 0) {
                await db.execute('UPDATE grn_items SET pushed_to_stock = TRUE WHERE id = ?', [itemId]);
                continue;
            }

            if (item.mapped_inventory_id) {
                const tableName = item.inventory_type === 'service' ? 'service_inventory' : 'sales_inventory';
                
                // Build dynamic update query to include pricing fields if they exist
                let updateFields = 'quantity = quantity + ?';
                let queryParams = [valid_quantity];
                
                if (item.rate > 0) {
                    updateFields += ', price = ?';
                    queryParams.push(item.rate);
                }
                if (item.net_rate > 0) {
                    updateFields += ', purchase_price = ?';
                    queryParams.push(item.net_rate);
                    // Update wholesale_price to match purchase_price by default or if needed
                    updateFields += ', wholesale_price = ?';
                    queryParams.push(item.net_rate);
                }
                if (item.hsn) {
                    updateFields += ', hsn_code = ?';
                    queryParams.push(item.hsn);
                }
                if (item.gst > 0) {
                    updateFields += ', gst_rate = ?';
                    queryParams.push(item.gst);
                }
                
                queryParams.push(item.mapped_inventory_id, item.branch_id, adminId);
                
                const [updateResult] = await db.execute(`
                    UPDATE ${tableName} 
                    SET ${updateFields}
                    WHERE id = ? AND branch_id = ? AND admin_id = ?
                `, queryParams);

                if (updateResult.affectedRows > 0) {
                    const [invRows] = await db.query(
                        `SELECT id, quantity, name FROM ${tableName} WHERE id = ? LIMIT 1`, 
                        [item.mapped_inventory_id]
                    );
                    if (invRows.length > 0) {
                        await db.execute(`
                            INSERT INTO stock_log (admin_id, branch_id, item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason)
                            VALUES (?, ?, ?, ?, ?, 'in', ?, ?, ?)
                        `, [adminId, item.branch_id, invRows[0].id, item.inventory_type || 'sales', invRows[0].name, valid_quantity, invRows[0].quantity, 'GRN Push to Stock']);
                    }
                    await db.execute('UPDATE grn_items SET pushed_to_stock = TRUE WHERE id = ?', [itemId]);
                    continue; // Skip the fallback logic
                }
            }

            // Fallback logic if mapping wasn't provided or update failed
            // Update existing by name
            let updateFieldsFb = 'quantity = quantity + ?';
            let queryParamsFb = [valid_quantity];
            
            if (item.rate > 0) { updateFieldsFb += ', price = ?'; queryParamsFb.push(item.rate); }
            if (item.net_rate > 0) { updateFieldsFb += ', purchase_price = ?, wholesale_price = ?'; queryParamsFb.push(item.net_rate, item.net_rate); }
            if (item.hsn) { updateFieldsFb += ', hsn_code = ?'; queryParamsFb.push(item.hsn); }
            if (item.gst > 0) { updateFieldsFb += ', gst_rate = ?'; queryParamsFb.push(item.gst); }
            
            queryParamsFb.push(item.product_name, item.branch_id, adminId);

            const [updateResult] = await db.execute(`
                UPDATE sales_inventory 
                SET ${updateFieldsFb}
                WHERE name = ? AND branch_id = ? AND admin_id = ?
            `, queryParamsFb);

            if (updateResult.affectedRows === 0) {
                let finalCategoryId = null;
                if (item.category_name && item.category_name.trim() !== '') {
                    // Check if category exists
                    const [catRows] = await db.query(
                        'SELECT id FROM categories WHERE admin_id = ? AND branch_id = ? AND name = ? LIMIT 1',
                        [adminId, item.branch_id, item.category_name]
                    );
                    if (catRows.length > 0) {
                        finalCategoryId = catRows[0].id;
                    } else {
                        // Create it
                        const [insertCat] = await db.execute(
                            'INSERT INTO categories (admin_id, branch_id, name, type) VALUES (?, ?, ?, "sales")',
                            [adminId, item.branch_id, item.category_name]
                        );
                        finalCategoryId = insertCat.insertId;
                    }
                }

                await db.execute(`
                    INSERT INTO sales_inventory (admin_id, branch_id, name, quantity, category_id, purchase_price, wholesale_price, price, hsn_code, gst_rate)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    adminId, 
                    item.branch_id, 
                    item.product_name, 
                    valid_quantity, 
                    finalCategoryId,
                    item.net_rate || 0,
                    item.net_rate || 0,
                    item.rate || 0,
                    item.hsn || '',
                    item.gst || 0
                ]);
            }

            const [invRows] = await db.query(
                `SELECT id, quantity FROM sales_inventory WHERE name = ? AND branch_id = ? AND admin_id = ? LIMIT 1`, 
                [item.product_name, item.branch_id, adminId]
            );

            if (invRows.length > 0) {
                 await db.execute(`
                    INSERT INTO stock_log (admin_id, branch_id, item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason)
                    VALUES (?, ?, ?, 'sales', ?, 'in', ?, ?, ?)
                 `, [adminId, item.branch_id, invRows[0].id, item.product_name, valid_quantity, invRows[0].quantity, 'GRN Push to Stock']);
            }

            await db.execute('UPDATE grn_items SET pushed_to_stock = TRUE WHERE id = ?', [itemId]);
        }

        await db.query('COMMIT');
        res.json({ success: true, message: 'Items pushed to stock successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error pushing to stock:', error);
        res.status(500).json({ success: false, message: 'Error pushing items to stock' });
    }
};

// ================= DAMAGED & RETURNS ================= //

// Get Damaged Items
exports.getDamagedItems = async (req, res) => {
    const adminId = req.user.id;
    try {
        const query = `
            SELECT 
                gi.id as grn_item_id,
                gi.product_name as item_name,
                gi.damaged_quantity,
                gi.return_status,
                gi.return_date,
                g.grn_number,
                g.grn_date,
                g.supplier_name,
                b.name as branch_name
            FROM grn_items gi
            JOIN grns g ON gi.grn_id = g.id
            LEFT JOIN branches b ON g.branch_id = b.id
            WHERE g.admin_id = ? AND gi.damaged_quantity > 0
            ORDER BY g.grn_date DESC
        `;
        const [items] = await db.query(query, [adminId]);
        res.json({ success: true, damagedItems: items });
    } catch (error) {
        console.error('Error fetching damaged items:', error);
        res.status(500).json({ success: false, message: 'Error fetching damaged items' });
    }
};

// Process Return
exports.processReturn = async (req, res) => {
    const adminId = req.user.id;
    const { id } = req.params; // grn_item_id

    try {
        // Verify ownership and existence
        const [rows] = await db.query(`
            SELECT gi.id 
            FROM grn_items gi 
            JOIN grns g ON gi.grn_id = g.id 
            WHERE gi.id = ? AND g.admin_id = ?
        `, [id, adminId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found or unauthorized' });
        }

        const returnDate = new Date().toISOString().split('T')[0];
        await db.execute(`
            UPDATE grn_items 
            SET return_status = 'Returned', return_date = ? 
            WHERE id = ?
        `, [returnDate, id]);

        res.json({ success: true, message: 'Item marked as returned successfully', returnDate });
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ success: false, message: 'Error processing return' });
    }
};
