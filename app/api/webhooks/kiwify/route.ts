import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/app/lib/db';

const KIWIFY_TOKEN = '2v3wadrhc4p';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-kiwify-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha1', KIWIFY_TOKEN);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
      // If signature verification fails, we can also check if the token is in the URL as a fallback
      const urlToken = req.nextUrl.searchParams.get('token');
      if (urlToken !== KIWIFY_TOKEN) {
        console.error('Invalid signature or token');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
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
      await pool.query(
        `INSERT INTO usuarios (email, status) VALUES (?, 'ativo') ON DUPLICATE KEY UPDATE status = 'ativo'`,
        [email]
      );
      console.log(`Granted access to ${email}`);
    } else if (inactiveStatuses.includes(status)) {
      await pool.query(
        `UPDATE usuarios SET status = 'inativo' WHERE email = ?`,
        [email]
      );
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
