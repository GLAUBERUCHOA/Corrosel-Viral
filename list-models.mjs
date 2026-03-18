import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "AIzaSyAHGLryzyLeArAFngaAyNG0YKml0u7NVgc" });
async function run() {
  try {
    const models = await ai.models.list();
    console.log("Models:", JSON.stringify(models, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
