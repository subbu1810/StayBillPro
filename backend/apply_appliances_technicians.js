const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'staybillpro',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    };

    const sql = `
-- Technicians Table
CREATE TABLE IF NOT EXISTS technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20) NOT NULL,
    specialization VARCHAR(255),
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Appliances Table
CREATE TABLE IF NOT EXISTS appliances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    branch_id INT,
    customer_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(150),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    warranty_status ENUM('active', 'expired', 'unknown') DEFAULT 'unknown',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);
    `;

    try {
        console.log("Connecting to the database...");
        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected successfully. Running migration...");
        await connection.query(sql);
        console.log("Migration applied successfully!");
        connection.end();
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

run();
