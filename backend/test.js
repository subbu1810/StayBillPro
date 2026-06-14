require('dotenv').config({path: './.env'});
const db = require('./config/db');

async function test() {
    try {
        // Find all duplicates in service_inventory too
        const [all] = await db.query(`
            SELECT id, name, quantity, admin_id, branch_id,
                   REPLACE(LOWER(name), ' ', '') as normalized
            FROM service_inventory
            ORDER BY id ASC
        `);
        
        const groups = {};
        for (const r of all) {
            const key = `${r.admin_id}_${r.branch_id}_${r.normalized}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        }
        
        let mergedCount = 0;
        
        for (const [key, items] of Object.entries(groups)) {
            if (items.length > 1) {
                const keeper = items[0];
                const dupes = items.slice(1);
                const extraQty = dupes.reduce((sum, d) => sum + parseFloat(d.quantity || 0), 0);
                
                console.log(`Merging service group ${key}: keeping id=${keeper.id}`);
                await db.execute('UPDATE service_inventory SET quantity = quantity + ? WHERE id = ?', [extraQty, keeper.id]);
                for (const dupe of dupes) {
                    await db.execute('DELETE FROM service_inventory WHERE id = ?', [dupe.id]);
                }
                mergedCount++;
            }
        }
        
        if (mergedCount === 0) {
            console.log('No duplicates found in service_inventory. All clean!');
        } else {
            console.log(`Merged ${mergedCount} groups in service_inventory.`);
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    } finally {
        process.exit(0);
    }
}
test();
