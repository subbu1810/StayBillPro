const db = require('./config/db');

async function seedData() {
    try {
        console.log("Fetching admin and branch...");
        const [admins] = await db.query("SELECT id FROM admins LIMIT 1");
        if (admins.length === 0) {
            console.log("No admins found!");
            process.exit(1);
        }
        const adminId = admins[0].id;

        const [branches] = await db.query("SELECT id FROM branches WHERE admin_id = ? LIMIT 1", [adminId]);
        if (branches.length === 0) {
            console.log("No branches found!");
            process.exit(1);
        }
        const branchId = branches[0].id;

        console.log(`Using Admin ID: ${adminId}, Branch ID: ${branchId}`);

        // Insert Dummy Invoice (Outward Tax)
        await db.query(`
            INSERT INTO invoices (admin_id, branch_id, customer_name, total_amount, gst_amount, status, created_at)
            VALUES (?, ?, 'Dummy Customer A', 1000.00, 180.00, 'paid', NOW())
        `, [adminId, branchId]);

        await db.query(`
            INSERT INTO invoices (admin_id, branch_id, customer_name, total_amount, gst_amount, status, created_at)
            VALUES (?, ?, 'Dummy Customer B', 500.00, 90.00, 'paid', NOW())
        `, [adminId, branchId]);

        // Insert Dummy Purchase (Inward Tax)
        await db.query(`
            INSERT INTO purchases (admin_id, branch_id, supplier_name, bill_number, total_amount, gst_amount, purchase_date, created_at)
            VALUES (?, ?, 'Dummy Supplier X', 'BILL-001', 800.00, 144.00, NOW(), NOW())
        `, [adminId, branchId]);

        console.log("Dummy invoices and purchases inserted successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding data:", err);
        process.exit(1);
    }
}

seedData();
