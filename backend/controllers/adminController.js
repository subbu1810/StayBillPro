const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerAdmin = async (req, res) => {
    try {
        const { 
            business_name, branch_name, admin_name, email, phone, address, 
            city, state, pincode, country, business_type, 
            gst_number, password, plan_name 
        } = req.body;

        // 1. Check if user already exists
        const [existingUser] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Admin with this email already exists" });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert into database
        const [result] = await db.query(
            `INSERT INTO admins (
                business_name, admin_name, email, phone, address, 
                city, state, pincode, country, business_type, 
                gst_number, password, current_plan, features, role
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUPERADMIN')`,
            [
                business_name, admin_name, email, phone, address, 
                city, state, pincode, country, business_type, 
                gst_number, hashedPassword, plan_name || 'Starter', req.body.features || 'Both Features'
            ]
        );

        const adminId = result.insertId;
        console.log('Created Admin ID:', adminId);

        // 4. Create Main Branch for this business
        console.log('Creating branch with name:', branch_name);
        const [branchResult] = await db.query(
            `INSERT INTO branches (admin_id, name, is_main, email, phone, address, city, state)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId, 
                branch_name || 'Main Branch', 
                true, // is_main
                email, 
                phone, 
                address, 
                city, 
                state
            ]
        );

        const mainBranchId = branchResult.insertId;
        console.log('Created Branch ID:', mainBranchId);

        // 5. Update admin with the main branch_id
        console.log('Linking branch to admin...');
        await db.query('UPDATE admins SET branch_id = ? WHERE id = ?', [mainBranchId, adminId]);

        res.status(201).json({ 
            message: "Registration successful. Please proceed to payment.",
            admin_id: adminId 
        });

    } catch (error) {
        console.error('Registration Error Details:', error);
        res.status(500).json({ message: "Server error during registration", error: error.message });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        // Validate input
        if ((!email && !phone) || !password) {
            return res.status(400).json({ message: "Email/Phone and password are required" });
        }

        // 1. Find user
        let query = 'SELECT * FROM admins WHERE ';
        let queryParams = [];
        if (email) {
            query += 'email = ?';
            queryParams.push(email);
        } else {
            query += 'phone = ?';
            queryParams.push(phone);
        }

        const [users] = await db.query(query, queryParams);
        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const user = users[0];

        // 2. Check password — guard against plain-text (non-hashed) passwords in DB
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
        } catch (bcryptErr) {
            // Password in DB is not a valid bcrypt hash
            console.error('bcrypt error (likely plain-text password in DB):', bcryptErr.message);
            // Fallback to plain text check if not hashed? No, for security just fail or allow if matches plain (temporary dev fallback)
            if (password === user.password) {
                isMatch = true;
            } else {
                return res.status(500).json({ message: "Account password is not properly set. Please contact support." });
            }
        }

        if (!isMatch) {
            // Also add a fallback here just in case they have plaintext passwords in the database
            if (password === user.password) {
                isMatch = true;
            } else {
                return res.status(400).json({ message: "Invalid Credentials" });
            }
        }

        // 3. Check if active (subscription)
        if (!user.is_active) {
            return res.status(403).json({ 
                message: "Account inactive. Please complete payment or contact support.",
                admin_id: user.id 
            });
        }

        // 4. Generate JWT
        // If staff, use parent_admin_id as the primary business context
        const businessId = user.role === 'SUPERADMIN' ? user.id : user.parent_admin_id;
        
        const token = jwt.sign(
            { 
                id: user.id, 
                businessId: businessId,
                role: user.role,
                branchId: user.branch_id 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                businessId: businessId,
                name: user.admin_name,
                business: user.business_name,
                email: user.email,
                role: user.role,
                branchId: user.branch_id,
                permissions: user.permissions,
                plan: user.current_plan,
                expiry: user.subscription_expiry,
                logo_url: user.logo_url,
                eula_accepted: user.eula_accepted
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error during login" });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.user.id; // From authMiddleware

        // 1. Get admin from DB
        const [users] = await db.query('SELECT * FROM admins WHERE id = ?', [adminId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const user = users[0];

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // 3. Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update DB
        await db.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, adminId]);

        res.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error('Change password error:', error.message);
        res.status(500).json({ message: "Server error while changing password" });
    }
};

exports.updateAdminProfile = async (req, res) => {
    try {
        const adminId = req.user.id;
        const {
            business_name,
            admin_name,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            country,
            business_type,
            gst_number,
            logo_url
        } = req.body;

        // Check for email conflicts if email is being changed
        if (email) {
            const [existingAdmins] = await db.query(
                'SELECT id FROM admins WHERE email = ? AND id != ?',
                [email, adminId]
            );
            if (existingAdmins.length > 0) {
                return res.status(400).json({ message: 'Email already in use by another account' });
            }
        }

        await db.query(
            `UPDATE admins SET
                business_name = COALESCE(?, business_name),
                admin_name = COALESCE(?, admin_name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                city = COALESCE(?, city),
                state = COALESCE(?, state),
                pincode = COALESCE(?, pincode),
                country = COALESCE(?, country),
                business_type = COALESCE(?, business_type),
                gst_number = COALESCE(?, gst_number),
                logo_url = COALESCE(?, logo_url)
             WHERE id = ?`,
            [
                business_name,
                admin_name,
                email,
                phone,
                address,
                city,
                state,
                pincode,
                country,
                business_type,
                gst_number,
                logo_url,
                adminId
            ]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
};

exports.getBusinessUsers = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        // Find users where id = adminId OR parent_admin_id = adminId
        // Also assuming superadmins might have parent_admin_id = null but they are still the root.
        const [users] = await db.query(
            `SELECT a.id, a.admin_name, a.email, a.role, a.permissions, a.status, 
                    a.branch_id, a.created_at, b.name AS branch_name
             FROM admins a
             LEFT JOIN branches b ON a.branch_id = b.id
             WHERE a.id = ? OR a.parent_admin_id = ?
             ORDER BY a.role ASC, a.admin_name ASC`,
            [adminId, adminId]
        );
        
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

exports.updatePermissions = async (req, res) => {
    try {
        const adminId = req.user.id;
        const targetUserId = req.params.id;
        const { permissions } = req.body;
        
        // First verify the target user belongs to this admin's business
        const [users] = await db.query(
            'SELECT id FROM admins WHERE id = ? AND (id = ? OR parent_admin_id = ?)',
            [targetUserId, adminId, adminId]
        );
        
        if (users.length === 0) {
            return res.status(403).json({ message: 'Unauthorized to update this user' });
        }
        
        // Update permissions (store as JSON string)
        const permissionsString = Array.isArray(permissions) ? JSON.stringify(permissions) : permissions;
        
        await db.query(
            'UPDATE admins SET permissions = ? WHERE id = ?',
            [permissionsString, targetUserId]
        );
        
        res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({ message: 'Server error while updating permissions' });
    }
};

exports.updateBusinessUser = async (req, res) => {
    try {
        const adminId = req.user.id;
        const targetUserId = req.params.id;
        const { admin_name, email, phone, branch_id, status, permissions, password } = req.body;

        // Verify the target user belongs to this admin's business (or is the admin themselves)
        const [users] = await db.query(
            'SELECT id, role FROM admins WHERE id = ? AND (id = ? OR parent_admin_id = ?)',
            [targetUserId, adminId, adminId]
        );

        if (users.length === 0) {
            return res.status(403).json({ message: 'Unauthorized to update this user' });
        }

        const permissionsString = Array.isArray(permissions) ? JSON.stringify(permissions) : (permissions || null);

        let query = `UPDATE admins SET 
            admin_name = COALESCE(?, admin_name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            branch_id = ?,
            status = COALESCE(?, status),
            permissions = ?`;
        let params = [admin_name, email, phone, branch_id || null, status, permissionsString];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(targetUserId);

        await db.query(query, params);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update business user error:', error);
        res.status(500).json({ message: 'Server error while updating user' });
    }
};

exports.acceptEula = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        await db.query(
            'UPDATE admins SET eula_accepted = TRUE WHERE id = ?',
            [adminId]
        );
        
        res.json({ message: 'EULA accepted successfully' });
    } catch (error) {
        console.error('Accept EULA error:', error);
        res.status(500).json({ message: 'Server error while accepting EULA' });
    }
};
