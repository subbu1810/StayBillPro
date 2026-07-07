const db = require('./config/db');

async function deleteInvoices() {
    try {
        console.log('Connecting to database and deleting invoices...');
        
        // Delete all invoice items first due to foreign key constraints
        const [itemsResult] = await db.query('DELETE FROM invoice_items');
        console.log(`Deleted ${itemsResult.affectedRows} invoice items.`);
        
        // Delete all invoices
        const [invoicesResult] = await db.query('DELETE FROM invoices');
        console.log(`Deleted ${invoicesResult.affectedRows} invoices.`);
        
        console.log('Successfully deleted all invoices from the database.');
    } catch (error) {
        console.error('Error deleting invoices:', error);
    } finally {
        process.exit();
    }
}

deleteInvoices();
