import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Bypass for admin
    if (cleanEmail === 'drglauberabreu@gmail.com') {
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (user && user.status === 'ativo') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Acesso negado. Verifique se você comprou o produto e se a compra foi aprovada.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
