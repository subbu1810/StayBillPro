const db = require('./config/db');

async function seed() {
    try {
        console.log("Starting seeding process...");
        
        // Let's first ensure we have an admin and a branch
        const [admins] = await db.query("SELECT id FROM admins LIMIT 1");
        if (admins.length === 0) {
            console.log("No admin found. Cannot seed.");
            process.exit(1);
        }
        const aId = admins[0].id;

        const [branches] = await db.query("SELECT id FROM branches WHERE admin_id = ? LIMIT 1", [aId]);
        if (branches.length === 0) {
            console.log("No branch found. Cannot seed.");
            process.exit(1);
        }
        const bId = branches[0].id;

        const catNames = ['Groceries', 'Snacks', 'Dairy', 'Beverages', 'Cleaning'];
        const categoryMap = {};

        for (const catName of catNames) {
            const [existingCat] = await db.query("SELECT id FROM categories WHERE name = ? AND admin_id = ? AND type = 'sales'", [catName, aId]);
            if (existingCat.length > 0) {
                categoryMap[catName] = existingCat[0].id;
            } else {
                const [result] = await db.query("INSERT INTO categories (admin_id, branch_id, name, type) VALUES (?, ?, ?, 'sales')", [aId, bId, catName]);
                categoryMap[catName] = result.insertId;
            }
        }

        const items = [];
        const units = ['Kg', 'Pcs', 'Ltr', 'Box'];
        const brands = ['Nestle', 'Britannia', 'Amul', 'Coca-Cola', 'HUL', 'P&G', 'ITC', 'Parle', 'Haldirams', 'Patanjali'];

        for (let i = 1; i <= 100; i++) {
            const categoryName = catNames[i % catNames.length];
            const categoryId = categoryMap[categoryName];
            const brand = brands[i % brands.length];
            
            const purchase_price = (Math.random() * 100 + 10).toFixed(2);
            const price = (parseFloat(purchase_price) * 1.3).toFixed(2);
            const wholesale_price = (parseFloat(purchase_price) * 1.15).toFixed(2);
            const unit = units[i % units.length];

            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + (i % 12) + 1);

            items.push([
                aId, bId, categoryId,
                `${brand} ${categoryName} Item ${i}`, // name
                brand, // brand
                `SKU-${1000 + i}`, // sku
                `HSN-${8000 + (i % 100)}`, // hsn_code
                unit, // unit
                i % 2 === 0 ? 18.0 : 5.0, // gst_rate
                `SN-${20000 + i}`, // serial_number
                `${(i % 10) + 1}x${(i % 10) + 2}`, // dimensions
                `${(i % 5) + 1} ${unit}`, // size
                price, // price
                purchase_price, // purchase_price
                wholesale_price, // wholesale_price
                5, // min_wholesale_qty
                Math.floor(Math.random() * 100) + 10, // quantity
                'available', // status
                futureDate.toISOString().split('T')[0] // expiry_date
            ]);
        }

        const query = `
            INSERT INTO sales_inventory (
                admin_id, branch_id, category_id, name, brand, sku, hsn_code, unit, gst_rate, 
                serial_number, dimensions, size, price, purchase_price, wholesale_price, 
                min_wholesale_qty, quantity, status, expiry_date
            ) VALUES ?
        `;

        await db.query(query, [items]);

        console.log("Successfully inserted 100 supermarket items.");
        process.exit(0);

    } catch (err) {
        console.error("Error seeding:", err);
        process.exit(1);
    }
}

seed();
