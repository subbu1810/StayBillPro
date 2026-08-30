const db = require('./config/db');

async function applySchema() {
    try {
        console.log("Dropping existing service_jobs table...");
        await db.query(`DROP TABLE IF EXISTS service_jobs`);
        await db.query(`DROP TABLE IF EXISTS service_requests`);

        console.log("Creating service_requests table...");
        await db.query(`
            CREATE TABLE service_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                branch_id INT,
                appliance_id INT,
                issue_description TEXT,
                service_date DATE,
                service_type VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                technician_name VARCHAR(100),
                cost DECIMAL(10, 2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
                FOREIGN KEY (appliance_id) REFERENCES appliances(id) ON DELETE CASCADE
            )
        `);

        console.log("Creating new service_jobs table...");
        await db.query(`
            CREATE TABLE service_jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                branch_id INT,
                job_number VARCHAR(100) NOT NULL,
                service_request_id INT,
                technician_id INT,
                user_id INT,
                scheduled_date DATE,
                start_time TIME,
                end_time TIME,
                status VARCHAR(50) DEFAULT 'pending',
                priority VARCHAR(50) DEFAULT 'medium',
                job_description TEXT,
                work_done TEXT,
                labor_cost DECIMAL(10, 2),
                parts_cost DECIMAL(10, 2),
                total_cost DECIMAL(10, 2),
                location TEXT,
                notes TEXT,
                completion_signature TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
                FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
                FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES admins(id) ON DELETE SET NULL
            )
        `);

        console.log("Schema applied successfully.");
    } catch (e) {
        console.error("Error applying schema:", e);
    } finally {
        process.exit();
    }
}

applySchema();
