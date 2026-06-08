import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
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

    // Mascara a API key: mostra só os últimos 4 chars
    const maskedKey = user.geminiApiKey 
      ? '••••••••' + user.geminiApiKey.slice(-4) 
      : '';

    return NextResponse.json({ 
      success: true, 
      data: { 
        nicho: user.nicho || '', 
        publicoAlvo: user.publicoAlvo || '', 
        objetivo: user.objetivo || '', 
        cta: user.cta || '',
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

    // Só atualiza a API key se o valor não for a máscara
    const updateData: any = { 
      id: user._id,
      nicho, 
      publicoAlvo, 
      objetivo, 
      cta,
      secret: jwtSecret,
    };
    
    if (geminiApiKey && !geminiApiKey.startsWith('••••')) {
      updateData.geminiApiKey = geminiApiKey;
    }

    const updatedUser = await convex.mutation(api.users.updateUser, updateData);

    return NextResponse.json({ 
      success: true, 
      data: { 
        nicho: updatedUser.nicho || '', 
        publicoAlvo: updatedUser.publicoAlvo || '', 
        objetivo: updatedUser.objetivo || '', 
        cta: updatedUser.cta || '' 
      } 
    });
  } catch (error) {
    console.error('Error updating user setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
