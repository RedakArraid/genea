/**
 * Routes pour la gestion des relations entre les personnes
 */

const express = require('express');
const { body } = require('express-validator');
const relationshipController = require('../controllers/relationship.controller');
const { isAuth } = require('../middleware/auth.middleware');
const { canCreateRelationship } = require('../middleware/person.middleware');

const router = express.Router();

/**
 * @route GET /api/relationships/person/:personId
 * @desc Récupérer toutes les relations d'une personne
 * @access Private
 */
router.get('/person/:personId', isAuth, relationshipController.getPersonRelationships);

/**
 * @route POST /api/relationships
 * @desc Créer une nouvelle relation entre deux personnes
 * @access Private
 */
router.post(
  '/',
  isAuth,
  canCreateRelationship,
  [
    body('type').isIn(['parent', 'child', 'spouse', 'sibling']).withMessage('Type de relation invalide'),
    body('sourceId').notEmpty().withMessage('ID de la personne source requis'),
    body('targetId').notEmpty().withMessage('ID de la personne cible requis'),
  ],
  relationshipController.createRelationship
);

/**
 * @route DELETE /api/relationships/:id
 * @desc Supprimer une relation
 * @access Private
 */
router.delete('/:id', isAuth, relationshipController.deleteRelationship);

module.exports = router;