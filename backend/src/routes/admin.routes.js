const express = require('express');
const adminController = require('../controllers/admin.controller');
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
router.delete('/trees/:id', adminController.deleteTree);
router.get('/demo', adminController.getDemoInfo);
router.post('/demo/reset', adminController.resetDemo);
router.get('/storage', adminController.getStorage);
router.get('/plans', adminController.getPlans);

module.exports = router;
