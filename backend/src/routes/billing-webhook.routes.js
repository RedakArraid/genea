const express = require('express');
const billingController = require('../controllers/billing.controller');

const router = express.Router();

router.post('/paystack', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body?.toString?.() || '';
  try {
    req.body = JSON.parse(req.rawBody);
  } catch {
    req.body = {};
  }
  billingController.paystackWebhook(req, res, next);
});

module.exports = router;
