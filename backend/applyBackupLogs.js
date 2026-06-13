const mysql = require('mysql2/promise');
require('dotenv').config();

async function createBackupLogsTable() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('Applying backup_logs table...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS backup_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                download_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                system_info VARCHAR(255),
                ip_address VARCHAR(45),
                file_name VARCHAR(255),
                FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
            )
        `);

        console.log('Successfully created backup_logs table!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

createBackupLogsTable();
