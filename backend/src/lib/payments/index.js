const paystack = require('./paystack');

async function initializeCheckout(params) {
  if (!paystack.isConfigured()) {
    throw new Error('Paystack non configuré — configurez PAYSTACK_SECRET_KEY et PAYSTACK_PUBLIC_KEY');
  }
  return paystack.initializePayment(params.paystack);
}

async function verifyCheckout(provider, reference) {
  if (provider === 'PAYSTACK') {
    return paystack.verifyPayment(reference);
  }
  throw new Error(`Prestataire inconnu ou obsolète: ${provider}`);
}

module.exports = { initializeCheckout, verifyCheckout, paystack };
