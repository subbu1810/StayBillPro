const db = require('./config/db');

async function updateDb() {
    try {
        await db.query(`
            ALTER TABLE admins 
            ADD COLUMN scan_wallet_balance DECIMAL(10,2) DEFAULT 0.00 AFTER current_plan,
            ADD COLUMN last_wallet_recharge_date DATE DEFAULT NULL AFTER scan_wallet_balance;
        `);
        console.log("Successfully added wallet columns to admins table.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist. Skipping.");
        } else {
            console.error("Error updating DB:", err);
        }
    } finally {
        process.exit();
    }
}

updateDb();
