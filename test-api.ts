import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
const MODEL_NAME = 'gemini-1.5-pro';

async function run() {
  const reqPautaOptions: any = {
    model: MODEL_NAME,
    contents: "Fale sobre a bolsa de valores.",
    config: { temperature: 0.7, topP: 0.95, tools: [{ googleSearch: {} }] }
  };

  try {
    const resultPauta = await (ai as any).models.generateContent(reqPautaOptions);
    console.log("Success:", resultPauta.text);
  } catch (err) {
    console.error("Error SDK:", err);
  }
}
run();
