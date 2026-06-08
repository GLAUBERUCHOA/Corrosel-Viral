import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt, type, customApiKey } = body;
        
        if (!prompt || !type) {
            return NextResponse.json({ error: 'Prompt and type are required' }, { status: 400 });
        }

        const apiKey = customApiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const response = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        if (type === 'text') {
            return NextResponse.json({ text: response.response.text() });
        } else if (type === 'image') {
            const parts = response.response?.candidates?.[0]?.content?.parts || [];
            return NextResponse.json({ parts });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error: any) {
        console.error('Error generating content:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
