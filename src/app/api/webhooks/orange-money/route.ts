import { NextResponse } from 'next/server';
import {
  orangeMoneyNotificationSchema,
  orangeMoneyStatusToPaymentStatus,
} from '@/lib/validators/payment.validator';
import { db } from '@/server/db';
import { applyPaymentResult, checkoutRefForOmToken } from '@/server/services/payment.service';

/**
 * Orange Money WebPay notification. OM does not sign callbacks: authenticity is
 * established by the notif_token returned when the payment was created, which
 * only Orange and our database know.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = orangeMoneyNotificationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const checkoutRef = await checkoutRefForOmToken(db, parsed.data.notif_token);
  if (!checkoutRef) {
    return NextResponse.json({ error: 'Unknown notification token' }, { status: 404 });
  }
  const status = orangeMoneyStatusToPaymentStatus(parsed.data.status);
  if (status) await applyPaymentResult(db, checkoutRef, status, parsed.data.txnid);
  return NextResponse.json({ received: true });
}
