const db = require('../config/db');

// Helper to calculate previous period dates if needed
// function getPreviousPeriod(fromDate, toDate) { ... }

exports.getSalesReport = async (req, res) => {
    try {
        const adminId = req.user.id;
        const branchId = req.user.branch_id;

        let baseParams = [adminId];
        let branchFilter = '';
        if (branchId) {
            branchFilter = ' AND i.branch_id = ?';
            baseParams.push(branchId);
        }

        const { from, to } = req.query;
        let dateFilter = '';
        if (from && to) {
            dateFilter = ' AND DATE(i.created_at) BETWEEN ? AND ?';
            baseParams.push(from, to);
        }

        // Summary totals
        const summaryQuery = `
            SELECT 
                COUNT(DISTINCT i.id) as total_invoices,
                COALESCE(SUM(i.total_amount), 0) as gross_sales,
                COALESCE(SUM(i.gst_amount), 0) as total_gst,
                COALESCE(SUM(i.total_amount - i.gst_amount), 0) as taxable_value
            FROM invoices i
            WHERE i.admin_id = ? ${branchFilter} ${dateFilter} AND i.status != 'cancelled'
        `;
        const [summaryResult] = await db.query(summaryQuery, baseParams);

        // Product-level detail joined with invoice_items and sales_inventory
        const detailQuery = `
            SELECT 
                ROW_NUMBER() OVER (ORDER BY i.created_at DESC) as sno,
                CONCAT('INV-', LPAD(i.id, 4, '0')) as invoice_no,
                DATE(i.created_at) as invoice_date,
                i.customer_name,
                i.customer_phone,
                i.payment_method,
                ii.item_name as product_name,
                ii.quantity,
                ii.unit_price,
                ii.total_price as line_total,
                COALESCE(si.hsn_code, 'N/A') as hsn_code,
                COALESCE(si.sku, '') as sku,
                COALESCE(si.gst_rate, 0) as gst_rate,
                COALESCE(si.serial_number, '') as serial_number,
                ROUND(ii.total_price / (1 + COALESCE(si.gst_rate, 0) / 100), 2) as taxable_val,
                ROUND((ii.total_price - (ii.total_price / (1 + COALESCE(si.gst_rate, 0) / 100))) / 2, 2) as cgst,
                ROUND((ii.total_price - (ii.total_price / (1 + COALESCE(si.gst_rate, 0) / 100))) / 2, 2) as sgst,
                0 as igst,
                ROUND(ii.total_price - (ii.total_price / (1 + COALESCE(si.gst_rate, 0) / 100)), 2) as gst_amount,
                i.total_amount as invoice_total,
                i.gst_amount as invoice_gst,
                i.status
            FROM invoices i
            INNER JOIN invoice_items ii ON ii.invoice_id = i.id
            LEFT JOIN sales_inventory si ON si.id = ii.product_id
            WHERE i.admin_id = ? ${branchFilter.replace('i.branch_id', 'i.branch_id')} ${dateFilter} AND i.status != 'cancelled'
            ORDER BY i.created_at DESC
            LIMIT 200
        `;
        const [lineItems] = await db.query(detailQuery, baseParams);

        res.json({
            summary: {
                grossSales: summaryResult[0].gross_sales,
                taxableValue: summaryResult[0].taxable_value,
                totalGST: summaryResult[0].total_gst,
                serviceRevenue: 0,
                productSales: summaryResult[0].gross_sales,
                totalInvoices: summaryResult[0].total_invoices
            },
            lineItems,
            // Keep backward compat
            recentInvoices: lineItems
        });
    } catch (error) {
        console.error('Error fetching sales report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.getExpenseReport = async (req, res) => {
    try {
        const adminId = req.user.id;
        const branchId = req.user.branch_id;
        
        let queryParams = [adminId];
        let branchFilter = '';
        if (branchId) {
            branchFilter = ' AND branch_id = ?';
            queryParams.push(branchId);
        }

        const { from, to } = req.query;
        let dateFilter = '';
        if (from && to) {
            dateFilter = ' AND expense_date BETWEEN ? AND ?';
            queryParams.push(from, to);
        }

        const summaryQuery = `
            SELECT 
                COALESCE(SUM(amount), 0) as total_expenses
            FROM expenses 
            WHERE admin_id = ? ${branchFilter} ${dateFilter}
        `;
        const [summaryResult] = await db.query(summaryQuery, queryParams);

        // Group by category for the cards
        const categoryQuery = `
            SELECT category, COALESCE(SUM(amount), 0) as amount
            FROM expenses
            WHERE admin_id = ? ${branchFilter} ${dateFilter}
            GROUP BY category
            ORDER BY amount DESC
            LIMIT 3
        `;
        const [categoryResult] = await db.query(categoryQuery, queryParams);

        // Recent expenses
        const recentQuery = `
            SELECT id, expense_date as date, category as cat, CONCAT('EXP-', id) as ref, description as descr, payment_mode as via, amount
            FROM expenses
            WHERE admin_id = ? ${branchFilter} ${dateFilter}
            ORDER BY expense_date DESC
            LIMIT 50
        `;
        const [recentExpenses] = await db.query(recentQuery, queryParams);

        res.json({
            summary: {
                totalExpenses: summaryResult[0].total_expenses,
                topCategories: categoryResult
            },
            recentExpenses
        });
    } catch (error) {
        console.error('Error fetching expense report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getProfitReport = async (req, res) => {
    try {
        const adminId = req.user.id;
        const branchId = req.user.branch_id;
        
        let queryParams = [adminId];
        let branchFilter = '';
        if (branchId) {
            branchFilter = ' AND branch_id = ?';
            queryParams.push(branchId);
        }

        const { from, to } = req.query;
        let invoiceDateFilter = '';
        let expenseDateFilter = '';
        if (from && to) {
            invoiceDateFilter = ' AND DATE(created_at) BETWEEN ? AND ?';
            expenseDateFilter = ' AND expense_date BETWEEN ? AND ?';
            queryParams.push(from, to);
        }

        // Get total revenue
        const revenueQuery = `
            SELECT COALESCE(SUM(total_amount), 0) as total_revenue
            FROM invoices 
            WHERE admin_id = ? ${branchFilter} ${invoiceDateFilter} AND status != 'cancelled'
        `;
        
        // Get total expenses
        const expenseQuery = `
            SELECT COALESCE(SUM(amount), 0) as total_expenses
            FROM expenses 
            WHERE admin_id = ? ${branchFilter} ${expenseDateFilter}
        `;

        const [revenueResult] = await db.query(revenueQuery, from && to ? [adminId, branchId ? branchId : null, from, to].filter(Boolean) : [adminId, branchId ? branchId : null].filter(Boolean));
        const [expenseResult] = await db.query(expenseQuery, from && to ? [adminId, branchId ? branchId : null, from, to].filter(Boolean) : [adminId, branchId ? branchId : null].filter(Boolean));

        const totalRevenue = parseFloat(revenueResult[0].total_revenue);
        const totalExpenses = parseFloat(expenseResult[0].total_expenses);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

        res.json({
            summary: {
                netProfit,
                totalRevenue,
                totalExpenses,
                profitMargin
            }
        });
    } catch (error) {
        console.error('Error fetching profit report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getTopCustomersReport = async (req, res) => {
    try {
        const adminId = req.user.id;
        
        const { from, to } = req.query;
        let dateFilter = '';
        let queryParams = [adminId];
        if (from && to) {
            dateFilter = ' AND DATE(i.created_at) BETWEEN ? AND ?';
            queryParams.push(from, to);
        }

        const query = `
            SELECT 
                c.id, 
                CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) as name,
                c.customer_type as tier,
                COUNT(i.id) as job_count,
                COALESCE(SUM(i.total_amount), 0) as total_spent,
                MAX(i.created_at) as last_visit
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.admin_id AND i.customer_name = CONCAT(c.first_name, ' ', COALESCE(c.last_name, ''))
            WHERE c.admin_id = ? ${dateFilter}
            GROUP BY c.id
            HAVING job_count > 0
            ORDER BY total_spent DESC
            LIMIT 50
        `;
        
        // Actually, we store customer_name in invoices directly, but linking to customers table might be tricky if we don't store customer_id.
        // Let's rely purely on invoices grouping by customer_name if customer_id isn't in invoices.
        // Looking at the schema, invoices has customer_name and customer_phone, NOT customer_id.
        // So let's modify the query to aggregate invoices by customer_phone/name.
        const betterQuery = `
            SELECT 
                customer_name as name,
                customer_phone as phone,
                COUNT(id) as count,
                COALESCE(SUM(total_amount), 0) as spent,
                MAX(created_at) as last
            FROM invoices
            WHERE admin_id = ? ${dateFilter} AND status != 'cancelled'
            GROUP BY customer_name, customer_phone
            ORDER BY spent DESC
            LIMIT 50
        `;

        const [customers] = await db.query(betterQuery, queryParams);

        res.json({
            customers
        });
    } catch (error) {
        console.error('Error fetching top customers report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getInventoryReport = async (req, res) => {
    try {
        const adminId = req.user.id;
        const branchId = req.user.branch_id;
        
        let queryParams = [adminId];
        let branchFilter = '';
        if (branchId) {
            branchFilter = ' AND branch_id = ?';
            queryParams.push(branchId);
        }

        const query = `
            SELECT 
                id, 
                name as item,
                brand,
                sku,
                hsn_code,
                unit,
                gst_rate,
                serial_number,
                dimensions,
                size,
                quantity as remaining,
                price,
                purchase_price,
                wholesale_price,
                min_wholesale_qty,
                status,
                expiry_date
            FROM sales_inventory
            WHERE admin_id = ? ${branchFilter}
        `;
        
        const [salesInventory] = await db.query(query, queryParams);

        res.json(salesInventory);
    } catch (error) {
        console.error('Error fetching inventory report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Firm / Business Details for report headers
exports.getFirmDetails = async (req, res) => {
    try {
        const adminId = req.user.id;
        const branchId = req.user.branch_id;

        // Fetch admin (business owner) details
        const [admins] = await db.query(
            `SELECT business_name, admin_name, email, phone, address, city, state, pincode, country, business_type, gst_number, logo_url
             FROM admins WHERE id = ? LIMIT 1`,
            [adminId]
        );

        // Fetch POS settings for GSTIN and shop name
        const [posRows] = await db.query(
            `SELECT shop_name, gstin, enable_gst, show_hsn, default_gst_preset
             FROM pos_settings WHERE admin_id = ? LIMIT 1`,
            [adminId]
        );

        // Fetch branch details
        let branch = null;
        if (branchId) {
            const [branchRows] = await db.query(
                `SELECT name, address, city, state, pincode, phone, email, gst_number
                 FROM branches WHERE id = ? AND admin_id = ? LIMIT 1`,
                [branchId, adminId]
            );
            branch = branchRows[0] || null;
        }

        const admin = admins[0] || {};
        const pos   = posRows[0] || {};

        // Compose full address
        const fullAddress = [
            branch ? branch.address : admin.address,
            branch ? branch.city   : admin.city,
            branch ? branch.state  : admin.state,
            branch ? branch.pincode: admin.pincode,
            admin.country || 'India'
        ].filter(Boolean).join(', ');

        res.json({
            businessName  : pos.shop_name || admin.business_name || 'Your Business',
            gstin         : pos.gstin || admin.gst_number || 'N/A',
            ownerName     : admin.admin_name || '',
            email         : branch ? branch.email : admin.email,
            phone         : branch ? branch.phone : admin.phone,
            address       : fullAddress,
            city          : branch ? branch.city  : admin.city,
            state         : branch ? branch.state : admin.state,
            pincode       : branch ? branch.pincode : admin.pincode,
            businessType  : admin.business_type || '',
            branchName    : branch ? branch.name : 'Main Branch',
            enableGST     : pos.enable_gst === 1,
            showHSN       : pos.show_hsn === 1,
            defaultGSTRate: pos.default_gst_preset || 18,
            logoUrl       : admin.logo_url || null,
        });
    } catch (error) {
        console.error('Error fetching firm details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
