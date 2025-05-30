/**
 * Routes pour la gestion des positions des nœuds
 */

const express = require('express');
const { body } = require('express-validator');
const nodePositionController = require('../controllers/nodePosition.controller');
const { isAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/node-positions/tree/:treeId
 * @desc Récupérer toutes les positions des nœuds d'un arbre généalogique
 * @access Private
 */
router.get('/tree/:treeId', isAuth, nodePositionController.getAllNodePositions);

/**
 * @route POST /api/node-positions
 * @desc Créer une nouvelle position de nœud
 * @access Private
 */
router.post(
  '/',
  isAuth,
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
router.delete('/:id', isAuth, nodePositionController.deleteNodePosition);

module.exports = router;