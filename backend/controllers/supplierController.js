const db = require('../config/db');

// Helper: convert empty string to null
const nullIfEmpty = (val) => (val === '' || val === undefined ? null : val);

// GET all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const adminId = req.user.id;
        const [suppliers] = await db.query(
            `SELECT * FROM suppliers WHERE admin_id = ? ORDER BY created_at DESC`,
            [adminId]
        );
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
    }
};

// POST create a new supplier
exports.createSupplier = async (req, res) => {
    try {
        const adminId = req.user.id;
        const {
            supplier_code, supplier_name, contact_person, mobile, alternate_mobile,
            email, website, address_line1, address_line2, city, state, pincode, country,
            gstin, pan_no, business_type, registration_no, opening_balance, balance_type,
            credit_limit, payment_terms_days
        } = req.body;

        if (!supplier_name || !mobile) {
            return res.status(400).json({ message: 'Supplier name and mobile number are required' });
        }

        const [result] = await db.query(
            `INSERT INTO suppliers 
             (admin_id, supplier_code, supplier_name, contact_person, mobile, alternate_mobile,
              email, website, address_line1, address_line2, city, state, pincode, country,
              gstin, pan_no, business_type, registration_no, opening_balance, balance_type,
              credit_limit, payment_terms_days)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId,
                nullIfEmpty(supplier_code),
                supplier_name.trim(),
                nullIfEmpty(contact_person),
                mobile,
                nullIfEmpty(alternate_mobile),
                nullIfEmpty(email),
                nullIfEmpty(website),
                nullIfEmpty(address_line1),
                nullIfEmpty(address_line2),
                nullIfEmpty(city),
                nullIfEmpty(state),
                nullIfEmpty(pincode),
                country || 'India',
                nullIfEmpty(gstin),
                nullIfEmpty(pan_no),
                business_type || 'Manufacturer',
                nullIfEmpty(registration_no),
                opening_balance || 0.00,
                balance_type || 'Payable',
                credit_limit || 0.00,
                payment_terms_days || 0
            ]
        );

        res.status(201).json({ message: 'Supplier registered successfully', id: result.insertId });
    } catch (error) {
        console.error('Error registering supplier:', error);
        res.status(500).json({ message: 'Error registering supplier', error: error.message });
    }
};

// PUT update a supplier
exports.updateSupplier = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const {
            supplier_code, supplier_name, contact_person, mobile, alternate_mobile,
            email, website, address_line1, address_line2, city, state, pincode, country,
            gstin, pan_no, business_type, registration_no, opening_balance, balance_type,
            credit_limit, payment_terms_days
        } = req.body;

        const [existing] = await db.query(
            'SELECT id FROM suppliers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        await db.query(
            `UPDATE suppliers SET
             supplier_code = ?, supplier_name = ?, contact_person = ?, mobile = ?, alternate_mobile = ?,
             email = ?, website = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?, pincode = ?, country = ?,
             gstin = ?, pan_no = ?, business_type = ?, registration_no = ?, opening_balance = ?, balance_type = ?,
             credit_limit = ?, payment_terms_days = ?
             WHERE id = ? AND admin_id = ?`,
            [
                nullIfEmpty(supplier_code),
                supplier_name.trim(),
                nullIfEmpty(contact_person),
                mobile,
                nullIfEmpty(alternate_mobile),
                nullIfEmpty(email),
                nullIfEmpty(website),
                nullIfEmpty(address_line1),
                nullIfEmpty(address_line2),
                nullIfEmpty(city),
                nullIfEmpty(state),
                nullIfEmpty(pincode),
                country || 'India',
                nullIfEmpty(gstin),
                nullIfEmpty(pan_no),
                business_type || 'Manufacturer',
                nullIfEmpty(registration_no),
                opening_balance || 0.00,
                balance_type || 'Payable',
                credit_limit || 0.00,
                payment_terms_days || 0,
                id,
                adminId
            ]
        );

        res.json({ message: 'Supplier profile updated successfully' });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ message: 'Error updating supplier', error: error.message });
    }
};

// DELETE a supplier
exports.deleteSupplier = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        await db.query(
            'DELETE FROM suppliers WHERE id = ? AND admin_id = ?',
            [id, adminId]
        );

        res.json({ message: 'Supplier profile deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ message: 'Error deleting supplier', error: error.message });
    }
};
