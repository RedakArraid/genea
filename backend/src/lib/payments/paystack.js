const { toPaystackAmount } = require('../plans');

const PAYSTACK_BASE = 'https://api.paystack.co';

function isConfigured() {
  return !!(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY);
}

async function initializePayment({ email, amountXof, reference, callbackUrl, metadata }) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error('Paystack non configuré');
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: toPaystackAmount(amountXof),
      currency: 'XOF',
      reference,
      callback_url: callbackUrl,
      metadata,
      channels: ['card', 'mobile_money'],
    }),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message || 'Échec initialisation Paystack');
  }

  return {
    provider: 'PAYSTACK',
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

async function verifyPayment(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('Paystack non configuré');

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!data.status) {
    return { success: false, message: data.message };
  }

  const tx = data.data;
  return {
    success: tx.status === 'success',
    amount: Math.round(tx.amount / 100),
    currency: tx.currency,
    reference: tx.reference,
    raw: tx,
  };
}

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const hash = require('crypto')
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

module.exports = { isConfigured, initializePayment, verifyPayment, verifyWebhookSignature };
