import { NextResponse } from 'next/server';
import { waveEventToPaymentStatus, waveWebhookSchema } from '@/lib/validators/payment.validator';
import { db } from '@/server/db';
import { applyPaymentResult, verifyWaveSignature } from '@/server/services/payment.service';

/** Wave checkout webhook: marks the checkout's orders as paid/failed. */
export async function POST(request: Request) {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }
  const rawBody = await request.text();
  if (!verifyWaveSignature(secret, request.headers.get('wave-signature'), rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = waveWebhookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const status = waveEventToPaymentStatus(parsed.data);
  const checkoutRef = parsed.data.data.client_reference;
  if (status && checkoutRef) {
    await applyPaymentResult(
      db,
      checkoutRef,
      status,
      parsed.data.data.transaction_id ?? parsed.data.data.id,
    );
  }
  // Always 200 for authenticated events so Wave does not retry ignored types
  return NextResponse.json({ received: true });
}
