import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
      return NextResponse.json({ success: true });
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

    if (!user.password) {
      // User doesn't have a password yet (First Access from Kiwify for example)
      if (!isSettingPassword) {
        return NextResponse.json({ error: 'FIRST_ACCESS', message: 'Primeiro acesso detectado.' }, { status: 400 });
      }

      // Hash and save the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      return NextResponse.json({ success: true, message: 'Senha criada com sucesso!' });
    }

    // User already has a password, verify it
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'A senha inserida está incorreta.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
