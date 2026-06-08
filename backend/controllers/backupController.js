const mysqldump = require('mysqldump');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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

        res.download(dumpFilePath, `StayBillPro_Backup_${new Date().toISOString().split('T')[0]}.sql`, (err) => {
            if (err) {
                console.error("Error sending backup file:", err);
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
