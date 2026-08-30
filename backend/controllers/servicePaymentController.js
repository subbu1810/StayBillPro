const db = require('../config/db');

// Ensure table exists
exports.ensureTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS service_job_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_mode VARCHAR(50) DEFAULT 'cash',
                note TEXT,
                paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES service_jobs(id) ON DELETE CASCADE
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS service_ledger (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                branch_id INT NOT NULL,
                account_type VARCHAR(50),
                transaction_type VARCHAR(50),
                voucher_no VARCHAR(100),
                particulars TEXT,
                amount DECIMAL(10, 2) NOT NULL,
                balance DECIMAL(10, 2) NOT NULL,
                transaction_date DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('service_job_payments and service_ledger tables ensured.');
    } catch (e) {
        console.error('Error ensuring tables in servicePaymentController:', e);
    }
};
// GET all payments across all jobs
exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT p.*, j.job_number, c.name as customer_name, c.mobile as customer_mobile
             FROM service_job_payments p
             JOIN service_jobs j ON p.job_id = j.id
             LEFT JOIN service_requests sr ON j.service_request_id = sr.id
             LEFT JOIN customers c ON sr.customer_id = c.id
             ORDER BY p.paid_at DESC`
        );
        res.json(rows);
    } catch (e) {
        console.error('getAll error:', e);
        res.status(500).json({ error: e.message });
    }
};

// GET payment ledger (all jobs and their payment summaries)
exports.getLedger = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                j.id as job_id, 
                j.job_number, 
                j.total_cost, 
                j.status as job_status,
                j.created_at,
                c.name as customer_name, 
                c.mobile as customer_mobile,
                COALESCE(SUM(p.amount), 0) as total_paid
             FROM service_jobs j
             LEFT JOIN service_job_payments p ON j.id = p.job_id
             LEFT JOIN service_requests sr ON j.service_request_id = sr.id
             LEFT JOIN customers c ON sr.customer_id = c.id
             GROUP BY j.id, j.job_number, j.total_cost, j.status, j.created_at, c.name, c.mobile
             ORDER BY j.created_at DESC`
        );
        res.json(rows);
    } catch (e) {
        console.error('getLedger error:', e);
        res.status(500).json({ error: e.message });
    }
};

// GET all payments for a job
exports.getByJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const [rows] = await db.query(`SELECT * FROM service_job_payments WHERE job_id = ? ORDER BY paid_at DESC`, [jobId]);
        res.json(rows);
    } catch (e) {
        console.error('getByJob error:', e);
        res.status(500).json({ error: e.message });
    }
};

// GET service ledger entries
exports.getServiceLedger = async (req, res) => {
    try {
        const adminId = req.user?.id || 1;
        const { branchId, accountType } = req.query;
        let query = 'SELECT * FROM service_ledger WHERE admin_id = ?';
        const params = [adminId];

        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        if (accountType) {
            query += ' AND account_type = ?';
            params.push(accountType);
        }
        
        query += ' ORDER BY transaction_date DESC, created_at DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (e) {
        console.error('getServiceLedger error:', e);
        res.status(500).json({ error: e.message });
    }
};

// GET service ledger summary (balances)
exports.getServiceLedgerSummary = async (req, res) => {
    try {
        const adminId = req.user?.id || 1;
        const { branchId } = req.query;

        let cashQuery = 'SELECT balance FROM service_ledger WHERE admin_id = ? AND account_type = "cash"';
        let bankQuery = 'SELECT balance FROM service_ledger WHERE admin_id = ? AND account_type = "bank"';
        const params = [adminId];

        if (branchId) {
            cashQuery += ' AND branch_id = ?';
            bankQuery += ' AND branch_id = ?';
            params.push(branchId);
        }

        cashQuery += ' ORDER BY id DESC LIMIT 1';
        bankQuery += ' ORDER BY id DESC LIMIT 1';

        const [cashResult] = await db.query(cashQuery, params);
        const [bankResult] = await db.query(bankQuery, params);

        res.json({
            cashBalance: cashResult.length > 0 ? parseFloat(cashResult[0].balance) : 0,
            bankBalance: bankResult.length > 0 ? parseFloat(bankResult[0].balance) : 0
        });
    } catch (e) {
        console.error('getServiceLedgerSummary error:', e);
        res.status(500).json({ error: e.message });
    }
};

// POST create payment
exports.create = async (req, res) => {
    const adminId = req.user?.id || 1; 
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { jobId } = req.params;
        const { amount, payment_mode, note, paid_at } = req.body;
        if (!amount || amount <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const paidDate = paid_at || new Date().toISOString().slice(0, 19).replace('T', ' ');
        const [result] = await connection.query(
            `INSERT INTO service_job_payments (job_id, amount, payment_mode, note, paid_at) VALUES (?, ?, ?, ?, ?)`,
            [jobId, amount, payment_mode || 'cash', note || null, paidDate]
        );
        const paymentId = result.insertId;

        // Log to accounting ledger
        const [jobRows] = await connection.query(`SELECT branch_id, job_number FROM service_jobs WHERE id = ?`, [jobId]);
        if (jobRows.length > 0) {
            const branchId = jobRows[0].branch_id;
            const jobNumber = jobRows[0].job_number;
            const accountType = (payment_mode || 'cash').toLowerCase() === 'cash' ? 'cash' : 'bank';

            // Get current balance
            const [lastEntry] = await connection.query(
                `SELECT balance FROM service_ledger WHERE admin_id = ? AND branch_id = ? AND account_type = ? ORDER BY id DESC LIMIT 1`,
                [adminId, branchId, accountType]
            );
            const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].balance) : 0;
            const newBalance = currentBalance + parseFloat(amount);
            const voucherNo = `SRVPAY-${paymentId}`;
            const particulars = `Payment for Service Job #${jobNumber}${note ? ' - ' + note : ''}`;
            const txnDate = paidDate.split(' ')[0];

            await connection.query(
                `INSERT INTO service_ledger (admin_id, branch_id, account_type, transaction_type, voucher_no, particulars, amount, balance, transaction_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [adminId, branchId, accountType, 'receipt', voucherNo, particulars, amount, newBalance, txnDate]
            );
        }

        await connection.commit();
        const [rows] = await db.query(`SELECT * FROM service_job_payments WHERE id = ?`, [paymentId]);
        res.status(201).json(rows[0]);
    } catch (e) {
        await connection.rollback();
        console.error('create payment error:', e);
        res.status(500).json({ error: e.message });
    } finally {
        connection.release();
    }
};

// PUT update payment
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, payment_mode, note, paid_at } = req.body;
        await db.query(
            `UPDATE service_job_payments SET amount = ?, payment_mode = ?, note = ?, paid_at = ? WHERE id = ?`,
            [amount, payment_mode, note || null, paid_at, id]
        );
        // Note: Ledger is not updated for edits here to avoid complex balance recalculations.
        // It's recommended to void and recreate payments in rigorous accounting.
        const [rows] = await db.query(`SELECT * FROM service_job_payments WHERE id = ?`, [id]);
        res.json(rows[0]);
    } catch (e) {
        console.error('update payment error:', e);
        res.status(500).json({ error: e.message });
    }
};

// DELETE payment
exports.remove = async (req, res) => {
    const adminId = req.user?.id || 1;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        // Optionally add a reversing entry to ledger for this deleted payment
        const [payRows] = await connection.query(`SELECT * FROM service_job_payments WHERE id = ?`, [id]);
        if (payRows.length > 0) {
            const p = payRows[0];
            const [jobRows] = await connection.query(`SELECT branch_id, job_number FROM service_jobs WHERE id = ?`, [p.job_id]);
            
            if (jobRows.length > 0) {
                const branchId = jobRows[0].branch_id;
                const jobNumber = jobRows[0].job_number;
                const accountType = (p.payment_mode || 'cash').toLowerCase() === 'cash' ? 'cash' : 'bank';

                const [lastEntry] = await connection.query(
                    `SELECT balance FROM service_ledger WHERE admin_id = ? AND branch_id = ? AND account_type = ? ORDER BY id DESC LIMIT 1`,
                    [adminId, branchId, accountType]
                );
                const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].balance) : 0;
                const newBalance = currentBalance - parseFloat(p.amount);
                
                await connection.query(
                    `INSERT INTO service_ledger (admin_id, branch_id, account_type, transaction_type, voucher_no, particulars, amount, balance, transaction_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [adminId, branchId, accountType, 'payment', `REV-SRVPAY-${id}`, `Reversal for Deleted Payment (Job #${jobNumber})`, p.amount, newBalance, new Date().toISOString().split('T')[0]]
                );
            }
        }

        await connection.query(`DELETE FROM service_job_payments WHERE id = ?`, [id]);
        await connection.commit();
        res.json({ success: true });
    } catch (e) {
        await connection.rollback();
        console.error('delete payment error:', e);
        res.status(500).json({ error: e.message });
    } finally {
        connection.release();
    }
};
