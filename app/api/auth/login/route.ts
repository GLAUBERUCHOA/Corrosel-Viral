import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, isSettingPassword } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Bypass for admin
    if (cleanEmail === 'drglauberabreu@gmail.com') {
      return NextResponse.json({ success: true, isVerified: true });
    }

    if (!password) {
      return NextResponse.json({ error: 'A senha é obrigatória.' }, { status: 400 });
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

    if (!user || user.status !== 'ativo') {
      return NextResponse.json({ error: 'Acesso negado. Verifique se você usou o mesmo e-mail da compra e se ela foi aprovada.' }, { status: 403 });
    }

    if (!user.password) {
      // Primeiro Acesso
      if (!isSettingPassword) {
        return NextResponse.json({ error: 'FIRST_ACCESS', message: 'Primeiro acesso detectado.' }, { status: 400 });
      }

      // Cria a senha e já deixa a conta verificada! Sem enviar e-mail.
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await convex.mutation(api.users.updateUser, {
        id: user._id,
        password: hashedPassword,
        isVerified: true,
        secret: jwtSecret,
      });

      return NextResponse.json({ success: true, isVerified: true });
    } else {
      // Validar senha existente
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'A senha inserida está incorreta.' }, { status: 401 });
      }

      // Tudo certo!
      return NextResponse.json({ success: true, isVerified: true });
    }

  } catch (error: any) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: `INTERNAL ERRO: ${error.message} - ${error.stack}` }, { status: 500 });
  }
}
