const mysqldump = require('mysqldump');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
require('dotenv').config();

exports.checkBackupStatus = async (req, res) => {
    try {
        const adminId = req.user.businessId || req.user.id;
        const [rows] = await db.query(
            'SELECT download_time FROM backup_logs WHERE admin_id = ? ORDER BY download_time DESC LIMIT 1',
            [adminId]
        );
        
        let lastBackupDateStr = null;
        if (rows.length > 0) {
            lastBackupDateStr = rows[0].download_time;
        }

        res.json({ last_backup_date: lastBackupDateStr });
    } catch (error) {
        console.error("Error checking backup status:", error);
        res.status(500).json({ message: "Failed to check backup status" });
    }
};

exports.getBackupLogs = async (req, res) => {
    try {
        const adminId = req.user.businessId || req.user.id;
        const [rows] = await db.query(
            'SELECT id, download_time, system_info, ip_address, file_name FROM backup_logs WHERE admin_id = ? ORDER BY download_time DESC LIMIT 50',
            [adminId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching backup logs:", error);
        res.status(500).json({ message: "Failed to fetch backup logs" });
    }
};

exports.downloadBackup = async (req, res) => {
    try {
        const dumpFileName = `backup_${Date.now()}.sql`;
        const dumpFilePath = path.join(__dirname, '..', dumpFileName);

        await mysqldump({
            connection: {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
            },
            dumpToFile: dumpFilePath,
        });

        res.download(dumpFilePath, `StayBillPro_Backup_${new Date().toISOString().split('T')[0]}.sql`, async (err) => {
            if (err) {
                console.error("Error sending backup file:", err);
            } else {
                // Log successful backup
                try {
                    const adminId = req.user.businessId || req.user.id;
                    const systemInfo = req.headers['user-agent'] || 'Unknown System';
                    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
                    
                    await db.query(
                        'INSERT INTO backup_logs (admin_id, system_info, ip_address, file_name) VALUES (?, ?, ?, ?)',
                        [adminId, systemInfo, ipAddress, dumpFileName]
                    );
                } catch (dbErr) {
                    console.error("Error logging backup to database:", dbErr);
                }
            }
            // Delete the file after sending
            fs.unlink(dumpFilePath, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting temp backup file:", unlinkErr);
            });
        });
    } catch (error) {
        console.error("Backup error:", error);
        res.status(500).json({ success: false, message: 'Failed to generate backup' });
    }
};
