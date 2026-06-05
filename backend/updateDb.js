const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: 'Subbu@1810', 
    database: 'staybillpro'
  });
  
  try {
      await db.query(`
        ALTER TABLE admins ADD COLUMN eula_accepted BOOLEAN DEFAULT FALSE AFTER features;
      `);
      console.log('EULA column added to admins successfully.');
  } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('Features column already exists.');
      } else {
          console.error('Error adding column:', err.message);
      }
  }
  process.exit(0);
}
run();
