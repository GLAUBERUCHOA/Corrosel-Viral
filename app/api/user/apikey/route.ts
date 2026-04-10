import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Rota interna: retorna a API key real do usuário (usada apenas pelo frontend para disparar agentes)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email missing' }, { status: 400 });

    const cleanEmail = email.toLowerCase().trim();
    const user = await (prisma.user as any).findUnique({
      where: { email: cleanEmail },
      select: { geminiApiKey: true }
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
