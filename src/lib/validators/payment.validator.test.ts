import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWaveSignature } from '@/server/services/payment.service';
import {
  buildOrangeMoneyBody,
  buildWaveCheckoutBody,
  initiatePaymentSchema,
  orangeMoneyCurrency,
  orangeMoneyNotificationSchema,
  orangeMoneyStatusToPaymentStatus,
  parseWaveSignatureHeader,
  waveEventToPaymentStatus,
  waveWebhookSchema,
} from './payment.validator';

describe('Wave checkout', () => {
  it('builds a checkout session body in XOF with integer amount', () => {
    expect(
      buildWaveCheckoutBody({
        amount: 22250.4,
        clientReference: 'abc',
        successUrl: 'https://x/ok',
        errorUrl: 'https://x/ko',
      }),
    ).toEqual({
      amount: '22250',
      currency: 'XOF',
      client_reference: 'abc',
      success_url: 'https://x/ok',
      error_url: 'https://x/ko',
    });
  });

  it('maps webhook events to payment statuses', () => {
    const completed = waveWebhookSchema.parse({
      type: 'checkout.session.completed',
      data: { id: 'cos_1', client_reference: 'ref', payment_status: 'succeeded' },
    });
    expect(waveEventToPaymentStatus(completed)).toBe('paid');
    expect(
      waveEventToPaymentStatus({
        type: 'checkout.session.payment_failed',
        data: { id: 'cos_1' },
      }),
    ).toBe('failed');
    expect(waveEventToPaymentStatus({ type: 'merchant.payment_received', data: { id: 'x' } })).toBe(
      null,
    );
  });
});

describe('Wave webhook signature', () => {
  const secret = 'wave_sn_WHS_test';
  const body = JSON.stringify({ type: 'checkout.session.completed', data: { id: 'cos_1' } });
  const now = new Date('2026-10-14T12:00:00Z');
  const ts = String(Math.floor(now.getTime() / 1000));
  const sign = (t: string, b: string) =>
    createHmac('sha256', secret)
      .update(t + b)
      .digest('hex');

  it('parses the signature header', () => {
    expect(parseWaveSignatureHeader('t=123,v1=aa,v1=bb')).toEqual({
      timestamp: '123',
      signatures: ['aa', 'bb'],
    });
    expect(parseWaveSignatureHeader(null)).toBeNull();
    expect(parseWaveSignatureHeader('garbage')).toBeNull();
  });

  it('accepts a valid signature', () => {
    expect(verifyWaveSignature(secret, `t=${ts},v1=${sign(ts, body)}`, body, now)).toBe(true);
  });

  it('rejects a tampered body', () => {
    expect(verifyWaveSignature(secret, `t=${ts},v1=${sign(ts, body)}`, `${body} `, now)).toBe(
      false,
    );
  });

  it('rejects stale timestamps (replay)', () => {
    const old = String(Number(ts) - 3600);
    expect(verifyWaveSignature(secret, `t=${old},v1=${sign(old, body)}`, body, now)).toBe(false);
  });

  it('rejects a missing header or secret', () => {
    expect(verifyWaveSignature(secret, null, body, now)).toBe(false);
    expect(verifyWaveSignature('', `t=${ts},v1=${sign(ts, body)}`, body, now)).toBe(false);
  });
});

describe('Orange Money', () => {
  it('uses the OUV test currency in sandbox and XOF in production', () => {
    expect(
      orangeMoneyCurrency('https://api.orange.com/orange-money-webpay/dev/v1/webpayment'),
    ).toBe('OUV');
    expect(orangeMoneyCurrency('https://api.orange.com/orange-money-webpay/sn/v1/webpayment')).toBe(
      'XOF',
    );
  });

  it('builds the webpayment body', () => {
    const body = buildOrangeMoneyBody({
      merchantKey: 'mk',
      amount: 1500.6,
      orderId: 'ref',
      returnUrl: 'r',
      cancelUrl: 'c',
      notifUrl: 'n',
    });
    expect(body).toMatchObject({
      merchant_key: 'mk',
      currency: 'OUV',
      amount: 1501,
      order_id: 'ref',
      notif_url: 'n',
    });
  });

  it('maps notification statuses', () => {
    expect(orangeMoneyStatusToPaymentStatus('SUCCESS')).toBe('paid');
    expect(orangeMoneyStatusToPaymentStatus('FAILED')).toBe('failed');
    expect(orangeMoneyStatusToPaymentStatus('INITIATED')).toBeNull();
    expect(
      orangeMoneyNotificationSchema.safeParse({ status: 'SUCCESS', notif_token: 't' }).success,
    ).toBe(true);
  });
});

describe('initiatePaymentSchema', () => {
  it('requires at least one order id', () => {
    expect(initiatePaymentSchema.safeParse({ orderIds: [] }).success).toBe(false);
    expect(
      initiatePaymentSchema.safeParse({ orderIds: ['11111111-1111-4111-8111-111111111111'] })
        .success,
    ).toBe(true);
  });
});
