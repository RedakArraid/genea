const paystack = require('./paystack');
const cinetpay = require('./cinetpay');

async function initializeCheckout(params) {
  const errors = [];

  if (paystack.isConfigured()) {
    try {
      const result = await paystack.initializePayment(params.paystack);
      return result;
    } catch (err) {
      errors.push(`Paystack: ${err.message}`);
      console.warn('[billing] Paystack fallback:', err.message);
    }
  } else {
    errors.push('Paystack: non configuré');
  }

  if (cinetpay.isConfigured()) {
    try {
      const result = await cinetpay.initializePayment(params.cinetpay);
      return result;
    } catch (err) {
      errors.push(`CinetPay: ${err.message}`);
      console.warn('[billing] CinetPay failed:', err.message);
    }
  } else {
    errors.push('CinetPay: non configuré');
  }

  throw new Error(`Aucun prestataire de paiement disponible (${errors.join('; ')})`);
}

async function verifyCheckout(provider, reference) {
  if (provider === 'PAYSTACK') {
    return paystack.verifyPayment(reference);
  }
  if (provider === 'CINETPAY') {
    return cinetpay.verifyPayment(reference);
  }
  throw new Error('Prestataire inconnu');
}

module.exports = {
  initializeCheckout,
  verifyCheckout,
  paystack,
  cinetpay,
};
