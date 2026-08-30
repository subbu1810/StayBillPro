const db = require('../config/db');

// Create Invoice (POS Billing)
exports.createInvoice = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const adminId = req.user.id;
        const {
            customerId,
            customerName,
            customerPhone,
            items,
            totalAmount,
            gstAmount,
            discountAmount,
            paymentMethod,
            invoiceType = 'pos'
        } = req.body;

        console.log('Creating invoice with data:', { adminId, customerId, customerName, customerPhone, items, totalAmount, paymentMethod });

        // Validate required fields
        if (!items || items.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'No items in invoice' });
        }

        if (!totalAmount || totalAmount <= 0) {
            connection.release();
            return res.status(400).json({ message: 'Valid total amount is required' });
        }



        await connection.beginTransaction();

        try {
            // Get the admin's default branch (or use first branch)
            const [branches] = await connection.execute(
                `SELECT id FROM branches WHERE admin_id = ? LIMIT 1`,
                [adminId]
            );

            if (branches.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: 'No branch found for this admin' });
            }

            const branchId = branches[0].id;

            const status = paymentMethod === 'credit' ? 'pending' : 'paid';

            // Insert invoice
            const [invoiceResult] = await connection.execute(
                `INSERT INTO invoices (admin_id, branch_id, customer_name, customer_phone, total_amount, gst_amount, discount_amount, payment_method, status, invoice_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [adminId, branchId, customerName || 'Walk-in', customerPhone || '', totalAmount, gstAmount || 0, discountAmount || 0, paymentMethod, status, invoiceType]
            );

            const invoiceId = invoiceResult.insertId;

            // Insert invoice items
            for (const item of items) {
                await connection.execute(
                    `INSERT INTO invoice_items (invoice_id, product_id, item_name, quantity, unit_price, total_price, gst_rate)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [invoiceId, item.id || null, item.name, item.qty, item.price, item.price * item.qty, item.gst || item.gst_rate || 0]
                );

                // Update stock if product_id exists
                if (item.id) {
                    await connection.execute(
                        `UPDATE sales_inventory SET quantity = quantity - ? WHERE id = ? AND admin_id = ?`,
                        [item.qty, item.id, adminId]
                    );
                }
            }

            // Update customer balance if customer_id exists
            if (customerId) {
                await connection.execute(
                    `UPDATE customers SET balance = balance + ? WHERE id = ? AND admin_id = ?`,
                    [totalAmount, customerId, adminId]
                );
            }

            // Record entry in ledger if paid via cash, upi, card, or bank transfer
            if (['cash', 'upi', 'card', 'bank', 'bank_transfer'].includes(paymentMethod.toLowerCase())) {
                const accountType = paymentMethod.toLowerCase() === 'cash' ? 'cash' : 'bank';
                
                // Get current balance
                const [lastEntry] = await connection.execute(
                    `SELECT balance FROM ledger 
                     WHERE admin_id = ? AND branch_id = ? AND account_type = ? 
                     ORDER BY id DESC LIMIT 1`,
                    [adminId, branchId, accountType]
                );
                
                const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].balance) : 0;
                const newBalance = currentBalance + parseFloat(totalAmount);
                const voucherNo = `POSINV${String(invoiceId).padStart(2, '0')}`;
                const particulars = `Sales Invoice #${invoiceId} - ${customerName || 'Walk-in'}`;
                const txnDate = new Date().toISOString().split('T')[0];

                await connection.execute(
                    `INSERT INTO ledger (admin_id, branch_id, account_type, transaction_type, voucher_no, particulars, amount, balance, transaction_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [adminId, branchId, accountType, 'receipt', voucherNo, particulars, totalAmount, newBalance, txnDate]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Invoice created successfully',
                invoiceId,
                invoice: {
                    id: invoiceId,
                    customerName: customerName || 'Walk-in',
                    customerPhone: customerPhone || '',
                    totalAmount,
                    gstAmount: gstAmount || 0,
                    discountAmount: discountAmount || 0,
                    paymentMethod,
                    status: status,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Error creating invoice', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Get Invoice by ID
exports.getInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const adminId = 1;

        const [invoices] = await db.execute(
            `SELECT * FROM invoices WHERE id = ? AND admin_id = ?`,
            [invoiceId, adminId]
        );

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const [items] = await db.execute(
            `SELECT * FROM invoice_items WHERE invoice_id = ?`,
            [invoiceId]
        );

        res.json({
            invoice: invoices[0],
            items
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
};

// Get all invoices for admin (with optional filters including branchId)
exports.getAllInvoices = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { startDate, endDate, status, branchId } = req.query;

        let query = `SELECT * FROM invoices WHERE admin_id = ?`;
        const params = [adminId];

        if (startDate && endDate) {
            query += ` AND created_at BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }

        if (branchId) {
            query += ` AND branch_id = ?`;
            params.push(branchId);
        }

        query += ` ORDER BY created_at DESC LIMIT 100`;

        const [invoices] = await db.execute(query, params);

        res.json({
            count: invoices.length,
            invoices
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
};

// Get daily sales summary
exports.getDailySummary = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { date } = req.query;

        const queryDate = date || new Date().toISOString().split('T')[0];

        const [summary] = await db.execute(
            `SELECT 
                COUNT(*) as total_invoices,
                COALESCE(SUM(total_amount), 0) as total_sales,
                COALESCE(SUM(gst_amount), 0) as total_gst,
                COALESCE(SUM(discount_amount), 0) as total_discount,
                COALESCE(AVG(total_amount), 0) as avg_invoice_value
            FROM invoices 
            WHERE admin_id = ? AND DATE(created_at) = ?`,
            [adminId, queryDate]
        );

        const [paymentMethods] = await db.execute(
            `SELECT payment_method, COUNT(*) as count, SUM(total_amount) as amount
             FROM invoices 
             WHERE admin_id = ? AND DATE(created_at) = ?
             GROUP BY payment_method`,
            [adminId, queryDate]
        );

        res.json({
            date: queryDate,
            summary: summary[0] || {},
            paymentMethods
        });
    } catch (error) {
        console.error('Error fetching daily summary:', error);
        res.status(500).json({ message: 'Error fetching summary', error: error.message });
    }
};

// Get sales report (date range)
exports.getSalesReport = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const [report] = await db.execute(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as invoices,
                SUM(total_amount) as total_sales,
                SUM(gst_amount) as total_gst,
                SUM(discount_amount) as total_discount
            FROM invoices 
            WHERE admin_id = ? AND created_at BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY date DESC`,
            [adminId, startDate, endDate]
        );

        res.json(report);
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
};

// Cancel invoice
exports.cancelInvoice = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { invoiceId } = req.params;
        const adminId = req.user.id;

        await connection.beginTransaction();

        // Get invoice
        const [invoices] = await connection.execute(
            `SELECT * FROM invoices WHERE id = ? AND admin_id = ?`,
            [invoiceId, adminId]
        );

        if (invoices.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Get invoice items
        const [items] = await connection.execute(
            `SELECT * FROM invoice_items WHERE invoice_id = ?`,
            [invoiceId]
        );

        // Reverse stock updates
        for (const item of items) {
            if (item.product_id) {
                await connection.execute(
                    `UPDATE sales_inventory SET quantity = quantity + ? WHERE id = ? AND admin_id = ?`,
                    [item.quantity, item.product_id, adminId]
                );
            }
        }

        // Update invoice status
        await connection.execute(
            `UPDATE invoices SET status = 'cancelled' WHERE id = ?`,
            [invoiceId]
        );

        await connection.commit();

        res.json({ message: 'Invoice cancelled successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling invoice:', error);
        res.status(500).json({ message: 'Error cancelling invoice', error: error.message });
    } finally {
        connection.release();
    }
};

// Get invoice statistics
exports.getStatistics = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const formattedDate = startDate.toISOString().split('T')[0];

        const [stats] = await db.execute(
            `SELECT 
                COUNT(DISTINCT DATE(created_at)) as days_with_sales,
                COUNT(*) as total_invoices,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(gst_amount), 0) as total_gst_collected,
                COALESCE(AVG(total_amount), 0) as avg_invoice_value,
                COALESCE(MAX(total_amount), 0) as highest_invoice,
                COALESCE(MIN(total_amount), 0) as lowest_invoice
            FROM invoices 
            WHERE admin_id = ? AND created_at >= ?`,
            [adminId, formattedDate]
        );

        res.json(stats[0] || {});
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
};

// Get invoices with advanced search and filters (Real-time data)
exports.searchInvoices = async (req, res) => {
    try {

        const {
            searchTerm = '',
            page = 1,
            limit = 50,
            invoiceType = '',
            status = 'all',
            paymentMethod = 'all',
            startDate = '',
            endDate = ''
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        // BASE QUERY (NO AUTH FILTER)
        let where = `WHERE 1=1`;
        let params = [];

        if (searchTerm.trim()) {
            where += `
                AND (
                    i.customer_name LIKE ?
                    OR i.customer_phone LIKE ?
                    OR i.id LIKE ?
                )
            `;
            const like = `%${searchTerm}%`;
            params.push(like, like, like);
        }

        if (invoiceType) {
            where += ` AND i.invoice_type = ? `;
            params.push(invoiceType);
        }

        if (status && status !== 'all') {
            where += ` AND i.status = ? `;
            params.push(status);
        }

        if (paymentMethod && paymentMethod !== 'all') {
            where += ` AND i.payment_method = ? `;
            params.push(paymentMethod);
        }

        if (startDate) {
            where += ` AND DATE(i.created_at) >= ? `;
            params.push(startDate);
        }

        if (endDate) {
            where += ` AND DATE(i.created_at) <= ? `;
            params.push(endDate);
        }


        // COUNT QUERY
        const countQuery = `
            SELECT COUNT(*) as total
            FROM invoices i
            ${where}
        `;

        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0]?.total || 0;

        // DATA QUERY
        const dataQuery = `
            SELECT 
                i.id,
                i.customer_name,
                i.customer_phone,
                i.total_amount,
                i.payment_method,
                i.status,
                i.created_at,
                b.name AS branch_name,
                (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) AS item_count
            FROM invoices i
            LEFT JOIN branches b ON i.branch_id = b.id
            ${where}
            ORDER BY i.created_at DESC
            LIMIT ${Number(limit)} OFFSET ${offset}
        `;

        const [rows] = await db.execute(dataQuery, params);

        return res.json({
            success: true,
            total,
            page: Number(page),
            invoices: rows
        });

    } catch (error) {
        console.log("SEARCH ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching invoices",
            error: error.message
        });
    }
};

// Get invoice details with full information
exports.getInvoiceDetails = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const adminId = req.user.id;

        const [invoices] = await db.execute(
            `SELECT i.*, b.name as branch_name, b.address as branch_address, b.phone as branch_phone,
                    b.gst_number as branch_gst, a.business_name, a.gst_number as corporate_gst
             FROM invoices i
             LEFT JOIN branches b ON i.branch_id = b.id
             LEFT JOIN admins a ON i.admin_id = a.id
             WHERE i.id = ? AND i.admin_id = ?`,
            [invoiceId, adminId]
        );

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const [items] = await db.execute(
            `SELECT ii.*,
                    COALESCE((
                        SELECT SUM(sri.quantity)
                        FROM sales_return_items sri
                        JOIN sales_returns sr ON sr.id = sri.return_id
                        WHERE sr.invoice_id = ii.invoice_id AND sri.product_id = ii.product_id
                    ), 0) as returned_qty
             FROM invoice_items ii 
             WHERE ii.invoice_id = ?`,
            [invoiceId]
        );

        res.json({
            success: true,
            invoice: invoices[0],
            items
        });
    } catch (error) {
        console.error('Error fetching invoice details:', error);
        res.status(500).json({ message: 'Error fetching invoice details', error: error.message });
    }
};

// Get today's invoices (Real-time)
exports.getTodayInvoices = async (req, res) => {
    try {
        const adminId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const [invoices] = await db.execute(
            `SELECT * FROM invoices 
             WHERE admin_id = ? AND DATE(created_at) = ?
             ORDER BY created_at DESC`,
            [adminId, today]
        );

        const invoicesWithItems = await Promise.all(
            invoices.map(async (invoice) => {
                const [items] = await db.execute(
                    `SELECT * FROM invoice_items WHERE invoice_id = ?`,
                    [invoice.id]
                );
                return { ...invoice, items };
            })
        );

        res.json({
            success: true,
            date: today,
            count: invoices.length,
            invoices: invoicesWithItems
        });
    } catch (error) {
        console.error('Error fetching today invoices:', error);
        res.status(500).json({ message: 'Error fetching today invoices', error: error.message });
    }
};

// Get invoice by number/ID with customer details
exports.getInvoiceByNumber = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { invoiceNumber } = req.params;

        const [invoices] = await db.execute(
            `SELECT i.*, b.name as branch_name
             FROM invoices i
             LEFT JOIN branches b ON i.branch_id = b.id
             WHERE i.id = ? AND i.admin_id = ?`,
            [invoiceNumber, adminId]
        );

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const [items] = await db.execute(
            `SELECT * FROM invoice_items WHERE invoice_id = ?`,
            [invoiceNumber]
        );

        res.json({
            success: true,
            invoice: invoices[0],
            items
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
};

// Reprintable invoice receipt
exports.getInvoiceReceipt = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const adminId = req.user.id;

        const [invoices] = await db.execute(
            `SELECT i.*, b.name as branch_name, b.address as branch_address, 
                    b.phone as branch_phone, b.gst_number as branch_gst,
                    a.business_name, a.gst_number
             FROM invoices i
             LEFT JOIN branches b ON i.branch_id = b.id
             LEFT JOIN admins a ON i.admin_id = a.id
             WHERE i.id = ? AND i.admin_id = ?`,
            [invoiceId, adminId]
        );

        if (invoices.length === 0) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const [items] = await db.execute(
            `SELECT * FROM invoice_items WHERE invoice_id = ?`,
            [invoiceId]
        );

        res.json({
            success: true,
            receipt: {
                invoice: invoices[0],
                items
            }
        });
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({ message: 'Error generating receipt', error: error.message });
    }
};
