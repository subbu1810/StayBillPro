const db = require('./config/db');

async function reseedJobs() {
    try {
        console.log("Seeding service_requests and service_jobs...");

        // Admin 3, Branch 1, Customer 1, Technician 1, Appliance 1
        const adminId = 3;
        const branchId = 1;
        const customerId = 1;
        const technicianId = 1;
        const applianceId = 1;

        // Make sure foreign key entities exist
        await db.query(`INSERT IGNORE INTO customers (id, admin_id, name, mobile) VALUES (?, ?, 'John Doe', '9876543210')`, [customerId, adminId]);
        await db.query(`INSERT IGNORE INTO technicians (id, admin_id, name, phone, specialization) VALUES (?, ?, 'Tech Mike', '1122334455', 'AC Repair')`, [technicianId, adminId]);
        await db.query(`INSERT IGNORE INTO appliances (id, admin_id, name, brand, model) VALUES (?, ?, 'AC', 'LG', 'Split 1.5T')`, [applianceId, adminId]);

        // Insert service requests
        const [sr1] = await db.query(`
            INSERT INTO service_requests (branch_id, appliance_id, issue_description, service_date, service_type, status, technician_name)
            VALUES (?, ?, 'Not cooling', CURDATE(), 'repair', 'pending', 'Tech Mike')
        `, [branchId, applianceId]);

        const [sr2] = await db.query(`
            INSERT INTO service_requests (branch_id, appliance_id, issue_description, service_date, service_type, status, technician_name)
            VALUES (?, ?, 'Noise issue', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'repair', 'in_progress', 'Tech Mike')
        `, [branchId, applianceId]);

        // Insert jobs
        await db.query(`
            INSERT INTO service_jobs (branch_id, job_number, service_request_id, technician_id, user_id, scheduled_date, status, priority, job_description)
            VALUES 
            (?, 'JOB-2001', ?, ?, ?, CURDATE(), 'pending', 'high', 'Not cooling'),
            (?, 'JOB-2002', ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'in_progress', 'medium', 'Noise issue')
        `, [branchId, sr1.insertId, technicianId, adminId, branchId, sr2.insertId, technicianId, adminId]);

        console.log("Dummy jobs seeded successfully for the calendar!");
    } catch (e) {
        console.error("Error seeding jobs:", e);
    } finally {
        process.exit();
    }
}

reseedJobs();
