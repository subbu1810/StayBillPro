const db = require('../config/db');

// Get All Expenses
exports.getAllExpenses = async (req, res) => {
    const { branchId, startDate, endDate, category } = req.query;
    const adminId = req.user.id;

    try {
        let query = 'SELECT * FROM expenses WHERE admin_id = ?';
        let params = [adminId];

        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (startDate && endDate) {
            query += ' AND expense_date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY expense_date DESC, created_at DESC';

        const [expenses] = await db.execute(query, params);
        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};

// Add Expense
exports.addExpense = async (req, res) => {
    const { branch_id, category, amount, description, expense_date, payment_mode } = req.body;
    const adminId = req.user.id;

    if (!branch_id || !category || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert into expenses table
        const [expenseResult] = await conn.execute(
            'INSERT INTO expenses (admin_id, branch_id, category, amount, description, expense_date, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [adminId, branch_id, category, amount, description, expense_date || new Date(), payment_mode || 'cash']
        );

        // 2. Create Ledger Entry
        // Get last balance
        const [lastEntry] = await conn.execute(
            'SELECT balance FROM ledger WHERE admin_id = ? AND branch_id = ? AND account_type = ? ORDER BY transaction_date DESC, created_at DESC LIMIT 1',
            [adminId, branch_id, payment_mode || 'cash']
        );

        let currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].balance) : 0;
        let newBalance = currentBalance - parseFloat(amount);

        await conn.execute(
            `INSERT INTO ledger (admin_id, branch_id, account_type, transaction_type, voucher_no, particulars, amount, balance, transaction_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId, 
                branch_id, 
                payment_mode || 'cash', 
                'payment', 
                `EXP-${expenseResult.insertId}`, 
                `Expense: ${category}${description ? ` (${description})` : ''}`, 
                amount, 
                newBalance, 
                expense_date || new Date()
            ]
        );

        await conn.commit();
        res.status(201).json({ message: 'Expense recorded successfully', id: expenseResult.insertId });
    } catch (error) {
        await conn.rollback();
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Error adding expense', error: error.message });
    } finally {
        conn.release();
    }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // Note: In a real app, deleting an expense should also reverse the ledger entry.
        // For simplicity here, we just delete the expense record.
        // Usually, we would void it rather than delete.
        
        await conn.execute('DELETE FROM expenses WHERE id = ? AND admin_id = ?', [id, adminId]);
        
        await conn.commit();
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Error deleting expense' });
    } finally {
        conn.release();
    }
};
