const db = require('./config/db');

async function test() {
    const adminId = 3;
    const branchId = 1;

    const [allInvoices] = await db.execute('SELECT id, gst_amount, status, admin_id, branch_id FROM invoices WHERE admin_id = ?', [adminId]);
    console.log('All Invoices for admin', adminId, ':', JSON.stringify(allInvoices, null, 2));

    const [paidInvoices] = await db.execute('SELECT SUM(gst_amount) as outwardGST FROM invoices WHERE admin_id = ? AND status = "paid"', [adminId]);
    console.log('Outward GST (paid invoices):', JSON.stringify(paidInvoices));

    const [allPurchases] = await db.execute('SELECT id, gst_amount, admin_id FROM purchases WHERE admin_id = ?', [adminId]);
    console.log('All Purchases for admin', adminId, ':', JSON.stringify(allPurchases, null, 2));

    const [inwardGST] = await db.execute('SELECT SUM(gst_amount) as inwardGST FROM purchases WHERE admin_id = ?', [adminId]);
    console.log('Inward GST (purchases):', JSON.stringify(inwardGST));

    process.exit(0);
}

test().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
