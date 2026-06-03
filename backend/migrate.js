const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        // Connect without database first to ensure it exists
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true // Essential for running the whole .sql file
        });

        console.log('Reading database.sql...');
        const sqlPath = path.join(__dirname, 'database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL migration...');
        await connection.query(sql);

        console.log('✅ Migration successful! Database and tables are ready.');
    } catch (error) {
        console.error('❌ Migration failed:');
        console.error(error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
