const { GoogleGenAI } = require('@google/genai');
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

async function main() {
  try {
    const models = await genAI.models.list();
    console.log(models.models.map(m => m.name));
  } catch (e) {
    console.error(e);
  }
}
main();
