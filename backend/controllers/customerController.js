const db = require('../config/db');

// Helper: convert empty string to null
const nullIfEmpty = (val) => (val === '' || val === undefined ? null : val);

// GET all customers for the logged-in admin
exports.getAllCustomers = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        // Fetch customers
        const [customers] = await db.query(
            `SELECT * FROM customers WHERE admin_id = ? ORDER BY created_at DESC`,
            [adminId]
        );

        // Calculate dynamic balances based on invoices + openingBalance
        for (let customer of customers) {
            const [invoices] = await db.query(
                `SELECT total_amount, status FROM invoices WHERE admin_id = ? AND customer_phone = ?`,
                [adminId, customer.mobile]
            );
            
            const openingBalance = Number(customer.openingBalance || 0);
            const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
            const totalPaid = invoices
                .filter(inv => inv.status === 'paid')
                .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

            // Outstanding balance = Opening + Total Sales - Total Paid
            customer.balance = openingBalance + totalSales - totalPaid;
        }

        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Error fetching customers', error: error.message });
    }
};

// POST create a new customer
exports.createCustomer = async (req, res) => {
    try {
        const adminId = req.user.id;
        const {
            firstName, first_name,
            lastName, last_name,
            email,
            mobile, phone,
            category, customerType, customer_type,
            gstin, state, billingAddress, shippingAddress, sameAsBilling,
            creditLimit, balanceType, asOfDate, openingBalance
        } = req.body;

        // Accept both camelCase (from frontend) and snake_case
        const resolvedName       = (firstName || first_name || '') + ' ' + (lastName || last_name || '');
        const resolvedMobile     = mobile || phone;
        const resolvedType       = customerType || customer_type || 'Consumer';

        if (!resolvedName.trim() || !resolvedMobile) {
            return res.status(400).json({ message: 'First name and mobile are required' });
        }

        // Check for duplicate phone under same admin
        const [existing] = await db.query(
            'SELECT id FROM customers WHERE admin_id = ? AND mobile = ?',
            [adminId, resolvedMobile]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'A customer with this mobile number already exists' });
        }

        const [result] = await db.query(
            `INSERT INTO customers 
             (admin_id, name, email, mobile, category, customerType, gstin, state, billingAddress, shippingAddress, sameAsBilling, openingBalance, balanceType, asOfDate, creditLimit)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId,
                resolvedName.trim(),
                nullIfEmpty(email),
                resolvedMobile,
                category || 'Retail',
                resolvedType,
                nullIfEmpty(gstin),
                nullIfEmpty(state),
                nullIfEmpty(billingAddress),
                nullIfEmpty(shippingAddress),
                sameAsBilling !== undefined ? sameAsBilling : 1,
                openingBalance || 0.00,
                balanceType || 'receivable',
                nullIfEmpty(asOfDate),
                nullIfEmpty(creditLimit)
            ]
        );

        res.status(201).json({ message: 'Customer created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ message: 'Error creating customer', error: error.message });
    }
};

// PUT update a customer
exports.updateCustomer = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const {
            firstName, first_name,
            lastName, last_name,
            email,
            mobile, phone,
            category, customerType, customer_type,
            gstin, state, billingAddress, shippingAddress, sameAsBilling,
            creditLimit, balanceType, asOfDate, openingBalance
        } = req.body;

        const resolvedName       = (firstName || first_name || '') + ' ' + (lastName || last_name || '');
        const resolvedMobile     = mobile || phone;
        const resolvedType       = customerType || customer_type || 'Consumer';

        const [existing] = await db.query(
            'SELECT id FROM customers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        await db.query(
            `UPDATE customers SET
             name = ?, email = ?, mobile = ?, category = ?, customerType = ?,
             gstin = ?, state = ?, billingAddress = ?, shippingAddress = ?, sameAsBilling = ?,
             openingBalance = ?, balanceType = ?, asOfDate = ?, creditLimit = ?
             WHERE id = ? AND admin_id = ?`,
            [
                resolvedName.trim(),
                nullIfEmpty(email),
                resolvedMobile,
                category || 'Retail',
                resolvedType,
                nullIfEmpty(gstin),
                nullIfEmpty(state),
                nullIfEmpty(billingAddress),
                nullIfEmpty(shippingAddress),
                sameAsBilling !== undefined ? sameAsBilling : 1,
                openingBalance || 0.00,
                balanceType || 'receivable',
                nullIfEmpty(asOfDate),
                nullIfEmpty(creditLimit),
                id,
                adminId,
            ]
        );

        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Error updating customer', error: error.message });
    }
};

// DELETE a customer
exports.deleteCustomer = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        await db.query(
            'DELETE FROM customers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Error deleting customer', error: error.message });
    }
};


// GET customer ledger — full statement with running balance
exports.getCustomerLedger = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { from, to } = req.query;  // optional date filters

        // 1. Fetch customer and admin profile details
        const [customers] = await db.query(
            'SELECT * FROM customers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );
        if (customers.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        const customer = customers[0];

        const [adminRows] = await db.query(
            'SELECT business_name, admin_name, email, phone, address, city, state, pincode, gst_number FROM admins WHERE id = ?',
            [adminId]
        );
        const adminProfile = adminRows[0] || null;

        // 2. Build date filter clause
        let dateClause = '';
        const dateParams = [adminId, customer.mobile];
        if (from) {
            dateClause += ' AND DATE(created_at) >= ?';
            dateParams.push(from);
        }
        if (to) {
            dateClause += ' AND DATE(created_at) <= ?';
            dateParams.push(to);
        }

        // 3. Fetch invoices for this customer (matched by phone)
        const [invoices] = await db.query(
            `SELECT i.*, 
                    GROUP_CONCAT(ii.item_name ORDER BY ii.id SEPARATOR ', ') AS items_summary
             FROM invoices i
             LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
             WHERE i.admin_id = ? AND i.customer_phone = ?
             ${dateClause}
             GROUP BY i.id
             ORDER BY i.created_at ASC`,
            dateParams
        );

        // 4. Calculate summary figures
        const openingBalance = Number(customer.openingBalance || 0);
        const totalSales     = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        const totalPaid      = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        const totalPending   = invoices
            .filter(inv => inv.status === 'pending')
            .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        const totalDiscount  = invoices.reduce((sum, inv) => sum + Number(inv.discount_amount || 0), 0);
        const totalGst       = invoices.reduce((sum, inv) => sum + Number(inv.gst_amount || 0), 0);

        // Current dues = opening balance + total sales - total paid
        const currentDues = openingBalance + totalSales - totalPaid;

        // 5. Build ledger rows with running balance
        let runningBalance = openingBalance;

        // Opening balance entry (if any)
        const ledgerRows = [];
        if (openingBalance !== 0) {
            ledgerRows.push({
                date: customer.asOfDate || customer.created_at,
                type: 'opening',
                description: 'Opening Balance',
                invoiceNo: null,
                debit: openingBalance > 0 ? openingBalance : 0,
                credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
                balance: openingBalance,
                status: null,
                paymentMethod: null,
            });
        }

        // Invoice rows
        invoices.forEach(inv => {
            const amount = Number(inv.total_amount || 0);
            if (inv.status === 'paid') {
                // Paid invoice: debit (sale) then credit (payment) — net zero
                runningBalance += amount;
                ledgerRows.push({
                    date: inv.created_at,
                    type: 'sale',
                    description: inv.items_summary ? `Invoice — ${inv.items_summary}` : 'Invoice',
                    invoiceNo: `INV-${String(inv.id).padStart(4, '0')}`,
                    debit: amount,
                    credit: 0,
                    balance: runningBalance,
                    status: inv.status,
                    paymentMethod: inv.payment_method,
                });
                runningBalance -= amount; // payment received
                ledgerRows.push({
                    date: inv.created_at,
                    type: 'payment',
                    description: `Payment received (${inv.payment_method || 'cash'})`,
                    invoiceNo: `INV-${String(inv.id).padStart(4, '0')}`,
                    debit: 0,
                    credit: amount,
                    balance: runningBalance,
                    status: inv.status,
                    paymentMethod: inv.payment_method,
                });
            } else if (inv.status === 'pending') {
                runningBalance += amount;
                ledgerRows.push({
                    date: inv.created_at,
                    type: 'sale',
                    description: inv.items_summary ? `Invoice — ${inv.items_summary}` : 'Invoice',
                    invoiceNo: `INV-${String(inv.id).padStart(4, '0')}`,
                    debit: amount,
                    credit: 0,
                    balance: runningBalance,
                    status: inv.status,
                    paymentMethod: inv.payment_method,
                });
            } else if (inv.status === 'cancelled') {
                ledgerRows.push({
                    date: inv.created_at,
                    type: 'cancelled',
                    description: 'Invoice Cancelled',
                    invoiceNo: `INV-${String(inv.id).padStart(4, '0')}`,
                    debit: 0,
                    credit: 0,
                    balance: runningBalance,
                    status: inv.status,
                    paymentMethod: null,
                });
            }
        });

        // 6. Send response
        res.json({
            customer,
            admin: adminProfile,
            ledgerRows,
            invoices,
            summary: {
                openingBalance,
                totalSales,
                totalPaid,
                totalPending,
                totalDiscount,
                totalGst,
                currentDues,
                totalInvoices: invoices.length,
                paidInvoices: invoices.filter(i => i.status === 'paid').length,
                pendingInvoices: invoices.filter(i => i.status === 'pending').length,
            }
        });

    } catch (error) {
        console.error('Error fetching customer ledger:', error);
        res.status(500).json({ message: 'Error fetching customer ledger', error: error.message });
    }
};

// POST send customer ledger statement via Email
exports.sendCustomerLedgerEmail = async (req, res) => {
    try {
        const nodemailer = require('nodemailer');
        const adminId = req.user.id;
        const { id } = req.params;
        const { from, to } = req.body; // optional date filters

        // 1. Fetch customer details
        const [customers] = await db.query(
            'SELECT * FROM customers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );
        if (customers.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        const customer = customers[0];
        if (!customer.email) {
            return res.status(400).json({ message: 'Customer does not have an email address configured.' });
        }

        // 2. Fetch ledger details (similar to getCustomerLedger)
        let dateClause = '';
        const dateParams = [adminId, customer.mobile];
        if (from) {
            dateClause += ' AND DATE(created_at) >= ?';
            dateParams.push(from);
        }
        if (to) {
            dateClause += ' AND DATE(created_at) <= ?';
            dateParams.push(to);
        }

        const [invoices] = await db.query(
            `SELECT i.*, 
                    GROUP_CONCAT(ii.item_name ORDER BY ii.id SEPARATOR ', ') AS items_summary
             FROM invoices i
             LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
             WHERE i.admin_id = ? AND i.customer_phone = ?
             ${dateClause}
             GROUP BY i.id
             ORDER BY i.created_at ASC`,
            dateParams
        );

        const openingBalance = Number(customer.openingBalance || 0);
        const totalSales     = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        const totalPaid      = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        const currentDues   = openingBalance + totalSales - totalPaid;

        // 3. Format Currency
        const fmt = (n) => `INR ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        // 4. Create Nodemailer Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 5. Build HTML Email Body
        const subject = `Ledger Statement - ${customer.name}`;
        
        let rowsHtml = '';
        if (openingBalance !== 0) {
            rowsHtml += `
              <tr style="background-color: #eff6ff;">
                <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(customer.asOfDate || customer.created_at).toLocaleDateString('en-IN')}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold;">OPENING</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px;">Opening Balance</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; color: #c2410c;">${openingBalance > 0 ? fmt(openingBalance) : '—'}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; color: #15803d;">${openingBalance < 0 ? fmt(Math.abs(openingBalance)) : '—'}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-weight: bold;">${fmt(openingBalance)}</td>
              </tr>
            `;
        }

        let runningBalance = openingBalance;
        invoices.forEach(inv => {
            const amount = Number(inv.total_amount || 0);
            if (inv.status === 'paid') {
                runningBalance += amount;
                rowsHtml += `
                  <tr>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #c2410c;">SALE</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">Invoice INV-${String(inv.id).padStart(4, '0')}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; color: #c2410c;">${fmt(amount)}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">—</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-weight: bold;">${fmt(runningBalance)}</td>
                  </tr>
                `;
                runningBalance -= amount;
                rowsHtml += `
                  <tr style="background-color: #f0fdf4;">
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #15803d;">PAYMENT</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">Payment received (${inv.payment_method || 'cash'})</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">—</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; color: #15803d;">${fmt(amount)}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-weight: bold;">${fmt(runningBalance)}</td>
                  </tr>
                `;
            } else if (inv.status === 'pending') {
                runningBalance += amount;
                rowsHtml += `
                  <tr>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #c2410c;">SALE</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">Invoice INV-${String(inv.id).padStart(4, '0')}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; color: #c2410c;">${fmt(amount)}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">—</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-weight: bold;">${fmt(runningBalance)}</td>
                  </tr>
                `;
            }
        });

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #111;">Customer Ledger Statement</h2>
            <hr style="border: none; border-top: 1px solid #ddd; margin-bottom: 20px;" />
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 4px 0;"><strong>Customer Name:</strong> ${customer.name}</td>
                <td style="padding: 4px 0; text-align: right;"><strong>Statement Date:</strong> ${new Date().toLocaleDateString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Mobile:</strong> ${customer.mobile || '—'}</td>
                <td style="padding: 4px 0; text-align: right;"><strong>GSTIN:</strong> ${customer.gstin || '—'}</td>
              </tr>
            </table>

            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
              <div style="flex: 1; border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; background: #fafafa;">
                <div style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: bold;">Opening Balance</div>
                <div style="font-size: 16px; font-weight: bold; color: #3b82f6;">${fmt(openingBalance)}</div>
              </div>
              <div style="flex: 1; border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; background: #fafafa;">
                <div style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: bold;">Total Sales</div>
                <div style="font-size: 16px; font-weight: bold; color: #c2410c;">${fmt(totalSales)}</div>
              </div>
              <div style="flex: 1; border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; background: #fafafa;">
                <div style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: bold;">Total Paid</div>
                <div style="font-size: 16px; font-weight: bold; color: #15803d;">${fmt(totalPaid)}</div>
              </div>
              <div style="flex: 1; border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; background: #fafafa;">
                <div style="font-size: 11px; color: #888; text-transform: uppercase; font-weight: bold;">Current Dues</div>
                <div style="font-size: 16px; font-weight: bold; color: ${currentDues > 0 ? '#dc2626' : '#10b981'};">${fmt(currentDues)}</div>
              </div>
            </div>

            <h3 style="margin-top: 30px; color: #444;">Transaction History</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
              <thead>
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #ddd;">
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Date</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Type</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Description</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Debit (Dr)</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Credit (Cr)</th>
                  <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="6" style="padding: 10px; text-align: center; color: #999;">No transaction logs.</td></tr>'}
              </tbody>
            </table>

            <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
              This is a system generated statement. Thank you for your business. <br /><strong>StayBillPro</strong>
            </div>
          </div>
        `;

        // 6. Send the Email
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"StayBillPro" <${process.env.EMAIL_USER}>`,
            to: customer.email,
            subject: subject,
            html: htmlBody,
        });

        res.json({ message: 'Ledger statement email sent successfully!' });

    } catch (error) {
        console.error('Error sending ledger email:', error);
        res.status(500).json({ message: 'Error sending ledger email', error: error.message });
    }
};

// GET customers payment history (Paid invoices list across customers)
exports.getCustomerPayments = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { customerId, from, to } = req.query;

        let query = `
            SELECT i.id AS invoice_id, i.customer_name, i.customer_phone, i.total_amount, i.payment_method, i.created_at, c.id AS customer_id
            FROM invoices i
            LEFT JOIN customers c ON c.mobile = i.customer_phone AND c.admin_id = i.admin_id
            WHERE i.admin_id = ? AND i.status = 'paid'
        `;
        const params = [adminId];

        if (customerId) {
            query += ` AND c.id = ?`;
            params.push(customerId);
        }
        if (from) {
            query += ` AND DATE(i.created_at) >= ?`;
            params.push(from);
        }
        if (to) {
            query += ` AND DATE(i.created_at) <= ?`;
            params.push(to);
        }

        query += ` ORDER BY i.created_at DESC`;

        const [payments] = await db.query(query, params);
        res.json(payments);

    } catch (error) {
        console.error('Error fetching payments history:', error);
        res.status(500).json({ message: 'Error fetching payments history', error: error.message });
    }
};

