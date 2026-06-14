require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
    try {
        console.log("Initializing Gemini with key:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        console.log("Generating content...");
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello, are you there?'
        });
        console.log("SUCCESS!");
        console.log(result.text);
    } catch (error) {
        console.error("FAILED!");
        console.error(error);
    }
}
test();
