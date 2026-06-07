const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db');

exports.scanBill = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No document uploaded' });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is missing or not configured in .env' });
        }

        // Wallet Check
        const businessId = req.user.businessId || req.user.id; // From authMiddleware
        const [bizUsers] = await db.query('SELECT scan_wallet_balance FROM admins WHERE id = ?', [businessId]);
        if (bizUsers.length === 0) {
            return res.status(403).json({ success: false, message: 'Account not found' });
        }
        
        const walletBalance = parseFloat(bizUsers[0].scan_wallet_balance || 0);
        if (walletBalance < 5.00) {
            return res.status(402).json({ success: false, message: 'Insufficient Scan Wallet balance. Please contact StayBillPro support to recharge.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // Convert buffer to base64
        const base64Data = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';

        const prompt = `Extract the following details from this invoice document and return the data STRICTLY as a JSON object with this exact structure:
{
  "supplierName": "Name of the supplier",
  "invoiceNumber": "Invoice number",
  "items": [
    {
      "name": "Name of the item or product",
      "hsn": "HSN Code",
      "gst": 0.0,
      "quantity": 0,
      "netRate": 0.0,
      "rate": 0.0,
      "discount": 0.0,
      "amount": 0.0
    }
  ]
}
Return ONLY valid JSON. Do not include markdown formatting or backticks.`;

        let response;
        try {
            console.log("Attempting OCR with gemini-flash-latest...");
            response = await ai.models.generateContent({
                model: 'gemini-flash-latest',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    data: base64Data,
                                    mimeType: mimeType
                                }
                            }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                }
            });
        } catch (err) {
            console.error("OCR failed with gemini-flash-latest:", err.message);
            throw err;
        }

        const rawText = response.text;
        console.log('--- GEMINI RAW JSON ---');
        console.log(rawText);

        let parsedData;
        try {
            parsedData = JSON.parse(rawText);
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", e);
            const match = rawText.match(/```json([\\s\\S]*?)```/);
            if (match) {
                parsedData = JSON.parse(match[1].trim());
            } else {
                throw new Error("Could not extract valid JSON from Gemini response");
            }
        }

        const items = (parsedData.items || []).map(item => ({
            name: item.name || "Unknown Item",
            hsn: item.hsn || "",
            gst: item.gst || 0,
            quantity: item.quantity || 0,
            netRate: item.netRate || 0,
            rate: item.rate || 0,
            discount: item.discount || 0,
            amount: item.amount || 0
        }));

        // Deduct 5 rupees from wallet
        const newBalance = walletBalance - 5.00;
        await db.query('UPDATE admins SET scan_wallet_balance = ? WHERE id = ?', [newBalance, businessId]);
        
        // Log transaction
        await db.query(
            'INSERT INTO wallet_transactions (admin_id, type, amount, description) VALUES (?, ?, ?, ?)',
            [businessId, 'deduction', 5.00, 'AI Document Scan']
        );

        res.json({
            success: true,
            supplierName: parsedData.supplierName || "",
            invoiceNumber: parsedData.invoiceNumber || "",
            rawText: rawText,
            items: items,
            newWalletBalance: newBalance
        });

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ success: false, message: 'AI Error: ' + error.message, error: error.stack });
    }
};
