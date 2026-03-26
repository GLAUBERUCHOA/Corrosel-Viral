const { GoogleGenAI } = require('@google/genai');
const genAI = new GoogleGenAI({ apiKey: 'test' });
console.log('Interactions keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(genAI.interactions)));
