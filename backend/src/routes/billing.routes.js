const express = require('express');
const billingController = require('../controllers/billing.controller');
const { isAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/config', billingController.getPublicConfig);
router.post('/preview', billingController.previewCheckout);
router.post('/initialize', isAuth, billingController.initializeCheckout);
router.get('/verify/:reference', isAuth, billingController.verifyCheckout);

module.exports = router;
