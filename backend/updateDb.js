const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: 'Subbu@1810', 
    database: 'staybillpro'
  });
  
  try {
      await db.query(`ALTER TABLE admins ADD COLUMN eula_accepted BOOLEAN DEFAULT FALSE AFTER features;`);
      console.log('EULA column added.');
  } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('EULA column already exists.');
      else console.error('Error admins:', err.message);
  }
  
  try {
      await db.query(`ALTER TABLE sales_inventory ADD COLUMN expiry_date DATE DEFAULT NULL;`);
      console.log('expiry_date column added to sales_inventory.');
  } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('expiry_date column already exists in sales_inventory.');
      else console.error('Error sales_inventory:', err.message);
  }

  try {
      await db.query(`ALTER TABLE service_inventory ADD COLUMN expiry_date DATE DEFAULT NULL;`);
      console.log('expiry_date column added to service_inventory.');
  } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('expiry_date column already exists in service_inventory.');
      else console.error('Error service_inventory:', err.message);
  }
  try {
      await db.query(`ALTER TABLE grn_items ADD COLUMN pushed_to_stock BOOLEAN DEFAULT FALSE;`);
      console.log('pushed_to_stock column added to grn_items.');
  } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('pushed_to_stock column already exists in grn_items.');
      else console.error('Error grn_items:', err.message);
  }
  process.exit(0);
}
run();
