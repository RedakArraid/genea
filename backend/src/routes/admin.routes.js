const express = require('express');
const adminController = require('../controllers/admin.controller');
const adminCollaborationController = require('../controllers/adminCollaboration.controller');
const { isAuth } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

router.use(isAuth, isAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/trees', adminController.listTrees);
router.get('/trees/:id/collaborators', adminCollaborationController.listTreeCollaborators);
router.post('/trees/:id/collaborators', adminCollaborationController.inviteTreeCollaborator);
router.patch('/trees/:id/collaborators/:userId', adminCollaborationController.updateTreeCollaborator);
router.delete('/trees/:id/collaborators/:userId', adminCollaborationController.removeTreeCollaborator);
router.delete('/trees/:id/invites/:inviteId', adminCollaborationController.revokeTreeInvite);
router.delete('/trees/:id', adminController.deleteTree);
router.get('/demo', adminController.getDemoInfo);
router.post('/demo/reset', adminController.resetDemo);
router.get('/storage', adminController.getStorage);
router.get('/plans', adminController.getPlans);
router.get('/promo-codes', adminController.listPromoCodes);
router.post('/promo-codes', adminController.createPromoCode);
router.patch('/promo-codes/:id', adminController.updatePromoCode);
router.delete('/promo-codes/:id', adminController.deletePromoCode);
router.get('/smtp', adminController.getSmtpSettings);
router.patch('/smtp', adminController.updateSmtpSettings);
router.post('/smtp/test', adminController.testSmtpSettings);
router.get('/openwa', adminController.getOpenWaSettings);
router.patch('/openwa', adminController.updateOpenWaSettings);
router.get('/openwa/status', adminController.getOpenWaStatus);
router.post('/openwa/test', adminController.testOpenWaSettings);

module.exports = router;
