const db = require('../config/db');

exports.getSettings = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id } = req.query;

        if (!branch_id) {
            return res.status(400).json({ message: "branch_id is required" });
        }

        const [settings] = await db.query(
            'SELECT * FROM pos_settings WHERE admin_id = ? AND branch_id = ?',
            [adminId, branch_id]
        );

        if (settings.length > 0) {
            res.json(settings[0]);
        } else {
            // Return empty object if no settings found
            res.json({});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching POS settings", error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { branch_id, shop_name, gstin, theme, print_size, wholesale_print_size, auto_print, enable_gst, inclusive_gst, show_hsn, default_gst_preset } = req.body;

        if (!branch_id) {
            return res.status(400).json({ message: "branch_id is required" });
        }

        // Check if settings exist
        const [existing] = await db.query(
            'SELECT id FROM pos_settings WHERE admin_id = ? AND branch_id = ?',
            [adminId, branch_id]
        );

        if (existing.length > 0) {
            // Update
            await db.query(
                `UPDATE pos_settings SET shop_name = ?, gstin = ?, theme = ?, print_size = ?, wholesale_print_size = ?, auto_print = ?, enable_gst = ?, inclusive_gst = ?, show_hsn = ?, default_gst_preset = ?
                 WHERE admin_id = ? AND branch_id = ?`,
                [shop_name, gstin, theme, print_size, wholesale_print_size, auto_print, enable_gst, inclusive_gst, show_hsn, default_gst_preset, adminId, branch_id]
            );
        } else {
            // Insert
            await db.query(
                `INSERT INTO pos_settings (admin_id, branch_id, shop_name, gstin, theme, print_size, wholesale_print_size, auto_print, enable_gst, inclusive_gst, show_hsn, default_gst_preset)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [adminId, branch_id, shop_name, gstin, theme, print_size, wholesale_print_size, auto_print, enable_gst, inclusive_gst, show_hsn, default_gst_preset]
            );
        }

        res.json({ message: "POS settings updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating POS settings", error: error.message });
    }
};
