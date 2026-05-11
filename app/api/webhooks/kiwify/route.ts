import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const urlToken = req.nextUrl.searchParams.get('token');
    const signature = req.headers.get('x-kiwify-signature');
    
    const KIWIFY_TOKEN = process.env.KIWIFY_TOKEN;
    const CVL_PRODUCT_ID = process.env.CVL_PRODUCT_ID;

    if (!KIWIFY_TOKEN || !CVL_PRODUCT_ID) {
      console.error('Kiwify Webhook: Environment variables missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

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

    // 1. Parsing Resiliente: Busca o produto principal
    const receivedProductId = payload.product_id || payload.Product?.product_id || payload.order?.Product?.product_id || payload.id_produto;

    // 2. O Segredo: Vasculha os Order Bumps da transação
    const orderBumps = payload.order_bumps || payload.order?.order_bumps || [];
    const isOrderBump = orderBumps.some((bump: any) => 
      bump.product_id === CVL_PRODUCT_ID || 
      bump.product?.product_id === CVL_PRODUCT_ID ||
      bump.id === CVL_PRODUCT_ID
    );

    const isTest = payload.test_webhook === true || payload.is_test === true;

    // 3. Se não for o produto principal E não estiver nos order bumps, ignora.
    if (receivedProductId !== CVL_PRODUCT_ID && !isOrderBump && !isTest) {
      console.log(`Kiwify Webhook: Ignorado. ID Principal: ${receivedProductId}. CVL não encontrado nos Order Bumps.`);
      return NextResponse.json({ success: true, message: 'Product ignored' });
    }

    const email = payload.Customer?.email || payload.customer?.email || payload.order?.Customer?.email || payload.email;
    const status = payload.order_status || payload.order?.order_status || payload.status;

    if (!email && !isTest) {
      console.error('Kiwify Webhook: No email found in payload', payload);
      return NextResponse.json({ error: 'No email found in payload' }, { status: 400 });
    }

    const finalEmail = (email || (isTest ? 'webhook_teste_sucesso@kiwify.com' : null))?.toLowerCase().trim();

    if (!finalEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    console.log(`Received Kiwify webhook for ${finalEmail} with status ${status}`);

    const activeStatuses = ['approved', 'paid', 'active'];
    const inactiveStatuses = ['refunded', 'chargeback', 'canceled', 'expired', 'waiting_payment', 'refused'];

    if (activeStatuses.includes(status)) {
      await prisma.user.upsert({
        where: { email: finalEmail },
        update: { 
          status: 'ativo',
          hasCuradoriaAccess: true 
        },
        create: { 
          email: finalEmail, 
          status: 'ativo', 
          role: 'USER',
          hasCuradoriaAccess: true
        }
      });
      console.log(`Granted access (including Curadoria) to ${finalEmail}`);
    } else if (inactiveStatuses.includes(status)) {
      await prisma.user.upsert({
        where: { email: finalEmail },
        update: { 
          status: 'inativo'
        },
        create: { 
          email: finalEmail, 
          status: 'inativo', 
          role: 'USER'
        }
      });
      console.log(`Revoked access from ${finalEmail}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


