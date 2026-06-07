const db = require('../config/db');

// Ensure quotations table exists
const initTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS quotations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT NOT NULL,
                quote_id VARCHAR(50) NOT NULL,
                customer_name VARCHAR(100),
                customer_phone VARCHAR(20),
                customer_email VARCHAR(100),
                customer_address TEXT,
                items JSON,
                subtotal DECIMAL(10, 2),
                tax_total DECIMAL(10, 2),
                grand_total DECIMAL(10, 2),
                valid_days INT,
                terms TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    } catch (err) {
        console.error("Error creating quotations table:", err);
    }
};
initTable();

exports.getQuotations = async (req, res) => {
    try {
        const adminId = req.user.id;
        const [rows] = await db.query('SELECT * FROM quotations WHERE admin_id = ? ORDER BY created_at DESC', [adminId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching quotations", error: error.message });
    }
};

exports.getQuotationById = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM quotations WHERE id = ? AND admin_id = ?', [id, adminId]);
        if (rows.length === 0) return res.status(404).json({ message: "Quotation not found" });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching quotation", error: error.message });
    }
};

exports.createQuotation = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { quote_id, customer_name, customer_phone, customer_email, customer_address, items, subtotal, tax_total, grand_total, valid_days, terms } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO quotations (admin_id, quote_id, customer_name, customer_phone, customer_email, customer_address, items, subtotal, tax_total, grand_total, valid_days, terms) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, quote_id, customer_name, customer_phone, customer_email, customer_address, JSON.stringify(items), subtotal, tax_total, grand_total, valid_days, terms]
        );
        
        res.status(201).json({ message: "Quotation saved successfully", id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving quotation", error: error.message });
    }
};

exports.updateQuotation = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { customer_name, customer_phone, customer_email, customer_address, items, subtotal, tax_total, grand_total, valid_days, terms } = req.body;
        
        await db.query(
            `UPDATE quotations 
             SET customer_name=?, customer_phone=?, customer_email=?, customer_address=?, items=?, subtotal=?, tax_total=?, grand_total=?, valid_days=?, terms=?
             WHERE id=? AND admin_id=?`,
            [customer_name, customer_phone, customer_email, customer_address, JSON.stringify(items), subtotal, tax_total, grand_total, valid_days, terms, id, adminId]
        );
        
        res.json({ message: "Quotation updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating quotation", error: error.message });
    }
};

exports.deleteQuotation = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        await db.query('DELETE FROM quotations WHERE id = ? AND admin_id = ?', [id, adminId]);
        res.json({ message: "Quotation deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting quotation", error: error.message });
    }
};
