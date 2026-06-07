const db = require('../config/db');

// Helper to update stock based on item type
const restockItem = async (connection, productId, qty, adminId) => {
    if (!productId) return;

    // Check sales_inventory first
    const [salesExist] = await connection.execute(
        `SELECT id FROM sales_inventory WHERE id = ? AND admin_id = ?`,
        [productId, adminId]
    );
    if (salesExist.length > 0) {
        await connection.execute(
            `UPDATE sales_inventory SET quantity = quantity + ? WHERE id = ? AND admin_id = ?`,
            [qty, productId, adminId]
        );
        return;
    }

    // Check service_inventory (spares)
    const [serviceExist] = await connection.execute(
        `SELECT id FROM service_inventory WHERE id = ? AND admin_id = ?`,
        [productId, adminId]
    );
    if (serviceExist.length > 0) {
        await connection.execute(
            `UPDATE service_inventory SET quantity = quantity + ? WHERE id = ? AND admin_id = ?`,
            [qty, productId, adminId]
        );
        return;
    }
};

// Create a new sales return / refund
exports.createReturn = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const adminId = req.user.id;
        const {
            invoiceId,
            reason,
            items, // Array of { productId, quantity, unitPrice, refundPrice }
            paymentMethod
        } = req.body;

        if (!invoiceId) {
            connection.release();
            return res.status(400).json({ message: 'Invoice ID is required' });
        }

        if (!items || items.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'Returned items list is required' });
        }

        // Fetch invoice details and ensure it belongs to this admin
        const [invoices] = await connection.execute(
            `SELECT * FROM invoices WHERE id = ? AND admin_id = ?`,
            [invoiceId, adminId]
        );

        if (invoices.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoice = invoices[0];

        // Fetch original invoice items for validation
        const [invoiceItems] = await connection.execute(
            `SELECT * FROM invoice_items WHERE invoice_id = ?`,
            [invoiceId]
        );

        // Map original quantities
        const originalItemQtyMap = {};
        invoiceItems.forEach(item => {
            originalItemQtyMap[item.product_id] = item.quantity;
        });

        // Calculate total refund amount and validate quantity limits
        let totalRefundAmount = 0;
        for (const returnItem of items) {
            const originalQty = originalItemQtyMap[returnItem.productId];
            if (originalQty === undefined) {
                connection.release();
                return res.status(400).json({
                    message: `Item with product ID ${returnItem.productId} was not part of the original invoice`
                });
            }

            // Check if returned qty exceeds original qty
            if (returnItem.quantity > originalQty) {
                connection.release();
                return res.status(400).json({
                    message: `Return quantity for product ID ${returnItem.productId} exceeds the original invoice quantity of ${originalQty}`
                });
            }

            totalRefundAmount += parseFloat(returnItem.refundPrice || returnItem.unitPrice || 0) * Number(returnItem.quantity);
        }

        await connection.beginTransaction();

        try {
            // 1. Insert return record
            const [returnResult] = await connection.execute(
                `INSERT INTO sales_returns (admin_id, branch_id, invoice_id, total_refund_amount, payment_method, reason)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    adminId,
                    invoice.branch_id,
                    invoiceId,
                    totalRefundAmount,
                    paymentMethod || 'cash',
                    reason || ''
                ]
            );

            const returnId = returnResult.insertId;

            // 2. Insert return items & restock inventory
            for (const returnItem of items) {
                // Find matching item name from original invoice
                const originalItem = invoiceItems.find(ii => ii.product_id === returnItem.productId);
                const itemName = originalItem ? originalItem.item_name : 'Returned Item';

                await connection.execute(
                    `INSERT INTO sales_return_items (return_id, product_id, item_name, quantity, unit_price, refund_price)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        returnId,
                        returnItem.productId,
                        itemName,
                        returnItem.quantity,
                        returnItem.unitPrice || 0.00,
                        returnItem.refundPrice || returnItem.unitPrice || 0.00
                    ]
                );

                // Revert stock back into database
                await restockItem(connection, returnItem.productId, returnItem.quantity, adminId);
            }

            // 3. Update customer outstanding balance if credit and customer details exist
            if (invoice.payment_method === 'credit' && invoice.customer_phone) {
                // Check if customer exists in the customer registry
                const [customers] = await connection.execute(
                    `SELECT id FROM customers WHERE mobile = ? AND admin_id = ?`,
                    [invoice.customer_phone, adminId]
                );
                if (customers.length > 0) {
                    await connection.execute(
                        `UPDATE customers SET balance = balance - ? WHERE id = ? AND admin_id = ?`,
                        [totalRefundAmount, customers[0].id, adminId]
                    );
                }
            } else if (invoice.payment_method !== 'credit' && totalRefundAmount > 0) {
                // 4. Update Ledger if it was a cash/bank refund
                const accountType = paymentMethod === 'cash' ? 'cash' : 'bank';
                
                // Get current balance
                const [lastEntry] = await connection.execute(
                    'SELECT balance FROM ledger WHERE admin_id = ? AND branch_id = ? AND account_type = ? ORDER BY transaction_date DESC, created_at DESC LIMIT 1',
                    [adminId, invoice.branch_id, accountType]
                );
                
                const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].balance) : 0;
                const newBalance = currentBalance - totalRefundAmount;
                
                const particulars = `Refund for Invoice INV-${String(invoiceId).padStart(4, '0')}${reason ? ' - ' + reason : ''}`;
                
                await connection.execute(
                    `INSERT INTO ledger (admin_id, branch_id, account_type, transaction_type, voucher_no, particulars, amount, balance, transaction_date) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        adminId, 
                        invoice.branch_id, 
                        accountType, 
                        'payment',
                        `RET-${returnId}`,
                        particulars,
                        totalRefundAmount,
                        newBalance,
                        new Date()
                    ]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Sales return processed successfully',
                returnId,
                totalRefundAmount
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error creating sales return:', error);
        res.status(500).json({ message: 'Error processing return', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Get list of all returns for the logged-in admin
exports.getAllReturns = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branchId, startDate, endDate, customerId } = req.query;

        let query = `
            SELECT r.*, i.customer_name, i.customer_phone, b.name as branch_name
            FROM sales_returns r
            LEFT JOIN invoices i ON r.invoice_id = i.id
            LEFT JOIN customers c ON c.mobile = i.customer_phone AND c.admin_id = i.admin_id
            LEFT JOIN branches b ON r.branch_id = b.id
            WHERE r.admin_id = ?
        `;
        const params = [adminId];

        if (branchId) {
            query += ` AND r.branch_id = ?`;
            params.push(branchId);
        }

        if (customerId) {
            query += ` AND c.id = ?`;
            params.push(customerId);
        }

        if (startDate && endDate) {
            query += ` AND DATE(r.return_date) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY r.return_date DESC`;

        const [rows] = await db.execute(query, params);

        res.json({
            success: true,
            count: rows.length,
            returns: rows
        });
    } catch (error) {
        console.error('Error fetching returns:', error);
        res.status(500).json({ message: 'Error fetching returns', error: error.message });
    }
};

// Get details of a single return record
exports.getReturnDetails = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { returnId } = req.params;

        const [returns] = await db.execute(
            `SELECT r.*, i.customer_name, i.customer_phone, b.name as branch_name
             FROM sales_returns r
             LEFT JOIN invoices i ON r.invoice_id = i.id
             LEFT JOIN branches b ON r.branch_id = b.id
             WHERE r.id = ? AND r.admin_id = ?`,
            [returnId, adminId]
        );

        if (returns.length === 0) {
            return res.status(404).json({ message: 'Return record not found' });
        }

        const [items] = await db.execute(
            `SELECT * FROM sales_return_items WHERE return_id = ?`,
            [returnId]
        );

        res.json({
            success: true,
            return: returns[0],
            items
        });
    } catch (error) {
        console.error('Error fetching return details:', error);
        res.status(500).json({ message: 'Error fetching details', error: error.message });
    }
};
