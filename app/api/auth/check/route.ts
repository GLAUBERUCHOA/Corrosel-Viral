import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'O e-mail é obrigatório' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Bypass for admin
    if (cleanEmail === 'drglauberabreu@gmail.com') {
      return NextResponse.json({ success: true, isFirstAccess: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user || user.status !== 'ativo') {
      return NextResponse.json({ 
        error: 'NOT_FOUND', 
        message: 'E-mail não encontrado. Por favor, certifique-se de usar exatamente o mesmo e-mail que usou na compra da Kiwify.' 
      }, { status: 404 });
    }

    // Se o usuário já tiver senha, não é primeiro acesso
    const isFirstAccess = !user.password;

    return NextResponse.json({ success: true, isFirstAccess });

  } catch (error) {
    console.error('Error in check auth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
