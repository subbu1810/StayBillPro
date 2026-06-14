require('dotenv').config({path: './backend/.env'});
const db = require('./backend/config/db');

async function test() {
    try {
        const [rows] = await db.query('SELECT id, name, quantity FROM sales_inventory WHERE name LIKE "%Gorilla%" OR name LIKE "%Stick File FS%"');
        console.log("Sales Inventory:", rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
