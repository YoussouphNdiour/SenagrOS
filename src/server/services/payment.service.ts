import { createHmac, timingSafeEqual } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, eq, ne, sql } from 'drizzle-orm';
import {
  buildOrangeMoneyBody,
  buildWaveCheckoutBody,
  ORANGE_MONEY_TOKEN_URL,
  ORANGE_MONEY_WEBPAY_URL,
  orangeMoneyWebpayResponseSchema,
  type PaymentProvider,
  parseWaveSignatureHeader,
  WAVE_CHECKOUT_URL,
  waveCheckoutResponseSchema,
} from '@/lib/validators/payment.validator';
import type { Database } from '../db';
import { orders } from '../db/schema';

type Order = typeof orders.$inferSelect;

export function appBaseUrl(): string {
  return (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
}

export function isProviderConfigured(provider: PaymentProvider): boolean {
  if (provider === 'wave') return !!process.env.WAVE_API_KEY;
  return !!(
    process.env.ORANGE_MONEY_MERCHANT_KEY &&
    process.env.ORANGE_MONEY_CLIENT_ID &&
    process.env.ORANGE_MONEY_CLIENT_SECRET
  );
}

/**
 * Without API credentials, outside production, payments go through a local
 * simulation page so the full checkout can be exercised in dev and E2E tests.
 */
export function isSimulationMode(provider: PaymentProvider): boolean {
  return !isProviderConfigured(provider) && process.env.NODE_ENV !== 'production';
}

function simulationUrl(provider: PaymentProvider, checkoutRef: string) {
  return `${appBaseUrl()}/checkout/paiement-simule?provider=${provider}&ref=${checkoutRef}`;
}

function resultUrls(checkoutRef: string) {
  const base = appBaseUrl();
  return {
    success: `${base}/checkout/succes?ref=${checkoutRef}`,
    error: `${base}/checkout/succes?ref=${checkoutRef}&paiement=echec`,
  };
}

async function savePaymentInit(
  db: Database,
  orderList: Order[],
  provider: PaymentProvider,
  reference: string,
  extra: Record<string, string>,
) {
  for (const order of orderList) {
    await db
      .update(orders)
      .set({
        paymentMethod: provider,
        paymentReference: reference,
        paymentStatus: 'pending',
        data: { ...(order.data ?? {}), payment_provider_id: reference, ...extra },
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));
  }
}

export async function initiateWavePayment(db: Database, orderList: Order[], checkoutRef: string) {
  const amount = orderList.reduce((s, o) => s + Number(o.totalAmount), 0);
  if (isSimulationMode('wave')) {
    await savePaymentInit(db, orderList, 'wave', `SIM-WAVE-${checkoutRef}`, {});
    return { url: simulationUrl('wave', checkoutRef), simulated: true };
  }
  if (!isProviderConfigured('wave')) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Wave non configuré' });
  }
  const urls = resultUrls(checkoutRef);
  const res = await fetch(WAVE_CHECKOUT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WAVE_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `senagros-${checkoutRef}`,
    },
    body: JSON.stringify(
      buildWaveCheckoutBody({
        amount,
        clientReference: checkoutRef,
        successUrl: urls.success,
        errorUrl: urls.error,
      }),
    ),
  });
  if (!res.ok) {
    console.error('Wave checkout error', res.status, await res.text().catch(() => ''));
    throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Wave indisponible, réessayez' });
  }
  const session = waveCheckoutResponseSchema.parse(await res.json());
  await savePaymentInit(db, orderList, 'wave', session.id, {});
  return { url: session.wave_launch_url, simulated: false };
}

async function orangeMoneyAccessToken(): Promise<string> {
  const basic = Buffer.from(
    `${process.env.ORANGE_MONEY_CLIENT_ID}:${process.env.ORANGE_MONEY_CLIENT_SECRET}`,
  ).toString('base64');
  const res = await fetch(ORANGE_MONEY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Orange Money indisponible' });
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Orange Money : jeton invalide' });
  }
  return json.access_token;
}

export async function initiateOrangeMoneyPayment(
  db: Database,
  orderList: Order[],
  checkoutRef: string,
) {
  const amount = orderList.reduce((s, o) => s + Number(o.totalAmount), 0);
  if (isSimulationMode('orange_money')) {
    await savePaymentInit(db, orderList, 'orange_money', `SIM-OM-${checkoutRef}`, {
      om_notif_token: `sim-${checkoutRef}`,
    });
    return { url: simulationUrl('orange_money', checkoutRef), simulated: true };
  }
  if (!isProviderConfigured('orange_money')) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Orange Money non configuré' });
  }
  const webpayUrl = process.env.ORANGE_MONEY_WEBPAY_URL ?? ORANGE_MONEY_WEBPAY_URL;
  const token = await orangeMoneyAccessToken();
  const urls = resultUrls(checkoutRef);
  const res = await fetch(webpayUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(
      buildOrangeMoneyBody({
        merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY ?? '',
        amount,
        orderId: checkoutRef,
        returnUrl: urls.success,
        cancelUrl: urls.error,
        notifUrl: `${appBaseUrl()}/api/webhooks/orange-money`,
        webpayUrl,
      }),
    ),
  });
  if (!res.ok) {
    console.error('Orange Money webpay error', res.status, await res.text().catch(() => ''));
    throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Orange Money indisponible, réessayez' });
  }
  const payment = orangeMoneyWebpayResponseSchema.parse(await res.json());
  await savePaymentInit(db, orderList, 'orange_money', payment.pay_token, {
    om_notif_token: payment.notif_token,
  });
  return { url: payment.payment_url, simulated: false };
}

/**
 * Verifies a Wave webhook signature: HMAC-SHA256(secret, timestamp + rawBody),
 * hex-encoded, compared in constant time. Rejects timestamps older than `toleranceSec`.
 */
export function verifyWaveSignature(
  secret: string,
  header: string | null,
  rawBody: string,
  now: Date = new Date(),
  toleranceSec = 300,
): boolean {
  const parsed = parseWaveSignatureHeader(header);
  if (!parsed || !secret) return false;
  const ts = Number(parsed.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now.getTime() / 1000 - ts) > toleranceSec) return false;
  const expected = createHmac('sha256', secret)
    .update(parsed.timestamp + rawBody)
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  return parsed.signatures.some((sig) => {
    const buf = Buffer.from(sig, 'hex');
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
  });
}

/**
 * Marks every order of a checkout as paid/failed. Already-paid orders are left
 * untouched so replayed webhooks are idempotent. Returns the number of orders updated.
 */
export async function applyPaymentResult(
  db: Database,
  checkoutRef: string,
  status: 'paid' | 'failed',
  transactionId?: string,
): Promise<number> {
  const updated = await db
    .update(orders)
    .set({
      paymentStatus: status,
      updatedAt: new Date(),
      data: sql`${orders.data} || ${JSON.stringify({
        ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}),
        ...(transactionId ? { payment_transaction_id: transactionId } : {}),
      })}::jsonb`,
    })
    .where(
      and(
        sql`${orders.data}->>'checkout_ref' = ${checkoutRef}`,
        ne(orders.paymentStatus, 'paid'),
        ne(orders.status, 'cancelled'),
      ),
    )
    .returning({ id: orders.id });
  return updated.length;
}

export async function checkoutRefForOmToken(db: Database, notifToken: string) {
  const [row] = await db
    .select({ data: orders.data })
    .from(orders)
    .where(sql`${orders.data}->>'om_notif_token' = ${notifToken}`)
    .limit(1);
  return row?.data?.checkout_ref ?? null;
}
