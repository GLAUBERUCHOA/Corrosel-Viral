import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'O e-mail é obrigatório' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Bypass for admin
    if (cleanEmail === 'drglauberabreu@gmail.com') {
      return NextResponse.json({ success: true, isFirstAccess: false, status: 'ativo' });
    }

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

    if (!user) {
      return NextResponse.json({ 
        error: 'NOT_FOUND', 
        message: 'E-mail não encontrado. Por favor, certifique-se de usar exatamente o mesmo e-mail que usou na compra da Kiwify.' 
      }, { status: 404 });
    }

    // Se o usuário existe, mas não está ativo nem pendente (ex: inativo)
    if (user.status !== 'ativo' && user.status !== 'pendente') {
      return NextResponse.json({ 
        error: 'FORBIDDEN', 
        message: 'Sua conta está inativa. Entre em contato com o suporte.' 
      }, { status: 403 });
    }

    // Se o usuário já tiver senha, não é primeiro acesso
    const isFirstAccess = !user.password;

    return NextResponse.json({ 
      success: true, 
      isFirstAccess,
      status: user.status 
    });

  } catch (error) {
    console.error('Error in check auth:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
