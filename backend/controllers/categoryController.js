const db = require('../config/db');
const { GoogleGenAI } = require('@google/genai');
// Get all categories for an admin
exports.getCategories = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { type, branch_id } = req.query; // optional filter by type
        
        let query = 'SELECT * FROM categories WHERE admin_id = ?';
        let params = [adminId];
        
        if (type) {
            query += ' AND (type = ? OR type = "both")';
            params.push(type);
        }

        if (branch_id) {
            query += ' AND branch_id = ?';
            params.push(branch_id);
        }
        
        const [categories] = await db.query(query, params);
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { name, type, branch_id } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO categories (admin_id, branch_id, name, type) VALUES (?, ?, ?, ?)',
            [adminId, branch_id, name, type || 'both']
        );
        
        res.status(201).json({ 
            message: "Category created successfully", 
            id: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating category", error: error.message });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        const { name, type } = req.body;
        
        await db.query(
            'UPDATE categories SET name = ?, type = ? WHERE id = ? AND admin_id = ?',
            [name, type, id, adminId]
        );
        
        res.json({ message: "Category updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating category", error: error.message });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;
        
        await db.query('DELETE FROM categories WHERE id = ? AND admin_id = ?', [id, adminId]);
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
};

// Auto-categorize an item using AI
exports.autoCategorize = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { itemName } = req.body;

        if (!itemName) {
            return res.status(400).json({ message: "Item name is required" });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.status(500).json({ message: 'GEMINI_API_KEY is missing or not configured' });
        }

        // Fetch existing categories for context
        const [categories] = await db.query('SELECT name FROM categories WHERE admin_id = ?', [adminId]);
        const categoryNames = categories.map(c => c.name).join(', ');

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `You are an inventory item categorization assistant.

Input:
* Item Name: ${itemName}
* Existing Categories: ${categoryNames}

Task:
1. Analyze the item name and determine the most appropriate category from the existing categories.
2. If multiple categories are relevant, choose the single best match.
3. If none of the existing categories reasonably fit, create one new concise category name.
4. Prefer broader inventory categories over highly specific ones unless a specific category already exists.
5. Use common business-friendly category names.

Output Rules:
* Return ONLY the category name.
* Do NOT include explanations, confidence scores, reasoning, punctuation, quotes, markdown, or additional text.
* Output must be a single category name or short category phrase.`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        });

        const suggestedCategory = result.text.trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes if any

        res.json({ category: suggestedCategory });
    } catch (error) {
        console.error('AI Categorization Error:', error);
        res.status(500).json({ message: "Error during AI categorization", error: error.message });
    }
};
