import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const KIWIFY_TOKEN = 'sdf9bzu97n9';
const PRODUCT_ID = 'cce3cc00-380c-11f1-b0e7-3f7a361bf7ae';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const urlToken = req.nextUrl.searchParams.get('token');
    const signature = req.headers.get('x-kiwify-signature');

    // Se tiver o token correto na URL, ignora a assinatura (Passe Livre)
    let isAuthorized = false;
    
    if (urlToken === KIWIFY_TOKEN) {
      isAuthorized = true;
    } else if (signature) {
      const hmac = crypto.createHmac('sha1', KIWIFY_TOKEN);
      hmac.update(rawBody);
      const calculatedSignature = hmac.digest('hex');
      if (signature === calculatedSignature) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.error('Kiwify Webhook: Unauthorized access attempt');
      return NextResponse.json({ error: 'Missing or invalid signature/token' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Validação de ID do Produto (Garantir que é o produto certo)
    const receivedProductId = payload.product_id || payload.product?.id || payload.id_produto;
    
    // Se for um teste da Kiwify (test_webhook: true), ignoramos temporariamente o ID para garantir que funciona
    const isTest = payload.test_webhook === true || payload.is_test === true;

    if (receivedProductId !== PRODUCT_ID && !isTest) {
      console.log(`Kiwify Webhook: Ignored product ID ${receivedProductId}. Expected: ${PRODUCT_ID}`);
      return NextResponse.json({ success: true, message: 'Product ignored' });
    }

    // Kiwify payload structure
    const email = payload.Customer?.email || payload.customer?.email || payload.email || (isTest ? 'teste_kiwify@exemplo.com' : null);
    const status = payload.order_status || payload.subscription_status || payload.status;

    if (!email) {
      console.error('Kiwify Webhook: No email found in payload', payload);
      return NextResponse.json({ error: 'No email found in payload' }, { status: 400 });
    }

    console.log(`Received Kiwify webhook for ${email} with status ${status}`);

    // LOGICA DE TESTE: Sempre cria este usuário se o token estiver correto
    try {
      await prisma.user.upsert({
        where: { email: 'contato_webhook@teste.com' },
        update: { status: 'ativo' },
        create: { 
          email: 'contato_webhook@teste.com', 
          status: 'ativo', 
          role: 'USER', 
          name: 'Teste Conexao Webhook' 
        }
      });
      console.log('Fixed test user created/updated successfully');
    } catch (e) {
      console.error('Error creating fixed test user:', e);
    }

    // Statuses that grant access
    const activeStatuses = ['approved', 'paid', 'active'];
    // Statuses that revoke access
    const inactiveStatuses = ['refunded', 'chargeback', 'canceled', 'expired', 'waiting_payment', 'refused'];

    if (activeStatuses.includes(status)) {
      await prisma.user.upsert({
        where: { email },
        update: { status: 'ativo' },
        create: { email, status: 'ativo', role: 'USER' }
      });
      console.log(`Granted access to ${email}`);
    } else if (inactiveStatuses.includes(status)) {
      await prisma.user.upsert({
        where: { email },
        update: { status: 'inativo' },
        create: { email, status: 'inativo', role: 'USER' }
      });
      console.log(`Revoked access from ${email}`);
    } else {
      console.log(`Ignored status ${status} for ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
