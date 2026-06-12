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

        // 1. Deduct 5 rupees from wallet upfront
        let currentBalance = walletBalance - 5.00;
        await db.query('UPDATE admins SET scan_wallet_balance = ? WHERE id = ?', [currentBalance, businessId]);
        
        // Log deduction transaction
        await db.query(
            'INSERT INTO wallet_transactions (admin_id, type, amount, description) VALUES (?, ?, ?, ?)',
            [businessId, 'deduction', 5.00, 'AI Document Scan']
        );

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // Convert buffer to base64
        const base64Data = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';

        const prompt = `You are an invoice data extraction engine.

Extract the invoice details from the provided document.

Rules:
1. Return ONLY a valid JSON object.
2. Do NOT include markdown, code blocks, explanations, notes, or additional text.
3. If a value is missing or cannot be determined, use null.
4. Do NOT guess or infer values.
5. Convert numeric values to numbers (not strings).
6. Extract all line items found in the invoice.
7. Preserve item names exactly as they appear in the document.
8. For GST percentage, return only the numeric value (e.g., 18, 12, 5).
9. If HSN code is not available, return null.
10. Ensure the response is valid JSON that can be parsed directly using JSON.parse().

Expected JSON structure:

{
  "supplierName": null,
  "invoiceNumber": null,
  "items": [
    {
      "name": null,
      "hsn": null,
      "gst": null,
      "quantity": null,
      "netRate": null,
      "rate": null,
      "discount": null,
      "amount": null
    }
  ]
}`;

        async function callGeminiWithRetry(promptText, inlineData, retries = 3) {
            for (let i = 0; i < retries; i++) {
                try {
                    console.log(`Attempting OCR with gemini-2.5-flash... (Attempt: ${i + 1})`);
                    const result = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    { text: promptText },
                                    inlineData
                                ]
                            }
                        ],
                        config: {
                            responseMimeType: "application/json",
                        }
                    });
                    return result;
                } catch (error) {
                    const errString = error.message ? error.message.toLowerCase() : '';
                    if (
                        (errString.includes("503") || errString.includes("429") || errString.includes("exhausted") || errString.includes("unavailable") || error.status === 503 || error.status === 429) &&
                        i < retries - 1
                    ) {
                        console.log(`Rate limit or 503 hit. Retrying in ${(i + 1) * 3000}ms...`);
                        await new Promise(resolve =>
                            setTimeout(resolve, (i + 1) * 3000)
                        );
                        continue;
                    }
                    console.error("OCR failed with gemini-2.5-flash:", error.message);
                    throw error;
                }
            }
        }

        const inlineData = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        const response = await callGeminiWithRetry(prompt, inlineData, 3);

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


        res.json({
            success: true,
            supplierName: parsedData.supplierName || "",
            invoiceNumber: parsedData.invoiceNumber || "",
            rawText: rawText,
            items: items,
            newWalletBalance: currentBalance
        });

    } catch (error) {
        console.error('OCR Error:', error);
        
        // Refund 5 rupees on error
        try {
            const businessId = req.user.businessId || req.user.id;
            const [bizUsers] = await db.query('SELECT scan_wallet_balance FROM admins WHERE id = ?', [businessId]);
            if (bizUsers.length > 0) {
                const currentBal = parseFloat(bizUsers[0].scan_wallet_balance || 0);
                const refundedBalance = currentBal + 5.00;
                
                await db.query('UPDATE admins SET scan_wallet_balance = ? WHERE id = ?', [refundedBalance, businessId]);
                
                await db.query(
                    'INSERT INTO wallet_transactions (admin_id, type, amount, description) VALUES (?, ?, ?, ?)',
                    [businessId, 'recharge', 5.00, 'Refund for Failed AI Scan']
                );
                console.log(`Refunded 5.00 to business ${businessId} due to OCR failure.`);
            }
        } catch (refundError) {
            console.error('CRITICAL: Failed to refund wallet after OCR error:', refundError);
        }

        const errStr = error.message ? error.message.toLowerCase() : '';
        if (error.status === 503 || errStr.includes('503') || errStr.includes('unavailable') || errStr.includes('high demand') || errStr.includes('429') || errStr.includes('exhausted')) {
            return res.status(503).json({ success: false, message: 'The AI service is currently busy.\nPlease try again in a few moments.' });
        }

        res.status(500).json({ success: false, message: 'AI Error: ' + error.message, error: error.stack });
    }
};
