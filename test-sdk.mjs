import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "AIzaSyAHGLryzyLeArAFngaAyNG0YKml0u7NVgc" });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: "Fale uma frase sobre marketing digital.",
      config: { temperature: 0.7 }
    });
    console.log("SUCCESS:", res.text.substring(0, 100));
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
