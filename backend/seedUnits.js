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
        // Make admin_id nullable
        await connection.query('ALTER TABLE units MODIFY COLUMN admin_id INT NULL');
        console.log("Modified units table to allow global units (admin_id NULL).");

        const defaultUnits = [
            'BAGS (Bag)', 'BOTTLES (Btl)', 'BOX (Box)', 'BUNDLES (Bdl)', 
            'CANS (Can)', 'CARTONS (Ctn)', 'DOZENS (Dzn)', 'GRAMMES (Gm)', 
            'KILOGRAMS (Kg)', 'LITRE (Ltr)', 'METERS (Mtr)', 'MILILITRE (Ml)', 
            'NUMBERS (Nos)', 'PACKS (Pac)', 'PAIRS (Prs)', 'PIECES (Pcs)', 
            'QUINTAL (Qtl)', 'ROLLS (Rol)', 'SQUARE FEET (Sqf)', 'SQUARE METERS (Sqm)', 
            'TABLETS (Tbs)'
        ];

        for (const unit of defaultUnits) {
            try {
                await connection.query(
                    'INSERT INTO units (admin_id, name) VALUES (NULL, ?)',
                    [unit]
                );
            } catch (e) {
                // Ignore duplicates
                if (e.code !== 'ER_DUP_ENTRY') {
                    console.error("Error inserting", unit, e);
                }
            }
        }
        
        console.log("Inserted default units.");
    } catch (e) {
        console.error("Error updating database:", e);
    } finally {
        await connection.end();
    }
}

main();
