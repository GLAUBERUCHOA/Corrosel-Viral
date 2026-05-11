import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Supabase Auth Registration
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Prisma Sync Logic
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    // Hash the password to keep it in sync with the existing login logic (optional but safer for legacy compatibility)
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Cenário A: O e-mail já existe (Webhook foi rápido)
      // Apenas garantimos que ele tenha a senha para o login legado (se necessário)
      if (!existingUser.password) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { 
            password: hashedPassword,
            isVerified: true
          }
        });
      }
      return NextResponse.json({ 
        success: true, 
        message: 'Conta criada com sucesso! Redirecionando...',
        status: existingUser.status 
      });
    } else {
      // Cenário B: O e-mail não existe (Webhook atrasado ou acesso manual)
      const newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          status: 'pendente',
          hasCuradoriaAccess: false,
          isVerified: true,
          role: 'USER'
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Registro recebido! Aguarde a liberação.',
        status: 'pendente' 
      });
    }

  } catch (error: any) {
    console.error('Error in register:', error);
    return NextResponse.json({ error: 'Erro interno ao criar conta.' }, { status: 500 });
  }
}
