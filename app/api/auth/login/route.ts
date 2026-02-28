import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

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

    const [rows] = await pool.query(
      'SELECT status FROM usuarios WHERE email = ?',
      [cleanEmail]
    );

    const users = rows as any[];

    if (users.length > 0 && users[0].status === 'ativo') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Acesso negado. Verifique se você comprou o produto e se a compra foi aprovada.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
