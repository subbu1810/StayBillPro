const fs = require('fs');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testUpload() {
    try {
        console.log("Reading dummy image...");
        const imgBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");
        
        const form = new FormData();
        form.append('document', imgBuffer, { filename: 'test.png', contentType: 'image/png' });

        const token = jwt.sign({ id: 3, role: 'SUPERADMIN' }, 'your_super_secret_jwt_key_123', { expiresIn: '1h' });

        console.log("Sending POST to localhost:5002/api/ocr/scan-bill...");
        const response = await axios.post('http://localhost:5002/api/ocr/scan-bill', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log("Status:", response.status);
        console.log("Response:", response.data);
    } catch(e) {
        if(e.response) {
            console.error("Test failed with status:", e.response.status);
            console.error(e.response.data);
        } else {
            console.error("Test failed:", e.message);
        }
    }
}
testUpload();
