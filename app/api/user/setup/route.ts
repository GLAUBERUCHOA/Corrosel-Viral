import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email missing' }, { status: 400 });

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { nicho: true, publicoAlvo: true, objetivo: true, cta: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, nicho, publicoAlvo, objetivo, cta } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email missing' }, { status: 400 });

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.update({
      where: { email: cleanEmail },
      data: { nicho, publicoAlvo, objetivo, cta }
    });

    return NextResponse.json({ success: true, data: { nicho: user.nicho, publicoAlvo: user.publicoAlvo, objetivo: user.objetivo, cta: user.cta } });
  } catch (error) {
    console.error('Error updating user setup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
