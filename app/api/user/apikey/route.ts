import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Rota interna: retorna a API key real do usuário (usada apenas pelo frontend para disparar agentes)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email missing' }, { status: 400 });

    const cleanEmail = email.toLowerCase().trim();

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const jwtSecret = process.env.JWT_SECRET;
    if (!convexUrl || !jwtSecret) {
      return NextResponse.json({ error: 'Configuração do servidor ausente.' }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);
    const user = await convex.query(api.users.getUserByEmail, {
      email: cleanEmail,
      secret: jwtSecret,
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      apiKey: user.geminiApiKey || null 
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
