const CINETPAY_BASE = process.env.CINETPAY_BASE_URL || 'https://api-checkout.cinetpay.com/v2';

function isConfigured() {
  return !!(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID);
}

async function initializePayment({
  transactionId,
  amountXof,
  description,
  notifyUrl,
  returnUrl,
  customerName,
  customerEmail,
}) {
  const apikey = process.env.CINETPAY_API_KEY;
  const site_id = process.env.CINETPAY_SITE_ID;
  if (!apikey || !site_id) {
    throw new Error('CinetPay non configuré');
  }

  const res = await fetch(`${CINETPAY_BASE}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey,
      site_id,
      transaction_id: transactionId,
      amount: amountXof,
      currency: 'XOF',
      description,
      notify_url: notifyUrl,
      return_url: returnUrl,
      customer_name: customerName || 'Client GeneaIA',
      customer_email: customerEmail,
      channels: 'ALL',
      lang: 'fr',
    }),
  });

  const data = await res.json();
  if (data.code !== '201' && data.code !== 201) {
    throw new Error(data.message || data.description || 'Échec initialisation CinetPay');
  }

  return {
    provider: 'CINETPAY',
    authorizationUrl: data.data?.payment_url,
    reference: transactionId,
  };
}

async function verifyPayment(transactionId) {
  const apikey = process.env.CINETPAY_API_KEY;
  const site_id = process.env.CINETPAY_SITE_ID;
  if (!apikey || !site_id) throw new Error('CinetPay non configuré');

  const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey,
      site_id,
      transaction_id: transactionId,
    }),
  });

  const data = await res.json();
  const status = data.data?.status;
  return {
    success: status === 'ACCEPTED' || status === 'SUCCESS' || status === 'COMPLETED',
    amount: data.data?.amount,
    currency: data.data?.currency || 'XOF',
    reference: transactionId,
    raw: data,
  };
}

module.exports = { isConfigured, initializePayment, verifyPayment };
