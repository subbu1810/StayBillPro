const db = require('../config/db');

// ATTENDANCE LOGIC

// Get attendance for a specific date
exports.getAttendance = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { date } = req.query;

        if (!date) return res.status(400).json({ message: 'Date is required' });

        // Get all staff for this admin
        const [staffMembers] = await db.execute(
            `SELECT id, admin_name as name FROM admins WHERE parent_admin_id = ?`,
            [adminId]
        );

        // Get attendance records for this date
        const [attendanceRecords] = await db.execute(
            `SELECT * FROM staff_attendance WHERE admin_id = ? AND date = ?`,
            [adminId, date]
        );

        // Map attendance to staff
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
            attendanceMap[record.staff_id] = record;
        });

        const result = staffMembers.map(staff => ({
            staff_id: staff.id,
            name: staff.name,
            status: attendanceMap[staff.id]?.status || 'Absent',
            check_in: attendanceMap[staff.id]?.check_in || '09:00:00',
            check_out: attendanceMap[staff.id]?.check_out || '18:30:00',
            work_hours: attendanceMap[staff.id] ? 9.5 : 0
        }));

        res.json({ success: true, date, attendance: result });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

// Mark all staff as Present for a specific date
exports.markAllPresent = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { date } = req.body;

        if (!date) return res.status(400).json({ message: 'Date is required' });

        // Get all staff for this admin
        const [staffMembers] = await db.execute(
            `SELECT id FROM admins WHERE parent_admin_id = ?`,
            [adminId]
        );

        if (staffMembers.length === 0) {
            return res.status(400).json({ message: 'No staff members found' });
        }

        // Insert or Update logic using ON DUPLICATE KEY UPDATE
        const values = staffMembers.map(staff => [
            adminId, staff.id, date, 'Present', '09:00:00', '18:30:00'
        ]);

        await db.query(
            `INSERT INTO staff_attendance (admin_id, staff_id, date, status, check_in, check_out) 
             VALUES ? 
             ON DUPLICATE KEY UPDATE status = 'Present', check_in = '09:00:00', check_out = '18:30:00'`,
            [values]
        );

        res.json({ success: true, message: 'All staff marked as present.' });
    } catch (error) {
        console.error('Error marking all present:', error);
        res.status(500).json({ message: 'Error updating attendance', error: error.message });
    }
};

// Update attendance for a single staff member
exports.updateAttendance = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { staff_id, date, status, check_in, check_out } = req.body;

        if (!staff_id || !date || !status) {
            return res.status(400).json({ message: 'Staff ID, Date, and Status are required' });
        }

        await db.execute(
            `INSERT INTO staff_attendance (admin_id, staff_id, date, status, check_in, check_out) 
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                status = VALUES(status), 
                check_in = VALUES(check_in), 
                check_out = VALUES(check_out)`,
            [adminId, staff_id, date, status, check_in || null, check_out || null]
        );

        res.json({ success: true, message: 'Attendance updated successfully.' });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ message: 'Error updating attendance', error: error.message });
    }
};


// PAYROLL LOGIC

// Get payroll for a specific month
exports.getPayroll = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { month } = req.query; // Format: 'YYYY-MM'

        if (!month) return res.status(400).json({ message: 'Month is required' });

        // Fetch all staff and their base salary
        const [staffMembers] = await db.execute(
            `SELECT id, admin_name as name, base_salary FROM admins WHERE parent_admin_id = ?`,
            [adminId]
        );

        // Fetch existing payroll records for this month
        const [payrollRecords] = await db.execute(
            `SELECT * FROM staff_payroll WHERE admin_id = ? AND month = ?`,
            [adminId, month]
        );

        const payrollMap = {};
        payrollRecords.forEach(record => {
            payrollMap[record.staff_id] = record;
        });

        // Merge existing payroll with staff, setting defaults if no payroll record exists yet
        const result = staffMembers.map(staff => {
            const existing = payrollMap[staff.id];
            
            const baseSalary = existing ? parseFloat(existing.base_salary) : parseFloat(staff.base_salary || 0);
            const allowances = existing ? parseFloat(existing.allowances) : 0;
            const deductions = existing ? parseFloat(existing.deductions) : 0;
            const netPayable = existing ? parseFloat(existing.net_payable) : (baseSalary + allowances - deductions);
            
            return {
                id: existing ? existing.id : `draft_${staff.id}`,
                staff_id: staff.id,
                name: staff.name,
                base_salary: baseSalary,
                allowances: allowances,
                deductions: deductions,
                net_payable: netPayable,
                status: existing ? existing.status : 'Pending'
            };
        });

        res.json({ success: true, month, payroll: result });
    } catch (error) {
        console.error('Error fetching payroll:', error);
        res.status(500).json({ message: 'Error fetching payroll', error: error.message });
    }
};

// Save a payroll draft (Pending)
exports.savePayrollDraft = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { staff_id, month, base_salary, allowances, deductions, net_payable } = req.body;

        if (!staff_id || !month) return res.status(400).json({ message: 'Staff ID and month are required' });

        await db.execute(
            `INSERT INTO staff_payroll (admin_id, staff_id, month, base_salary, allowances, deductions, net_payable, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
             ON DUPLICATE KEY UPDATE 
                base_salary = VALUES(base_salary),
                allowances = VALUES(allowances),
                deductions = VALUES(deductions),
                net_payable = VALUES(net_payable)`,
            [adminId, staff_id, month, base_salary, allowances, deductions, net_payable]
        );

        res.json({ success: true, message: 'Payroll draft saved successfully.' });
    } catch (error) {
        console.error('Error saving payroll draft:', error);
        res.status(500).json({ message: 'Error saving payroll draft', error: error.message });
    }
};

// Process a payroll payment (Full / Partial / Final Salary)
exports.processPayment = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { staff_id, month, base_salary, allowances, deductions, net_payable, payment_mode, payment_date, remarks } = req.body;

        if (!staff_id || !month) return res.status(400).json({ message: 'Staff ID and month are required' });

        // Ensure salary_payments table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS staff_salary_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                staff_id INT NOT NULL,
                month VARCHAR(20) NOT NULL,
                payment_type ENUM('salary', 'advance') DEFAULT 'salary',
                base_salary DECIMAL(15, 2) DEFAULT 0.00,
                allowances DECIMAL(15, 2) DEFAULT 0.00,
                deductions DECIMAL(15, 2) DEFAULT 0.00,
                amount_paid DECIMAL(15, 2) NOT NULL,
                payment_mode VARCHAR(50) DEFAULT 'bank',
                payment_date DATE NOT NULL,
                remarks VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const pDate = payment_date || new Date().toISOString().split('T')[0];

        // 1. Insert distinct payment transaction record
        await db.execute(
            `INSERT INTO staff_salary_payments (admin_id, staff_id, month, payment_type, base_salary, allowances, deductions, amount_paid, payment_mode, payment_date, remarks)
             VALUES (?, ?, ?, 'salary', ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, staff_id, month, base_salary || 0, allowances || 0, deductions || 0, net_payable, payment_mode || 'bank', pDate, remarks || null]
        );

        // 2. Update monthly snapshot table
        await db.execute(
            `INSERT INTO staff_payroll (admin_id, staff_id, month, base_salary, allowances, deductions, net_payable, status, payment_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Paid', ?) 
             ON DUPLICATE KEY UPDATE 
                status = 'Paid', 
                base_salary = VALUES(base_salary),
                allowances = VALUES(allowances),
                deductions = VALUES(deductions),
                net_payable = VALUES(net_payable),
                payment_date = VALUES(payment_date)`,
            [adminId, staff_id, month, base_salary || 0, allowances || 0, deductions || 0, net_payable, pDate]
        );

        res.json({ success: true, message: 'Salary payment recorded successfully.' });
    } catch (error) {
        console.error('Error processing payroll payment:', error);
        res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
};

// Record an Advance Payment as an individual payment entry
exports.recordAdvancePayment = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { staff_id, month, amount, payment_mode, date, remarks } = req.body;

        if (!staff_id || !amount) return res.status(400).json({ message: 'Staff ID and amount are required' });

        // Ensure table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS staff_salary_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                staff_id INT NOT NULL,
                month VARCHAR(20) NOT NULL,
                payment_type ENUM('salary', 'advance') DEFAULT 'salary',
                base_salary DECIMAL(15, 2) DEFAULT 0.00,
                allowances DECIMAL(15, 2) DEFAULT 0.00,
                deductions DECIMAL(15, 2) DEFAULT 0.00,
                amount_paid DECIMAL(15, 2) NOT NULL,
                payment_mode VARCHAR(50) DEFAULT 'cash',
                payment_date DATE NOT NULL,
                remarks VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const pDate = date || new Date().toISOString().split('T')[0];
        const mth = month || pDate.slice(0, 7);

        await db.execute(
            `INSERT INTO staff_salary_payments (admin_id, staff_id, month, payment_type, base_salary, allowances, deductions, amount_paid, payment_mode, payment_date, remarks)
             VALUES (?, ?, ?, 'advance', 0, 0, ?, ?, ?, ?, ?)`,
            [adminId, staff_id, mth, amount, amount, payment_mode || 'cash', pDate, remarks || 'Salary Advance']
        );

        res.json({ success: true, message: 'Advance payment recorded successfully.' });
    } catch (error) {
        console.error('Error recording advance:', error);
        res.status(500).json({ message: 'Error recording advance', error: error.message });
    }
};

// Get full payment & advance transaction history (every individual payment transaction)
exports.getPayrollHistory = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { staff_id, from_month, to_month } = req.query;

        // Check if individual transaction table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS staff_salary_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                staff_id INT NOT NULL,
                month VARCHAR(20) NOT NULL,
                payment_type ENUM('salary', 'advance') DEFAULT 'salary',
                base_salary DECIMAL(15, 2) DEFAULT 0.00,
                allowances DECIMAL(15, 2) DEFAULT 0.00,
                deductions DECIMAL(15, 2) DEFAULT 0.00,
                amount_paid DECIMAL(15, 2) NOT NULL,
                payment_mode VARCHAR(50) DEFAULT 'bank',
                payment_date DATE NOT NULL,
                remarks VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check count of transactions in staff_salary_payments
        const [txnCount] = await db.execute(`SELECT COUNT(*) as cnt FROM staff_salary_payments WHERE admin_id = ?`, [adminId]);
        
        let records = [];
        if (txnCount[0].cnt > 0) {
            let query = `
                SELECT ssp.id, ssp.month, ssp.payment_type, ssp.base_salary, ssp.allowances, ssp.deductions, 
                       ssp.amount_paid as net_payable, 'Paid' as status, ssp.payment_date, ssp.payment_mode, ssp.remarks,
                       a.admin_name as name, a.id as staff_id
                FROM staff_salary_payments ssp
                JOIN admins a ON a.id = ssp.staff_id
                WHERE ssp.admin_id = ?
            `;
            const params = [adminId];

            if (staff_id) { query += ` AND ssp.staff_id = ?`; params.push(staff_id); }
            if (from_month) { query += ` AND ssp.month >= ?`; params.push(from_month); }
            if (to_month) { query += ` AND ssp.month <= ?`; params.push(to_month); }

            query += ` ORDER BY ssp.payment_date DESC, ssp.id DESC`;
            const [rows] = await db.execute(query, params);
            records = rows;
        } else {
            // Fallback for existing legacy records in staff_payroll
            let query = `
                SELECT sp.id, sp.month, 'salary' as payment_type, sp.base_salary, sp.allowances, sp.deductions, 
                       sp.net_payable, sp.status, sp.payment_date, 'bank' as payment_mode, NULL as remarks,
                       a.admin_name as name, a.id as staff_id
                FROM staff_payroll sp
                JOIN admins a ON a.id = sp.staff_id
                WHERE sp.admin_id = ? AND sp.status = 'Paid'
            `;
            const params = [adminId];

            if (staff_id) { query += ` AND sp.staff_id = ?`; params.push(staff_id); }
            if (from_month) { query += ` AND sp.month >= ?`; params.push(from_month); }
            if (to_month) { query += ` AND sp.month <= ?`; params.push(to_month); }

            query += ` ORDER BY sp.month DESC, a.admin_name ASC`;
            const [rows] = await db.execute(query, params);
            records = rows;
        }

        const totalDisbursed = records.reduce((acc, r) => acc + parseFloat(r.net_payable || 0), 0);

        res.json({ success: true, history: records, totalDisbursed });
    } catch (error) {
        console.error('Error fetching payroll history:', error);
        res.status(500).json({ message: 'Error fetching payroll history', error: error.message });
    }
};
