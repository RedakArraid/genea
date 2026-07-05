/**
 * Routes pour la gestion des relations entre les personnes
 */

const express = require('express');
const { body } = require('express-validator');
const relationshipController = require('../controllers/relationship.controller');
const { isAuth, optionalAuth } = require('../middleware/auth.middleware');
const {
  canCreateRelationship,
  canDeleteRelationship,
  canReadPersonRelationships,
} = require('../middleware/person.middleware');

const router = express.Router();

router.get('/person/:personId', optionalAuth, canReadPersonRelationships, relationshipController.getPersonRelationships);

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

router.delete('/:id', isAuth, canDeleteRelationship, relationshipController.deleteRelationship);

module.exports = router;
