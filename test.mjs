const API_KEY = "AIzaSyAHGLryzyLeArAFngaAyNG0YKml0u7NVgc";
const MODEL = "gemini-1.5-pro-latest";

async function run() {
  const payload = {
    contents: [{ parts: [{ text: "Fale sobre a bolsa de valores." }] }],
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0.7 }
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
