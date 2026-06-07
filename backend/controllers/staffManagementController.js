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

// Process a payroll payment
exports.processPayment = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { staff_id, month, base_salary, allowances, deductions, net_payable } = req.body;

        if (!staff_id || !month) return res.status(400).json({ message: 'Staff ID and month are required' });

        await db.execute(
            `INSERT INTO staff_payroll (admin_id, staff_id, month, base_salary, allowances, deductions, net_payable, status, payment_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Paid', NOW())
             ON DUPLICATE KEY UPDATE 
                status = 'Paid', 
                base_salary = VALUES(base_salary),
                allowances = VALUES(allowances),
                deductions = VALUES(deductions),
                net_payable = VALUES(net_payable),
                payment_date = NOW()`,
            [adminId, staff_id, month, base_salary, allowances, deductions, net_payable]
        );

        res.json({ success: true, message: 'Salary paid successfully.' });
    } catch (error) {
        console.error('Error processing payroll payment:', error);
        res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
};

// Get full payroll payment history (all Paid records)
exports.getPayrollHistory = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { staff_id, from_month, to_month } = req.query;

        let query = `
            SELECT sp.id, sp.month, sp.base_salary, sp.allowances, sp.deductions, 
                   sp.net_payable, sp.status, sp.payment_date,
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

        const [records] = await db.execute(query, params);

        const totalDisbursed = records.reduce((acc, r) => acc + parseFloat(r.net_payable), 0);

        res.json({ success: true, history: records, totalDisbursed });
    } catch (error) {
        console.error('Error fetching payroll history:', error);
        res.status(500).json({ message: 'Error fetching payroll history', error: error.message });
    }
};
