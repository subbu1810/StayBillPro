const db = require('./config/db');
const { createReturn } = require('./controllers/returnController');

async function testReturns() {
    try {
        console.log("Setting up mock product in sales_inventory...");
        
        // Ensure product exists
        await db.execute(
            `INSERT INTO sales_inventory (id, admin_id, branch_id, name, quantity, price) 
             VALUES (3, 3, 1, 'LG Refrigerator', 10, 30000) 
             ON DUPLICATE KEY UPDATE quantity = 10`
        );

        console.log("Checking current stock for product_id 3...");
        const [salesStockBefore] = await db.execute('SELECT quantity FROM sales_inventory WHERE id = 3 AND admin_id = 3');
        const [serviceStockBefore] = await db.execute('SELECT quantity FROM service_inventory WHERE id = 3 AND admin_id = 3');
        
        console.log("Sales Stock Before:", salesStockBefore[0]?.quantity);
        console.log("Service Stock Before:", serviceStockBefore[0]?.quantity);

        // Mock req and res
        const req = {
            user: { id: 3 }, // admin_id
            body: {
                invoiceId: 5,
                reason: "Customer changed mind",
                paymentMethod: "cash",
                items: [
                    {
                        productId: 3,
                        quantity: 1,
                        unitPrice: 30000,
                        refundPrice: 30000
                    }
                ]
            }
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log(`Response [${this.statusCode}]:`, data);
            }
        };

        console.log("\\nExecuting returnController.createReturn()...");
        await createReturn(req, res);

        console.log("\\nChecking stock after return...");
        const [salesStockAfter] = await db.execute('SELECT quantity FROM sales_inventory WHERE id = 3 AND admin_id = 3');
        const [serviceStockAfter] = await db.execute('SELECT quantity FROM service_inventory WHERE id = 3 AND admin_id = 3');
        
        console.log("Sales Stock After:", salesStockAfter[0]?.quantity);
        console.log("Service Stock After:", serviceStockAfter[0]?.quantity);

        console.log("\\nChecking return records...");
        const [returns] = await db.execute('SELECT * FROM sales_returns ORDER BY id DESC LIMIT 1');
        console.log("Latest Return Record:", returns[0]);
        
        if (returns.length > 0) {
            const [returnItems] = await db.execute('SELECT * FROM sales_return_items WHERE return_id = ?', [returns[0].id]);
            console.log("Return Items:", returnItems);
        }

    } catch (e) {
        console.error("Test error:", e);
    } finally {
        process.exit();
    }
}

testReturns();
