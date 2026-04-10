import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email missing' }, { status: 400 });

    const cleanEmail = email.toLowerCase().trim();
    const user = await (prisma.user as any).findUnique({
      where: { email: cleanEmail },
      select: { nicho: true, publicoAlvo: true, objetivo: true, cta: true, geminiApiKey: true, role: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Mascara a API key: mostra só os últimos 4 chars
    const maskedKey = user.geminiApiKey 
      ? '••••••••' + user.geminiApiKey.slice(-4) 
      : '';

    return NextResponse.json({ 
      success: true, 
      data: { 
        nicho: user.nicho, 
        publicoAlvo: user.publicoAlvo, 
        objetivo: user.objetivo, 
        cta: user.cta,
        geminiApiKey: maskedKey,
        hasApiKey: !!user.geminiApiKey,
        role: user.role
      } 
    });
  } catch (error) {
    console.error('Error fetching user setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, nicho, publicoAlvo, objetivo, cta, geminiApiKey } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email missing' }, { status: 400 });

    const cleanEmail = email.toLowerCase().trim();
    
    // Só atualiza a API key se o valor não for a máscara
    const updateData: any = { nicho, publicoAlvo, objetivo, cta };
    if (geminiApiKey && !geminiApiKey.startsWith('••••')) {
      updateData.geminiApiKey = geminiApiKey;
    }

    const user = await (prisma.user as any).update({
      where: { email: cleanEmail },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        nicho: user.nicho, 
        publicoAlvo: user.publicoAlvo, 
        objetivo: user.objetivo, 
        cta: user.cta 
      } 
    });
  } catch (error) {
    console.error('Error updating user setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
