const db = require('./config/db');

async function updateDb() {
    try {
        console.log("Adding wholesale_print_size to pos_settings...");
        await db.query(`
            ALTER TABLE pos_settings 
            ADD COLUMN wholesale_print_size VARCHAR(50) DEFAULT 'A4' AFTER print_size
        `);
        console.log("wholesale_print_size column added to pos_settings.");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("wholesale_print_size column already exists.");
        } else {
            console.error("Error adding wholesale_print_size:", err);
        }
    }
    process.exit();
}

updateDb();
