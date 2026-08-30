const db = require('../config/db');

exports.createJob = async (req, res) => {
    try {
        const { job_number, service_request_id, technician_id, user_id, scheduled_date, start_time, end_time, status, priority, job_description, work_done, labor_cost, parts_cost, total_cost, location, notes, completion_signature, branch_id } = req.body;
        
        // Format scheduled_date for MySQL (YYYY-MM-DD)
        const formattedDate = scheduled_date ? new Date(scheduled_date).toISOString().slice(0, 10) : null;
        
        const [result] = await db.query(
            `INSERT INTO service_jobs 
            (job_number, service_request_id, technician_id, user_id, scheduled_date, start_time, end_time, status, priority, job_description, work_done, labor_cost, parts_cost, total_cost, location, notes, completion_signature, branch_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [job_number, service_request_id, technician_id, user_id, formattedDate, start_time, end_time, status, priority, job_description, work_done, labor_cost, parts_cost, total_cost, location, notes, completion_signature, branch_id]
        );
        
        res.status(201).json({ id: result.insertId, message: "Job created successfully" });
    } catch (e) {
        console.error("Error creating job:", e);
        res.status(500).json({ error: e.message });
    }
};

exports.getJobs = async (req, res) => {
    try {
        const branch_id = req.query.branch_id;
        let query = `
            SELECT j.*, 
                   sr.issue_description, sr.technician_name as sr_technician, sr.customer_id, sr.service_type,
                   a.id as appliance_id, a.brand, a.category, a.name as appliance_name, a.model,
                   t.name as technician_name,
                   c.name as customer_name, c.mobile as phone, c.billingAddress as address
            FROM service_jobs j
            LEFT JOIN service_requests sr ON j.service_request_id = sr.id
            LEFT JOIN appliances a ON sr.appliance_id = a.id
            LEFT JOIN technicians t ON j.technician_id = t.id
            LEFT JOIN customers c ON sr.customer_id = c.id
        `;
        const params = [];
        if (branch_id) {
            query += ` WHERE j.branch_id = ?`;
            params.push(branch_id);
        }
        query += ` ORDER BY j.created_at DESC`;

        const [jobs] = await db.query(query, params);
        
        // Transform to nested structure for frontend
        const formattedJobs = jobs.map(job => ({
            ...job,
            service_request: {
                id: job.service_request_id,
                issue_description: job.issue_description,
                service_type: job.service_type,
                technician_name: job.sr_technician,
                appliance: {
                    id: job.appliance_id,
                    customer_id: job.customer_id,
                    customer_name: job.customer_name,
                    phone: job.phone,
                    address: job.address,
                    brand: job.brand,
                    category: job.category,
                    name: job.appliance_name,
                    model: job.model
                }
            },
            technician: {
                name: job.technician_name
            }
        }));

        res.json(formattedJobs);
    } catch (e) {
        console.error("Error fetching jobs:", e);
        res.status(500).json({ error: e.message });
    }
};

exports.getJob = async (req, res) => {
    try {
        const { id } = req.params;
        const [jobs] = await db.query(`
            SELECT j.*, 
                   sr.issue_description, sr.technician_name as sr_technician, sr.customer_id, sr.service_type,
                   a.id as appliance_id, a.brand, a.category, a.name as appliance_name, a.model,
                   t.name as technician_name,
                   c.name as customer_name, c.mobile as phone, c.billingAddress as address
            FROM service_jobs j
            LEFT JOIN service_requests sr ON j.service_request_id = sr.id
            LEFT JOIN appliances a ON sr.appliance_id = a.id
            LEFT JOIN technicians t ON j.technician_id = t.id
            LEFT JOIN customers c ON sr.customer_id = c.id
            WHERE j.id = ?
        `, [id]);
        
        if (jobs.length === 0) return res.status(404).json({ error: "Job not found" });

        const job = jobs[0];
        const formattedJob = {
            ...job,
            service_request: {
                id: job.service_request_id,
                issue_description: job.issue_description,
                service_type: job.service_type,
                technician_name: job.sr_technician,
                appliance: {
                    id: job.appliance_id,
                    customer_id: job.customer_id,
                    customer_name: job.customer_name,
                    phone: job.phone,
                    address: job.address,
                    brand: job.brand,
                    category: job.category,
                    name: job.appliance_name,
                    model: job.model
                }
            },
            technician: {
                name: job.technician_name
            }
        };

        res.json(formattedJob);
    } catch (e) {
        console.error("Error fetching job:", e);
        res.status(500).json({ error: e.message });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const setString = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        await db.query(`UPDATE service_jobs SET ${setString} WHERE id = ?`, values);
        res.json({ id, message: "Job updated" });
    } catch (e) {
        console.error("Error updating job:", e);
        res.status(500).json({ error: e.message });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM service_jobs WHERE id = ?`, [id]);
        res.json({ message: "Job deleted" });
    } catch (e) {
        console.error("Error deleting job:", e);
        res.status(500).json({ error: e.message });
    }
};
