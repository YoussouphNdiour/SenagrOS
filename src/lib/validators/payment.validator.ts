import { z } from 'zod';

export const paymentProviderEnum = z.enum(['wave', 'orange_money']);
export type PaymentProvider = z.infer<typeof paymentProviderEnum>;

export const initiatePaymentSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(20),
});

export const paymentStatusQuerySchema = z.object({
  orderId: z.string().uuid(),
});

export const simulatePaymentSchema = z.object({
  checkoutRef: z.string().min(1).max(64),
  outcome: z.enum(['paid', 'failed']),
});

// --- Wave Checkout API (https://docs.wave.com/checkout) ---

export const WAVE_CHECKOUT_URL = 'https://api.wave.com/v1/checkout/sessions';

/** Wave amounts are strings with no decimals for XOF. */
export function toWaveAmount(amount: number): string {
  return String(Math.round(amount));
}

export function buildWaveCheckoutBody(params: {
  amount: number;
  clientReference: string;
  successUrl: string;
  errorUrl: string;
}) {
  return {
    amount: toWaveAmount(params.amount),
    currency: 'XOF',
    client_reference: params.clientReference,
    success_url: params.successUrl,
    error_url: params.errorUrl,
  };
}

export const waveCheckoutResponseSchema = z.object({
  id: z.string(),
  wave_launch_url: z.string().url(),
  client_reference: z.string().nullable().optional(),
});

export const waveWebhookSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  data: z.object({
    id: z.string(),
    client_reference: z.string().nullable().optional(),
    payment_status: z.string().optional(),
    checkout_status: z.string().optional(),
    transaction_id: z.string().optional(),
  }),
});
export type WaveWebhookEvent = z.infer<typeof waveWebhookSchema>;

/** Maps a Wave webhook event to our payment status (null = ignore the event). */
export function waveEventToPaymentStatus(event: WaveWebhookEvent): 'paid' | 'failed' | null {
  if (event.type === 'checkout.session.completed') {
    return event.data.payment_status === 'succeeded' || event.data.payment_status === undefined
      ? 'paid'
      : 'failed';
  }
  if (event.type === 'checkout.session.payment_failed') return 'failed';
  return null;
}

/** Parses the `Wave-Signature: t=<timestamp>,v1=<sig>[,v1=<sig>]` header. */
export function parseWaveSignatureHeader(
  header: string | null,
): { timestamp: string; signatures: string[] } | null {
  if (!header) return null;
  let timestamp = '';
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key, value] = part.split('=', 2).map((s) => s?.trim());
    if (!key || !value) continue;
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }
  return timestamp && signatures.length > 0 ? { timestamp, signatures } : null;
}

// --- Orange Money WebPay API ---

export const ORANGE_MONEY_TOKEN_URL = 'https://api.orange.com/oauth/v3/token';
export const ORANGE_MONEY_WEBPAY_URL =
  'https://api.orange.com/orange-money-webpay/dev/v1/webpayment';

/** Orange Money sandbox only accepts the test currency "OUV"; production uses XOF. */
export function orangeMoneyCurrency(webpayUrl: string): 'OUV' | 'XOF' {
  return webpayUrl.includes('/dev/') ? 'OUV' : 'XOF';
}

export function buildOrangeMoneyBody(params: {
  merchantKey: string;
  amount: number;
  orderId: string;
  returnUrl: string;
  cancelUrl: string;
  notifUrl: string;
  webpayUrl?: string;
}) {
  return {
    merchant_key: params.merchantKey,
    currency: orangeMoneyCurrency(params.webpayUrl ?? ORANGE_MONEY_WEBPAY_URL),
    order_id: params.orderId,
    amount: Math.round(params.amount),
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    notif_url: params.notifUrl,
    lang: 'fr',
    reference: 'SenagrOS',
  };
}

export const orangeMoneyWebpayResponseSchema = z.object({
  status: z.number().optional(),
  pay_token: z.string(),
  payment_url: z.string().url(),
  notif_token: z.string(),
});

export const orangeMoneyNotificationSchema = z.object({
  status: z.string(),
  notif_token: z.string(),
  txnid: z.string().optional(),
});

export function orangeMoneyStatusToPaymentStatus(status: string): 'paid' | 'failed' | null {
  const s = status.toUpperCase();
  if (s === 'SUCCESS') return 'paid';
  if (s === 'FAILED' || s === 'EXPIRED') return 'failed';
  return null;
}
