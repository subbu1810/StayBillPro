const db = require('../config/db');

// Helper: convert empty string to null
const nullIfEmpty = (val) => (val === '' || val === undefined ? null : val);

// GET all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const adminId = req.user.id;
        const [suppliers] = await db.query(
            `SELECT * FROM suppliers WHERE admin_id = ? ORDER BY created_at DESC`,
            [adminId]
        );
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
    }
};

// POST create a new supplier
exports.createSupplier = async (req, res) => {
    try {
        const adminId = req.user.id;
        const {
            supplier_code, supplier_name, contact_person, mobile, alternate_mobile,
            email, website, address_line1, address_line2, city, state, pincode, country,
            gstin, pan_no, business_type, registration_no, opening_balance, balance_type,
            credit_limit, payment_terms_days
        } = req.body;

        if (!supplier_name || !mobile) {
            return res.status(400).json({ message: 'Supplier name and mobile number are required' });
        }

        const [result] = await db.query(
            `INSERT INTO suppliers 
             (admin_id, supplier_code, supplier_name, contact_person, mobile, alternate_mobile,
              email, website, address_line1, address_line2, city, state, pincode, country,
              gstin, pan_no, business_type, registration_no, opening_balance, balance_type,
              credit_limit, payment_terms_days)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId,
                nullIfEmpty(supplier_code),
                supplier_name.trim(),
                nullIfEmpty(contact_person),
                mobile,
                nullIfEmpty(alternate_mobile),
                nullIfEmpty(email),
                nullIfEmpty(website),
                nullIfEmpty(address_line1),
                nullIfEmpty(address_line2),
                nullIfEmpty(city),
                nullIfEmpty(state),
                nullIfEmpty(pincode),
                country || 'India',
                nullIfEmpty(gstin),
                nullIfEmpty(pan_no),
                business_type || 'Manufacturer',
                nullIfEmpty(registration_no),
                opening_balance || 0.00,
                balance_type || 'Payable',
                credit_limit || 0.00,
                payment_terms_days || 0
            ]
        );

        res.status(201).json({ message: 'Supplier registered successfully', id: result.insertId });
    } catch (error) {
        console.error('Error registering supplier:', error);
        res.status(500).json({ message: 'Error registering supplier', error: error.message });
    }
};

// PUT update a supplier
exports.updateSupplier = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const {
            supplier_code, supplier_name, contact_person, mobile, alternate_mobile,
            email, website, address_line1, address_line2, city, state, pincode, country,
            gstin, pan_no, business_type, registration_no, opening_balance, balance_type,
            credit_limit, payment_terms_days
        } = req.body;

        const [existing] = await db.query(
            'SELECT id FROM suppliers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        await db.query(
            `UPDATE suppliers SET
             supplier_code = ?, supplier_name = ?, contact_person = ?, mobile = ?, alternate_mobile = ?,
             email = ?, website = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?, pincode = ?, country = ?,
             gstin = ?, pan_no = ?, business_type = ?, registration_no = ?, opening_balance = ?, balance_type = ?,
             credit_limit = ?, payment_terms_days = ?
             WHERE id = ? AND admin_id = ?`,
            [
                nullIfEmpty(supplier_code),
                supplier_name.trim(),
                nullIfEmpty(contact_person),
                mobile,
                nullIfEmpty(alternate_mobile),
                nullIfEmpty(email),
                nullIfEmpty(website),
                nullIfEmpty(address_line1),
                nullIfEmpty(address_line2),
                nullIfEmpty(city),
                nullIfEmpty(state),
                nullIfEmpty(pincode),
                country || 'India',
                nullIfEmpty(gstin),
                nullIfEmpty(pan_no),
                business_type || 'Manufacturer',
                nullIfEmpty(registration_no),
                opening_balance || 0.00,
                balance_type || 'Payable',
                credit_limit || 0.00,
                payment_terms_days || 0,
                id,
                adminId
            ]
        );

        res.json({ message: 'Supplier profile updated successfully' });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ message: 'Error updating supplier', error: error.message });
    }
};

// DELETE a supplier
exports.deleteSupplier = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        await db.query(
            'DELETE FROM suppliers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );

        res.json({ message: 'Supplier profile deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ message: 'Error deleting supplier', error: error.message });
    }
};

// GET supplier dues and payments
exports.getSupplierDues = async (req, res) => {
    try {
        const adminId = req.user.id;

        // Fetch all suppliers
        const [suppliers] = await db.query(
            'SELECT * FROM suppliers WHERE admin_id = ? ORDER BY supplier_name ASC',
            [adminId]
        );

        // Fetch purchases to calculate total billed amounts
        const [purchases] = await db.query(
            'SELECT supplier_name, total_amount, purchase_date FROM purchases WHERE admin_id = ?',
            [adminId]
        );

        // Fetch payments made to suppliers
        const [payments] = await db.query(
            'SELECT supplier_name, amount, payment_date FROM supplier_payments WHERE admin_id = ?',
            [adminId]
        );

        let totalOutstanding = 0;
        let next7DaysPayable = 0;
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const supplierDues = suppliers.map(supplier => {
            // Opening balance
            let openingBalance = parseFloat(supplier.opening_balance) || 0;
            if (supplier.balance_type === 'Receivable') {
                openingBalance = -openingBalance;
            }

            // Total purchased from this supplier
            const supplierPurchases = purchases.filter(p => p.supplier_name === supplier.supplier_name);
            const totalPurchased = supplierPurchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);

            // Total paid to this supplier
            const supplierPayments = payments.filter(p => p.supplier_name === supplier.supplier_name);
            const totalPaid = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

            const totalDue = openingBalance + totalPurchased - totalPaid;

            // Determine if payment is due soon based on payment_terms_days
            let overdueAmount = 0;
            let upcomingAmount = 0;

            const termsDays = parseInt(supplier.payment_terms_days) || 0;

            supplierPurchases.forEach(p => {
                const purchaseDate = new Date(p.purchase_date);
                const dueDate = new Date(purchaseDate.getTime() + termsDays * 24 * 60 * 60 * 1000);
                
                // Assuming older purchases are paid first, we could do an exact FIFO allocation, 
                // but a simpler approach is estimating overdue/upcoming proportionally or just checking 
                // if total unpaid purchases fall in those buckets. For simplicity, we assign the remaining due 
                // to the oldest invoices first (FIFO).
            });

            // For a precise overdue calculation, we would use FIFO on invoices. 
            // Here is a basic FIFO implementation to find overdue and upcoming dues:
            let remainingDue = totalDue;
            
            // Sort purchases oldest first
            const sortedPurchases = supplierPurchases.sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));

            // We allocate the "paid" amount (totalPurchased - totalDue + openingBalance) to the oldest purchases first
            // Actually, remainingDue = Total outstanding. Let's trace it back from newest to oldest to see which invoices are unpaid.
            const sortedPurchasesDesc = [...sortedPurchases].reverse();
            let unpaidInvoices = [];
            
            let tempDue = remainingDue;
            for (let p of sortedPurchasesDesc) {
                if (tempDue <= 0) break;
                const pAmount = parseFloat(p.total_amount);
                const unpaidOnThis = Math.min(pAmount, tempDue);
                
                const pDate = new Date(p.purchase_date);
                const dueDate = new Date(pDate.getTime() + termsDays * 24 * 60 * 60 * 1000);
                
                unpaidInvoices.push({
                    amount: unpaidOnThis,
                    dueDate: dueDate
                });
                
                tempDue -= unpaidOnThis;
            }
            
            // If there's still tempDue left, it's from the opening balance
            if (tempDue > 0) {
                // Assume opening balance is immediately due if it's payable
                unpaidInvoices.push({
                    amount: tempDue,
                    dueDate: new Date(supplier.created_at) // Or asOfDate
                });
            }

            unpaidInvoices.forEach(inv => {
                if (inv.dueDate < now) {
                    overdueAmount += inv.amount;
                } else if (inv.dueDate >= now && inv.dueDate <= next7Days) {
                    upcomingAmount += inv.amount;
                }
            });

            // Find last payment date
            let lastPaymentDate = null;
            if (supplierPayments.length > 0) {
                const sortedPayments = supplierPayments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
                lastPaymentDate = sortedPayments[0].payment_date;
            }

            if (totalDue > 0) {
                totalOutstanding += totalDue;
                next7DaysPayable += upcomingAmount;
            }

            return {
                id: supplier.id,
                supplier_name: supplier.supplier_name,
                total_due: totalDue,
                overdue_amount: overdueAmount,
                next_7_days: upcomingAmount,
                credit_days: termsDays,
                last_payment: lastPaymentDate
            };
        });

        // Filter to only return suppliers with actual dues or recent activity
        const activeSuppliers = supplierDues.filter(s => s.total_due !== 0 || s.last_payment !== null);

        res.json({
            success: true,
            summary: {
                total_outstanding: totalOutstanding,
                next_7_days_payable: next7DaysPayable,
                supplier_count: supplierDues.filter(s => s.total_due > 0).length
            },
            suppliers: activeSuppliers
        });

    } catch (error) {
        console.error('Error calculating supplier dues:', error);
        res.status(500).json({ success: false, message: 'Error calculating supplier dues' });
    }
};

// POST record a payment to a supplier
exports.addSupplierPayment = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { supplier_name, amount, payment_date, payment_method, reference_no, notes } = req.body;

        if (!supplier_name || !amount) {
            return res.status(400).json({ success: false, message: 'Supplier name and amount are required' });
        }

        const [result] = await db.query(
            `INSERT INTO supplier_payments 
             (admin_id, supplier_name, amount, payment_date, payment_method, reference_no, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId,
                supplier_name,
                parseFloat(amount),
                payment_date || new Date(),
                payment_method || 'Cash',
                reference_no || null,
                notes || null
            ]
        );

        res.status(201).json({ success: true, message: 'Payment recorded successfully', payment_id: result.insertId });

    } catch (error) {
        console.error('Error recording supplier payment:', error);
        res.status(500).json({ success: false, message: 'Error recording supplier payment' });
    }
};
