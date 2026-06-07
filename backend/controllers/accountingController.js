const db = require('../config/db');

// Get Ledger Entries (Filtered by Business, Branch, and Type)
exports.getLedger = async (req, res) => {
    const { branchId, accountType, startDate, endDate } = req.query;
    const adminId = req.user.id; // From authMiddleware (parent_admin_id or superadmin id)

    try {
        let query = `
            SELECT * FROM ledger 
            WHERE admin_id = ? 
        `;
        let params = [adminId];

        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }

        if (accountType) {
            query += ' AND account_type = ?';
            params.push(accountType);
        }

        if (startDate && endDate) {
            query += ' AND transaction_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY transaction_date ASC, created_at ASC';

        const [entries] = await db.execute(query, params);
        res.json(entries);
    } catch (error) {
        console.error('Error fetching ledger:', error);
        res.status(500).json({ message: 'Error fetching ledger entries', error: error.message });
    }
};

// Add Ledger Entry
exports.addEntry = async (req, res) => {
    const { 
        branch_id, 
        account_type, 
        transaction_type, 
        voucher_no, 
        particulars, 
        amount, 
        transaction_date 
    } = req.body;
    
    const adminId = req.user.id;

    if (!branch_id || !account_type || !transaction_type || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get current balance for this branch and account type
        const [lastEntry] = await conn.execute(
            'SELECT balance FROM ledger WHERE admin_id = ? AND branch_id = ? AND account_type = ? ORDER BY transaction_date DESC, created_at DESC LIMIT 1',
            [adminId, branch_id, account_type]
        );

        let currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].balance) : 0;
        let newBalance = transaction_type === 'receipt' || transaction_type === 'initial' 
            ? currentBalance + parseFloat(amount) 
            : currentBalance - parseFloat(amount);

        // 2. Insert new entry
        const [result] = await conn.execute(
            `INSERT INTO ledger (admin_id, branch_id, account_type, transaction_type, voucher_no, particulars, amount, balance, transaction_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, branch_id, account_type, transaction_type, voucher_no, particulars, amount, newBalance, transaction_date || new Date()]
        );

        await conn.commit();
        res.status(201).json({ 
            message: 'Entry added successfully', 
            id: result.insertId,
            balance: newBalance 
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error adding ledger entry:', error);
        res.status(500).json({ message: 'Error adding ledger entry', error: error.message });
    } finally {
        conn.release();
    }
};

// Get Summary
exports.getSummary = async (req, res) => {
    const adminId = req.user.id;
    const { branchId } = req.query;

    try {
        let cashQuery = 'SELECT balance FROM ledger WHERE admin_id = ? AND account_type = "cash"';
        let bankQuery = 'SELECT balance FROM ledger WHERE admin_id = ? AND account_type = "bank"';
        let params = [adminId];

        if (branchId) {
            cashQuery += ' AND branch_id = ?';
            bankQuery += ' AND branch_id = ?';
            params.push(branchId);
        }

        cashQuery += ' ORDER BY transaction_date DESC, created_at DESC LIMIT 1';
        bankQuery += ' ORDER BY transaction_date DESC, created_at DESC LIMIT 1';

        const [cashResult] = await db.execute(cashQuery, params);
        const [bankResult] = await db.execute(bankQuery, params);

        res.json({
            cashBalance: cashResult.length > 0 ? cashResult[0].balance : 0,
            bankBalance: bankResult.length > 0 ? bankResult[0].balance : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching accounting summary' });
    }
};

// Get Profit & Loss Data
exports.getProfitLoss = async (req, res) => {
    const { branchId, startDate, endDate } = req.query;
    const adminId = req.user.id;

    try {
        let invoiceQuery = 'SELECT SUM(total_amount - gst_amount) as salesRevenue FROM invoices WHERE admin_id = ? AND status = "paid"';
        let expenseQuery = 'SELECT SUM(amount) as totalExpenses FROM expenses WHERE admin_id = ?';
        let params = [adminId];

        if (branchId) {
            invoiceQuery += ' AND branch_id = ?';
            expenseQuery += ' AND branch_id = ?';
            params.push(branchId);
        }

        const [invoiceResult] = await db.execute(invoiceQuery, params);
        const [expenseResult] = await db.execute(expenseQuery, params);

        // Get expense breakdown by category
        let breakdownQuery = 'SELECT category, SUM(amount) as total FROM expenses WHERE admin_id = ?';
        let breakdownParams = [adminId];
        if (branchId) {
            breakdownQuery += ' AND branch_id = ?';
            breakdownParams.push(branchId);
        }
        breakdownQuery += ' GROUP BY category';
        const [breakdown] = await db.execute(breakdownQuery, breakdownParams);

        const salesRevenue = parseFloat(invoiceResult[0].salesRevenue || 0);
        const totalExpenses = parseFloat(expenseResult[0].totalExpenses || 0);
        const netProfit = salesRevenue - totalExpenses;

        res.json({
            income: {
                salesRevenue,
                serviceIncome: 0, 
                totalIncome: salesRevenue
            },
            expenses: {
                totalExpenses,
                breakdown
            },
            netProfit
        });
    } catch (error) {
        console.error('Error fetching P&L:', error);
        res.status(500).json({ message: 'Error calculating Profit & Loss' });
    }
};

// Get GST Summary Data
exports.getGSTSummary = async (req, res) => {
    const { branchId } = req.query;
    const adminId = req.user.id;

    try {
        let salesGSTQuery = 'SELECT SUM(gst_amount) as outwardGST FROM invoices WHERE admin_id = ? AND status = "paid"';
        let purchaseGSTQuery = 'SELECT SUM(gst_amount) as inwardGST FROM purchases WHERE admin_id = ?';
        let params = [adminId];

        if (branchId) {
            salesGSTQuery += ' AND branch_id = ?';
            purchaseGSTQuery += ' AND branch_id = ?';
            params.push(branchId);
        }

        const [salesResult] = await db.execute(salesGSTQuery, params);
        const [purchaseResult] = await db.execute(purchaseGSTQuery, params);

        const outwardGST = parseFloat(salesResult[0].outwardGST || 0);
        const inwardGST = parseFloat(purchaseResult[0].inwardGST || 0);
        const netPayable = outwardGST - inwardGST;

        res.json({
            outwardGST,
            inwardGST,
            netPayable,
            lastFiled: 'MAR-2026', 
            filedDate: '10-Apr'
        });
    } catch (error) {
        console.error('Error fetching GST summary:', error);
        res.status(500).json({ message: 'Error calculating GST summary' });
    }
};

// Get GSTR-1 Data (Sales)
exports.getGSTR1Data = async (req, res) => {
    const { branchId } = req.query;
    const adminId = req.user.id;

    try {
        // Fetch business GSTIN and state code from POS settings
        const [posSettings] = await db.execute(
            'SELECT gstin, shop_name FROM pos_settings WHERE admin_id = ? LIMIT 1',
            [adminId]
        );
        const businessGSTIN = posSettings[0]?.gstin || 'NOT_SET';
        const shopName = posSettings[0]?.shop_name || '';

        // Derive state code from GSTIN (first 2 chars)
        const stateCode = businessGSTIN.length >= 2 ? businessGSTIN.substring(0, 2) : '29';

        let query = `
            SELECT 
                i.created_at as invoiceDate,
                CONCAT('INV-', LPAD(i.id, 4, '0')) as invoiceNo,
                i.customer_name,
                'N/A' as customerGSTIN,
                ROUND((i.total_amount - i.gst_amount), 2) as taxableVal,
                ROUND((i.gst_amount / 2), 2) as cgst,
                ROUND((i.gst_amount / 2), 2) as sgst,
                0 as igst,
                i.gst_amount as totalGST,
                i.total_amount as invoiceValue
            FROM invoices i
            WHERE i.admin_id = ? AND i.status = 'paid'
        `;
        let params = [adminId];

        if (branchId) {
            query += ' AND i.branch_id = ?';
            params.push(branchId);
        }

        query += ' ORDER BY i.created_at DESC';

        const [invoices] = await db.execute(query, params);

        // Return invoices along with business metadata needed for JSON generation
        res.json({
            businessGSTIN,
            shopName,
            stateCode,
            invoices
        });
    } catch (error) {
        console.error('Error fetching GSTR-1 data:', error);
        res.status(500).json({ message: 'Error fetching GSTR-1 data' });
    }
};
