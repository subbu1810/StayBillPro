const db = require('../config/db');

// Get all transfers
exports.getAllTransfers = async (req, res) => {
    try {
        const adminId = req.user.id;
        const [transfers] = await db.query(
            `SELECT t.*, p.name as product_name, p.sku as product_sku,
                    fb.name as from_branch_name, tb.name as to_branch_name
             FROM stock_transfers t
             JOIN sales_inventory p ON t.product_id = p.id
             JOIN branches fb ON t.from_branch_id = fb.id
             JOIN branches tb ON t.to_branch_id = tb.id
             WHERE t.admin_id = ?
             ORDER BY t.transfer_date DESC`,
             [adminId]
        );
        res.json(transfers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching transfers", error: error.message });
    }
};

// Initiate a new transfer (PENDING stage - stock deducted and reserved)
exports.createTransfer = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const adminId = req.user.id;
        const { from_branch_id, to_branch_id, product_id, quantity, notes } = req.body;

        if (from_branch_id === to_branch_id) {
            return res.status(400).json({ message: "Source and destination branches must be different" });
        }

        // 1. Get source product details
        const [sourceProducts] = await connection.query(
            'SELECT * FROM sales_inventory WHERE id = ? AND branch_id = ? AND admin_id = ?',
            [product_id, from_branch_id, adminId]
        );

        if (sourceProducts.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Product not found in source branch" });
        }

        const sourceProduct = sourceProducts[0];

        if (sourceProduct.quantity < quantity) {
            await connection.rollback();
            return res.status(400).json({ message: "Insufficient stock in source branch" });
        }

        // 2. Deduct from source branch immediately to reserve the stock
        await connection.query(
            'UPDATE sales_inventory SET quantity = quantity - ? WHERE id = ?',
            [quantity, product_id]
        );

        // 3. Log the transfer as PENDING
        const [transferResult] = await connection.query(
            `INSERT INTO stock_transfers (
                admin_id, from_branch_id, to_branch_id, product_id, quantity, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
            [adminId, from_branch_id, to_branch_id, product_id, quantity, notes]
        );

        // 4. Add Outgoing Stock Log for the source branch
        await connection.query(
            `INSERT INTO stock_log (admin_id, branch_id, item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason)
             VALUES (?, ?, ?, 'sales', ?, 'out', ?, ?, ?)`,
            [adminId, from_branch_id, product_id, sourceProduct.name, quantity, sourceProduct.quantity - quantity, `Stock reserved (Transfer ID: #${transferResult.insertId})`]
        );

        await connection.commit();
        res.status(201).json({ message: "Stock transfer initiated successfully", transferId: transferResult.insertId });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Error transferring stock", error: error.message });
    } finally {
        connection.release();
    }
};

// Handle Lifecycle Transition (PENDING -> IN_TRANSIT -> COMPLETED / CANCELLED)
exports.updateTransferStatus = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const adminId = req.user.id;
        const { id } = req.params;
        const { status, reason } = req.body; // IN_TRANSIT, COMPLETED, CANCELLED, reason (for cancellations)

        const validStatuses = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            await connection.rollback();
            return res.status(400).json({ message: "Invalid status transition" });
        }

        // 1. Fetch current transfer details
        const [transfers] = await connection.query(
            'SELECT * FROM stock_transfers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );

        if (transfers.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Transfer record not found" });
        }

        const transfer = transfers[0];

        // Prevent updating final states
        if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
            await connection.rollback();
            return res.status(400).json({ message: `Cannot modify a transfer that is already ${transfer.status}` });
        }

        if (status === 'COMPLETED') {
            // Destination received the stock! Update target inventory
            const [sourceProducts] = await connection.query(
                'SELECT * FROM sales_inventory WHERE id = ?',
                [transfer.product_id]
            );

            if (sourceProducts.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: "Original product details not found" });
            }

            const sourceProduct = sourceProducts[0];

            // Find or Create product entry in destination branch
            let targetProductId;
            const [targetProducts] = await connection.query(
                'SELECT id FROM sales_inventory WHERE name = ? AND branch_id = ? AND admin_id = ?',
                [sourceProduct.name, transfer.to_branch_id, adminId]
            );

            if (targetProducts.length > 0) {
                targetProductId = targetProducts[0].id;
                // Add quantity to target
                await connection.query(
                    'UPDATE sales_inventory SET quantity = quantity + ? WHERE id = ?',
                    [transfer.quantity, targetProductId]
                );
            } else {
                // Create new inventory row in destination branch
                const [newProductResult] = await connection.query(
                    `INSERT INTO sales_inventory (
                        admin_id, branch_id, category_id, name, brand, sku, 
                        price, quantity, status, hsn_code, gst_rate, 
                        purchase_price, dimensions
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        adminId, transfer.to_branch_id, sourceProduct.category_id, 
                        sourceProduct.name, sourceProduct.brand, sourceProduct.sku,
                        sourceProduct.price, transfer.quantity, 'available', 
                        sourceProduct.hsn_code, sourceProduct.gst_rate,
                        sourceProduct.purchase_price, sourceProduct.dimensions
                    ]
                );
                targetProductId = newProductResult.insertId;
            }

            // Get resulting quantity for target branch log
            const [targetQtyCheck] = await connection.query('SELECT quantity FROM sales_inventory WHERE id = ?', [targetProductId]);
            const targetQty = targetQtyCheck[0].quantity;

            // Log incoming stock in destination branch log
            await connection.query(
                `INSERT INTO stock_log (admin_id, branch_id, item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason)
                 VALUES (?, ?, ?, 'sales', ?, 'in', ?, ?, ?)`,
                [adminId, transfer.to_branch_id, targetProductId, sourceProduct.name, transfer.quantity, targetQty, `Received from Branch ID: ${transfer.from_branch_id} (Transfer ID: #${transfer.id})`]
            );

        } else if (status === 'CANCELLED') {
            // Cancelled! Return the stock to the source branch
            const [sourceProducts] = await connection.query(
                'SELECT * FROM sales_inventory WHERE id = ?',
                [transfer.product_id]
            );

            if (sourceProducts.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: "Original source product not found to return stock" });
            }

            const sourceProduct = sourceProducts[0];

            await connection.query(
                'UPDATE sales_inventory SET quantity = quantity + ? WHERE id = ?',
                [transfer.quantity, transfer.product_id]
            );

            // Log returned stock with reason
            await connection.query(
                `INSERT INTO stock_log (admin_id, branch_id, item_id, item_type, item_name, change_type, quantity_changed, resulting_quantity, reason)
                 VALUES (?, ?, ?, 'sales', ?, 'in', ?, ?, ?)`,
                [adminId, transfer.from_branch_id, transfer.product_id, sourceProduct.name, transfer.quantity, sourceProduct.quantity + transfer.quantity, `Stock returned - Cancelled Transfer ID: #${transfer.id} (Reason: ${reason || 'No reason specified'})`]
            );
        }

        // 2. Update transfer status and append cancellation reason to transfer notes
        const updatedNotes = status === 'CANCELLED' 
            ? (transfer.notes ? `${transfer.notes}\n[CANCELLED: ${reason || 'No reason specified'}]` : `[CANCELLED: ${reason || 'No reason specified'}]`)
            : transfer.notes;

        await connection.query(
            'UPDATE stock_transfers SET status = ?, notes = ? WHERE id = ?',
            [status, updatedNotes, id]
        );

        await connection.commit();
        res.json({ message: `Stock transfer marked as ${status} successfully` });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Error updating transfer lifecycle status", error: error.message });
    } finally {
        connection.release();
    }
};
