const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'staybillpro',
        multipleStatements: true
    });

    try {
        console.log('Dropping old appliances table...');
        await connection.query('DROP TABLE IF EXISTS appliances;');
        
        console.log('Creating new appliances table...');
        const createQuery = `
            CREATE TABLE IF NOT EXISTS appliances (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                branch_id INT,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                brand VARCHAR(100),
                model VARCHAR(100),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
                FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
            );
        `;
        await connection.query(createQuery);
        console.log('Successfully updated appliances table!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

run();
