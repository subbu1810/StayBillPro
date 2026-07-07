const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // JS String templates: POSINV${String(id).padStart(2, '0')} -> POSINV${String(id).padStart(2, '0')}
    content = content.replace(/INV-\$\{String\((.*?)\)\.padStart\(4,\s*'0'\)\}/g, "POSINV${String($1).padStart(2, '0')}");
    
    // React JSX templates: POSINV{String(id).padStart(2, '0')} -> POSINV{String(id).padStart(2, '0')}
    content = content.replace(/INV-\{String\((.*?)\)\.padStart\(4,\s*'0'\)\}/g, "POSINV{String($1).padStart(2, '0')}");
    
    // React JSX toString templates: POSINV{id.toString().padStart(2, '0')} -> POSINV{id.toString().padStart(2, '0')}
    content = content.replace(/INV-\{(.*?)\.toString\(\)\.padStart\(4,\s*'0'\)\}/g, "POSINV{$1.toString().padStart(2, '0')}");
    
    // SQL LPAD: CONCAT('POSINV', LPAD(i.id, 2, '0')) -> CONCAT('POSINV', LPAD(i.id, 2, '0'))
    content = content.replace(/CONCAT\('INV-', LPAD\((.*?),\s*4,\s*'0'\)\)/g, "CONCAT('POSINV', LPAD($1, 2, '0'))");
    
    // Hardcoded string templates without padStart: POSINV${String(invoiceId).padStart(2, '0')} -> POSINV${invoiceId}
    // Only in specific cases like billingController.js
    content = content.replace(/INV-\$\{invoiceId\}/g, "POSINV${String(invoiceId).padStart(2, '0')}");

    fs.writeFileSync(filePath, content, 'utf8');
}

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            // Skip node_modules and .git
            if (!file.includes('node_modules') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else { 
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const rootDir = path.resolve(__dirname, '..');
const files = walk(rootDir);

files.forEach(file => {
    replaceInFile(file);
});
console.log('Replaced invoice format in files.');
