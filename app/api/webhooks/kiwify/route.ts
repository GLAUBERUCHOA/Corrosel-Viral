import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const KIWIFY_TOKEN = '2v3wadrhc4p';

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
      return NextResponse.json({ error: 'Missing or invalid signature/token' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Kiwify payload structure
    const email = payload.Customer?.email || payload.customer?.email || payload.email;
    const status = payload.order_status || payload.subscription_status || payload.status;

    if (!email) {
      return NextResponse.json({ error: 'No email found in payload' }, { status: 400 });
    }

    console.log(`Received Kiwify webhook for ${email} with status ${status}`);

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
