const db = require('../config/db');

exports.getSettings = async (req, res) => {
    const adminId = req.user.id;
    try {
        const [rows] = await db.query('SELECT * FROM barcode_settings WHERE admin_id = ?', [adminId]);
        if (rows.length > 0) {
            res.json({ success: true, settings: rows[0] });
        } else {
            // Return defaults if not set
            res.json({ success: true, settings: { label_width_mm: 50, label_height_mm: 25, printer_type: 'Thermal' } });
        }
    } catch (error) {
        console.error('Error fetching barcode settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateSettings = async (req, res) => {
    const adminId = req.user.id;
    const { label_width_mm, label_height_mm, printer_type } = req.body;

    try {
        // Upsert logic
        const [existing] = await db.query('SELECT id FROM barcode_settings WHERE admin_id = ?', [adminId]);
        
        if (existing.length > 0) {
            await db.query(
                'UPDATE barcode_settings SET label_width_mm = ?, label_height_mm = ?, printer_type = ? WHERE admin_id = ?',
                [label_width_mm, label_height_mm, printer_type, adminId]
            );
        } else {
            await db.query(
                'INSERT INTO barcode_settings (admin_id, label_width_mm, label_height_mm, printer_type) VALUES (?, ?, ?, ?)',
                [adminId, label_width_mm, label_height_mm, printer_type]
            );
        }
        res.json({ success: true, message: 'Barcode settings updated successfully' });
    } catch (error) {
        console.error('Error updating barcode settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
