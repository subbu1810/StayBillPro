const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    console.log("Connecting to the database...");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'staybillpro'
    });

    console.log("Connected.");

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS units (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
                UNIQUE KEY unique_admin_unit (admin_id, name)
            )
        `);
        console.log("Created units table.");

        try {
            await connection.query(`ALTER TABLE sales_inventory ADD COLUMN unit VARCHAR(50) DEFAULT NULL AFTER hsn_code`);
            console.log("Added unit to sales_inventory.");
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("unit column already exists in sales_inventory.");
            else throw e;
        }

        try {
            await connection.query(`ALTER TABLE service_inventory ADD COLUMN unit VARCHAR(50) DEFAULT NULL AFTER hsn_code`);
            console.log("Added unit to service_inventory.");
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("unit column already exists in service_inventory.");
            else throw e;
        }

        console.log("Database update complete.");
    } catch (e) {
        console.error("Error updating database:", e);
    } finally {
        await connection.end();
    }
}

main();
