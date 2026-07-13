/**
 * Routes pour la gestion des positions des nœuds
 */

const express = require('express');
const { body } = require('express-validator');
const nodePositionController = require('../controllers/nodePosition.controller');
const { isAuth, optionalAuth } = require('../middleware/auth.middleware');
const { canReadTree, canWriteTree } = require('../middleware/treeAccess.middleware');
const { resolveTreeAccess } = require('../lib/treeAccess');
const { getOrCreateDemoFork, translateDemoEntityId } = require('../lib/demoFork');
const prisma = require('../lib/prisma');
const { sendStatusError } = require('../lib/apiErrors');

const canWriteNodePosition = async (req, res, next) => {
  try {
    const posId = req.params.id;
    const pos = await prisma.nodePosition.findUnique({ where: { id: posId } });
    if (!pos) {
      return res.status(404).json({ message: 'Position non trouvée' });
    }

    const tree = await prisma.familyTree.findUnique({ where: { id: pos.treeId } });
    if (tree?.isDemo) {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Connectez-vous pour modifier la démo' });
      }
      const adminAccess = await resolveTreeAccess(req.user.id, pos.treeId);
      if (adminAccess.role !== 'admin') {
        const fork = await getOrCreateDemoFork(req.user.id);
        const forkedPositionId = await translateDemoEntityId(fork.id, 'nodePosition', posId);
        if (!forkedPositionId) {
          return res.status(404).json({ message: 'Position non trouvée dans votre copie de la démo' });
        }
        req.params.id = forkedPositionId;
        req.params.treeId = fork.id;
        res.locals.demoForkTreeId = fork.id;
        req.treeAccess = { canRead: true, canWrite: true, canEditPerson: true, role: 'owner', isDemo: false };
        return next();
      }
    }

    req.params.treeId = pos.treeId;
    return canWriteTree(req, res, next);
  } catch (error) {
    sendStatusError(res, error);
  }
};

const canWriteTreeFromBody = async (req, res, next) => {
  try {
    const { treeId } = req.body;
    if (!treeId) {
      return res.status(400).json({ message: 'ID d\'arbre manquant' });
    }
    req.params.treeId = treeId;
    return canWriteTree(req, res, next);
  } catch (error) {
    sendStatusError(res, error);
  }
};

const router = express.Router();

/**
 * @route GET /api/node-positions/tree/:treeId
 * @desc Récupérer toutes les positions des nœuds d'un arbre généalogique
 * @access Private
 */
router.get('/tree/:treeId', optionalAuth, canReadTree, nodePositionController.getAllNodePositions);

/**
 * @route POST /api/node-positions
 * @desc Créer une nouvelle position de nœud
 * @access Private
 */
router.post(
  '/',
  isAuth,
  canWriteTreeFromBody,
  [
    body('nodeId').notEmpty().withMessage('ID du nœud requis'),
    body('treeId').notEmpty().withMessage('ID de l\'arbre requis'),
    body('x').isNumeric().withMessage('Position X doit être un nombre'),
    body('y').isNumeric().withMessage('Position Y doit être un nombre')
  ],
  nodePositionController.createNodePosition
);

/**
 * @route PUT /api/node-positions/:id
 * @desc Mettre à jour une position de nœud
 * @access Private
 */
router.put(
  '/:id',
  isAuth,
  canWriteNodePosition,
  [
    body('x').isNumeric().withMessage('Position X doit être un nombre'),
    body('y').isNumeric().withMessage('Position Y doit être un nombre')
  ],
  nodePositionController.updateNodePosition
);

/**
 * @route DELETE /api/node-positions/:id
 * @desc Supprimer une position de nœud
 * @access Private
 */
router.delete('/:id', isAuth, canWriteNodePosition, nodePositionController.deleteNodePosition);

module.exports = router;