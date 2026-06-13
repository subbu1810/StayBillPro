const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const filesToUpdate = [
    'InventoryScreen.js',
    'CreateGRNModal.js',
    'CreatePOModal.js',
    'pos/POSBillingPage.js',
    'pos/WholesaleBillingPage.js',
    'PurchaseScreen.js',
    'QuotationScreen.js'
];

filesToUpdate.forEach(file => {
    const filePath = path.join(componentsDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Simple regex to add step="any" to input type="number" if it doesn't have step already
        const updatedContent = content.replace(/<input([^>]*?)type=["']number["']([^>]*?)>/gi, (match, p1, p2) => {
            if (match.includes('step=')) return match;
            return `<input${p1}type="number" step="any"${p2}>`;
        });
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent);
            console.log(`Updated ${file}`);
        }
    }
});
