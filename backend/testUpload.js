const fs = require('fs');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

async function testUpload() {
    try {
        console.log("Reading dummy image...");
        const imgBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");
        
        const form = new FormData();
        form.append('document', imgBuffer, { filename: 'test.png', contentType: 'image/png' });

        const token = jwt.sign({ id: 1, role: 'SUPERADMIN' }, 'your_super_secret_jwt_key_123', { expiresIn: '1h' });

        console.log("Sending POST to localhost:5000/api/ocr/scan-bill...");
        const response = await fetch('http://localhost:5000/api/ocr/scan-bill', {
            method: 'POST',
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            },
            body: form
        });
        
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response:", text);
    } catch(e) {
        console.error("Test failed:", e);
    }
}
testUpload();
