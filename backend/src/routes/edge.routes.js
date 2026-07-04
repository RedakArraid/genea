/**
 * Routes pour la gestion des arêtes (ReactFlow)
 */

const express = require('express');
const { body } = require('express-validator');
const edgeController = require('../controllers/edge.controller');
const { isAuth } = require('../middleware/auth.middleware');
const { canReadTree, canWriteEdge } = require('../middleware/treeAccess.middleware');

const router = express.Router();

router.get('/tree/:treeId', isAuth, canReadTree, edgeController.getAllEdges);

router.post(
  '/',
  isAuth,
  canWriteEdge,
  [
    body('source').notEmpty().withMessage('ID de la source requis'),
    body('target').notEmpty().withMessage('ID de la cible requis'),
    body('treeId').notEmpty().withMessage('ID de l\'arbre requis'),
  ],
  edgeController.createEdge
);

router.put(
  '/:id',
  isAuth,
  canWriteEdge,
  [
    body('source').optional().notEmpty().withMessage('ID de la source ne peut pas être vide'),
    body('target').optional().notEmpty().withMessage('ID de la cible ne peut pas être vide'),
  ],
  edgeController.updateEdge
);

router.delete('/:id', isAuth, canWriteEdge, edgeController.deleteEdge);

module.exports = router;
