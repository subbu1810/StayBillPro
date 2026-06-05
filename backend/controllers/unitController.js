const db = require('../db');

// Get all units for an admin
exports.getUnits = async (req, res) => {
    try {
        const { id, role, parent_admin_id } = req.admin;
        const targetAdminId = role === 'SUPERADMIN' ? id : parent_admin_id;

        const [units] = await db.query(
            'SELECT id, name FROM units WHERE admin_id = ? ORDER BY name ASC',
            [targetAdminId]
        );

        res.json(units);
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ message: 'Error fetching units' });
    }
};

// Add a new unit
exports.addUnit = async (req, res) => {
    try {
        const { id, role, parent_admin_id } = req.admin;
        const targetAdminId = role === 'SUPERADMIN' ? id : parent_admin_id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Unit name is required' });
        }

        const upperName = name.trim().toUpperCase();

        try {
            const [result] = await db.query(
                'INSERT INTO units (admin_id, name) VALUES (?, ?)',
                [targetAdminId, upperName]
            );
            
            res.status(201).json({ 
                message: 'Unit added successfully',
                unit: { id: result.insertId, name: upperName }
            });
        } catch (dbError) {
            // Handle duplicate unit error
            if (dbError.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Unit already exists' });
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Error adding unit:', error);
        res.status(500).json({ message: 'Error adding unit' });
    }
};
