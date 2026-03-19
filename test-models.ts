
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

async function listModels() {
  try {
    console.log("Checking API Key:", process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(0, 5) + "...");
    // The @google/genai SDK usually has a way to list models or just try a simple call.
    // If it's the newer SDK, it might be different.
    
    const result = await (ai as any).models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello',
      config: { temperature: 0.1 }
    });
    console.log("Success with gemini-2.5-flash:", result.text);
  } catch (err: any) {
    console.error("Error with gemini-2.5-flash:", err.message || err);
    if (err.message && err.message.includes('not found')) {
        console.log("Model not found. Trying gemini-2.0-flash...");
        try {
            const result = await (ai as any).models.generateContent({
                model: 'gemini-2.0-flash',
                contents: 'Hello',
                config: { temperature: 0.1 }
            });
            console.log("Success with gemini-2.0-flash:", result.text);
        } catch (err2: any) {
            console.error("Error with gemini-2.0-flash:", err2.message || err2);
        }
    }
  }
}

listModels();
