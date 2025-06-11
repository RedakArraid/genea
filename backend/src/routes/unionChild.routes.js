/**
 * Routes pour la gestion des enfants d'union
 */

const express = require('express');
const { body } = require('express-validator');
const unionChildController = require('../controllers/unionChild.controller');

const router = express.Router();

/**
 * POST /api/union-children
 * Créer un enfant d'union
 */
router.post('/', [
  body('marriageEdgeId').notEmpty().withMessage('L\'ID du mariage est requis'),
  body('childId').notEmpty().withMessage('L\'ID de l\'enfant est requis'),
  body('treeId').optional().isUUID().withMessage('L\'ID de l\'arbre doit être un UUID valide')
], unionChildController.createUnionChild);

/**
 * GET /api/union-children/marriage/:marriageEdgeId
 * Récupérer tous les enfants d'une union
 */
router.get('/marriage/:marriageEdgeId', unionChildController.getUnionChildren);

/**
 * DELETE /api/union-children/:id
 * Supprimer un enfant d'union
 */
router.delete('/:id', unionChildController.deleteUnionChild);

module.exports = router;
