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
    
    // Se for um teste da Kiwify (test_webhook: true), permitimos passar
    const isTest = payload.test_webhook === true || payload.is_test === true;

    if (receivedProductId !== PRODUCT_ID && !isTest) {
      console.log(`Kiwify Webhook: Ignored product ID ${receivedProductId}. Expected: ${PRODUCT_ID}`);
      return NextResponse.json({ success: true, message: 'Product ignored' });
    }

    // Kiwify payload structure
    const email = payload.Customer?.email || payload.customer?.email || payload.email;
    const status = payload.order_status || payload.subscription_status || payload.status;

    if (!email && !isTest) {
      console.error('Kiwify Webhook: No email found in payload', payload);
      return NextResponse.json({ error: 'No email found in payload' }, { status: 400 });
    }

    // Email fallback para teste se necessário
    const finalEmail = email || (isTest ? 'webhook_teste_sucesso@kiwify.com' : null);

    if (!finalEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    console.log(`Received Kiwify webhook for ${finalEmail} with status ${status}`);

    // Statuses that grant access
    const activeStatuses = ['approved', 'paid', 'active'];
    // Statuses that revoke access
    const inactiveStatuses = ['refunded', 'chargeback', 'canceled', 'expired', 'waiting_payment', 'refused'];

    if (activeStatuses.includes(status)) {
      await prisma.user.upsert({
        where: { email: finalEmail },
        update: { status: 'ativo' },
        create: { email: finalEmail, status: 'ativo', role: 'USER' }
      });
      console.log(`Granted access to ${finalEmail}`);
    } else if (inactiveStatuses.includes(status)) {
      await prisma.user.upsert({
        where: { email: finalEmail },
        update: { status: 'inativo' },
        create: { email: finalEmail, status: 'inativo', role: 'USER' }
      });
      console.log(`Revoked access from ${finalEmail}`);
    } else {
      console.log(`Ignored status ${status} for ${finalEmail}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
