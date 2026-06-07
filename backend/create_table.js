const db = require('./config/db');

async function createTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                type ENUM('recharge', 'deduction', 'auto_recharge') NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                description VARCHAR(255),
                reference_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
            )
        `);
        console.log('Table created successfully');
    } catch (e) {
        console.error('Error creating table:', e);
    } finally {
        process.exit();
    }
}

createTable();
