import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user || user.status !== 'ativo') {
      return NextResponse.json({ error: 'Acesso negado. Verifique se você comprou o produto e se a compra foi aprovada.' }, { status: 403 });
    }

    let isPasswordValid = false;

    if (!user.password) {
      // Primeiro Acesso
      if (!isSettingPassword) {
        return NextResponse.json({ error: 'FIRST_ACCESS', message: 'Primeiro acesso detectado.' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const otpCode = generateOTP();
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          verificationCode: otpCode,
          isVerified: false
        }
      });

      // Dispara o email
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: cleanEmail,
        subject: 'Seu Código de Ativação do Carrossel Viral Lab',
        html: `<p>Olá!</p>
               <p>Seu código de ativação de 6 dígitos para o Carrossel Viral Lab é:</p>
               <h2 style="font-size: 24px; font-family: monospace; letter-spacing: 5px;">${otpCode}</h2>
               <p>Se você não solicitou este código, ignore este e-mail.</p>`
      });

      return NextResponse.json({ error: 'OTP_REQUIRED', message: 'Código enviado para o seu e-mail.' }, { status: 200 });
    } else {
      // Validar senha existente
      isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'A senha inserida está incorreta.' }, { status: 401 });
      }

      // Senha certa, mas não verificado? Manda OTP de novo.
      if (!user.isVerified) {
        const otpCode = generateOTP();
        await prisma.user.update({
          where: { id: user.id },
          data: { verificationCode: otpCode }
        });

        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: cleanEmail,
          subject: 'Seu Código de Ativação do Carrossel Viral Lab (Reenvio)',
          html: `<p>Olá!</p>
                 <p>Seu código de ativação de 6 dígitos para o Carrossel Viral Lab é:</p>
                 <h2 style="font-size: 24px; font-family: monospace; letter-spacing: 5px;">${otpCode}</h2>
                 <p>Se você não solicitou este código, ignore este e-mail.</p>`
        });

        return NextResponse.json({ error: 'OTP_REQUIRED', message: 'Código de ativação reenviado para o seu e-mail.' }, { status: 200 });
      }

      // Tudo certo
      return NextResponse.json({ success: true, isVerified: true });
    }

  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
