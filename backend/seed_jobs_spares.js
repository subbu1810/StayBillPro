const db = require('./config/db');

async function seedData() {
    try {
        console.log("Creating service_jobs table if not exists...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS service_jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                branch_id INT,
                job_number VARCHAR(100) NOT NULL,
                customer_id INT,
                appliance_id INT,
                technician_id INT,
                issue_description TEXT,
                status ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold') DEFAULT 'pending',
                scheduled_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
            )
        `);

        // Add some dummy spares to service_inventory
        console.log("Inserting dummy spares into service_inventory...");
        const sparesQuery = `
            INSERT INTO service_inventory (admin_id, branch_id, name, brand, part_number, price, quantity, status)
            VALUES 
            (3, 1, 'Compressor 1.5 Ton', 'LG', 'COMP-LG-15', 4500.00, 10, 'available'),
            (3, 1, 'Washing Machine Drum', 'Samsung', 'WMD-SM-01', 3200.00, 5, 'available'),
            (3, 1, 'Microwave Magnetron', 'Whirlpool', 'MAG-WH-02', 1200.00, 20, 'available')
        `;
        try {
            await db.query(sparesQuery);
            console.log("Dummy spares inserted.");
        } catch (e) {
            console.log("Spares already exist or error:", e.message);
        }

        // Add a customer if not exists
        await db.query(`INSERT IGNORE INTO customers (id, admin_id, name, mobile) VALUES (1, 3, 'John Doe', '9876543210')`);
        
        // Add an appliance if not exists
        await db.query(`INSERT IGNORE INTO appliances (id, admin_id, name, brand, model) VALUES (1, 3, 'AC', 'LG', 'Split 1.5T')`);
        
        // Add a technician if not exists
        await db.query(`INSERT IGNORE INTO technicians (id, admin_id, name, phone, specialization) VALUES (1, 3, 'Tech Mike', '1122334455', 'AC Repair')`);

        console.log("Inserting dummy service_jobs...");
        const jobsQuery = `
            INSERT INTO service_jobs (admin_id, branch_id, job_number, customer_id, appliance_id, technician_id, issue_description, status, scheduled_date)
            VALUES 
            (3, 1, 'JOB-1001', 1, 1, 1, 'Not cooling properly', 'pending', CURDATE()),
            (3, 1, 'JOB-1002', 1, 1, 1, 'Strange noise', 'in_progress', CURDATE()),
            (3, 1, 'JOB-1003', 1, 1, 1, 'Gas leak', 'completed', CURDATE())
        `;
        try {
            await db.query(jobsQuery);
            console.log("Dummy jobs inserted.");
        } catch (e) {
            console.log("Jobs already exist or error:", e.message);
        }

    } catch (e) {
        console.error("Error seeding data:", e);
    } finally {
        process.exit();
    }
}

seedData();
