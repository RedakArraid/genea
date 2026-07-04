const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const { isAuth } = require('../middleware/auth.middleware');

router.get('/', planController.listPlans);
router.get('/me', isAuth, planController.getMyPlan);
router.put('/me', isAuth, planController.upgradePlan);

module.exports = router;
