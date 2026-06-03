/**
 * Routes pour la gestion des arêtes (ReactFlow)
 */

const express = require('express');
const { body } = require('express-validator');
const edgeController = require('../controllers/edge.controller');
const { isAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/edges/tree/:treeId
 * @desc Récupérer toutes les arêtes d'un arbre généalogique
 * @access Private
 */
router.get('/tree/:treeId', isAuth, edgeController.getAllEdges);

/**
 * @route POST /api/edges
 * @desc Créer une nouvelle arête
 * @access Private
 */
router.post(
  '/',
  isAuth,
  [
    body('source').notEmpty().withMessage('ID de la source requis'),
    body('target').notEmpty().withMessage('ID de la cible requis'),
    body('treeId').notEmpty().withMessage('ID de l\'arbre requis')
  ],
  edgeController.createEdge
);

/**
 * @route PUT /api/edges/:id
 * @desc Mettre à jour une arête
 * @access Private
 */
router.put(
  '/:id',
  isAuth,
  [
    body('source').optional().notEmpty().withMessage('ID de la source ne peut pas être vide'),
    body('target').optional().notEmpty().withMessage('ID de la cible ne peut pas être vide')
  ],
  edgeController.updateEdge
);

/**
 * @route DELETE /api/edges/:id
 * @desc Supprimer une arête
 * @access Private
 */
router.delete('/:id', isAuth, edgeController.deleteEdge);

module.exports = router;