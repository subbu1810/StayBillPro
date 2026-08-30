const db = require('../config/db');

exports.createServiceRequest = async (req, res) => {
    try {
        const { customer_id, appliance_id, issue_description, service_date, service_type, status, technician_name, cost, notes, branch_id } = req.body;
        
        // Format service_date for MySQL (YYYY-MM-DD)
        const formattedDate = service_date ? new Date(service_date).toISOString().slice(0, 10) : null;
        
        const [result] = await db.query(
            `INSERT INTO service_requests (customer_id, appliance_id, issue_description, service_date, service_type, status, technician_name, cost, notes, branch_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customer_id, appliance_id, issue_description, formattedDate, service_type, status, technician_name, cost, notes, branch_id]
        );
        
        res.status(201).json({ id: result.insertId, message: "Service request created" });
    } catch (e) {
        console.error("Error creating service request:", e);
        res.status(500).json({ error: e.message });
    }
};

exports.getServiceRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`SELECT * FROM service_requests WHERE id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Service request not found" });
        }
        res.json(rows[0]);
    } catch (e) {
        console.error("Error fetching service request:", e);
        res.status(500).json({ error: e.message });
    }
};

exports.updateServiceRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const setString = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
        
        await db.query(`UPDATE service_requests SET ${setString} WHERE id = ?`, values);
        res.json({ id, message: "Service request updated" });
    } catch (e) {
        console.error("Error updating service request:", e);
        res.status(500).json({ error: e.message });
    }
};

exports.deleteServiceRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM service_requests WHERE id = ?`, [id]);
        res.json({ message: "Service request deleted" });
    } catch (e) {
        console.error("Error deleting service request:", e);
        res.status(500).json({ error: e.message });
    }
};
