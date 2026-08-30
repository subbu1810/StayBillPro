const db = require('./config/db');
async function run() {
    await db.query(`UPDATE service_jobs SET scheduled_date = '2026-07-30' WHERE id = 1`);
    await db.query(`UPDATE service_jobs SET scheduled_date = '2026-07-31' WHERE id = 2`);
    console.log("Updated.");
    process.exit();
}
run();
