import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const jwtSecret = process.env.JWT_SECRET;
    if (!convexUrl || !jwtSecret) {
      return NextResponse.json({ error: 'Configuração do servidor ausente.' }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);

    // Get existing user
    const existingUser = await convex.query(api.users.getUserByEmail, {
      email: cleanEmail,
      secret: jwtSecret,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Cenário A: O e-mail já existe (Webhook foi rápido)
      // Apenas garantimos que ele tenha a senha para o login
      if (!existingUser.password) {
        await convex.mutation(api.users.updateUser, {
          id: existingUser._id,
          password: hashedPassword,
          isVerified: true,
          secret: jwtSecret,
        });
      }
      return NextResponse.json({ 
        success: true, 
        message: 'Conta criada com sucesso! Redirecionando...',
        status: existingUser.status 
      });
    } else {
      // Cenário B: O e-mail não existe (Webhook atrasado ou acesso manual)
      const newUser = await convex.mutation(api.users.createUser, {
        email: cleanEmail,
        password: hashedPassword,
        status: 'pendente',
        isVerified: true,
        role: 'USER',
        secret: jwtSecret,
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
