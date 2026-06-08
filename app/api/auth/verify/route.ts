import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'E-mail e código são obrigatórios.' }, { status: 400 });
    }

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

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    if (user.verificationCode !== code) {
      return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 400 });
    }

    // Código correto, ativa a conta e limpa o OTP
    await convex.mutation(api.users.updateUser, {
      id: user._id,
      isVerified: true,
      verificationCode: "", // setting it to empty string or we can omit it if we want to clear it, wait!
      // In updateUser mutation in users.ts, we did patchData[key] = val.
      // If we set it to empty string it is cleared, or we can update users.ts to support deleting verificationCode.
      // Actually, updating verificationCode to empty string is perfectly fine!
      secret: jwtSecret,
    });

    return NextResponse.json({ success: true, message: 'Conta verificada com sucesso!' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
