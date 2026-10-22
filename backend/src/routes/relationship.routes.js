/** Relationship reads and atomic bidirectional mutations. */
const express = require('express');
const { body } = require('express-validator');
const relationshipController = require('../controllers/relationship.controller');
const familyController = require('../controllers/familyMutation.controller');
const { isAuth, optionalAuth } = require('../middleware/auth.middleware');
const { canCreateRelationship, canDeleteRelationship, canReadPersonRelationships } = require('../middleware/person.middleware');
const router = express.Router();
router.get('/person/:personId', optionalAuth, canReadPersonRelationships, relationshipController.getPersonRelationships);
router.post('/', isAuth, canCreateRelationship, [
  body('type').isIn(['parent', 'child', 'spouse', 'sibling']).withMessage('Type de relation invalide'),
  body('sourceId').isString().notEmpty().withMessage('ID de la personne source requis'),
  body('targetId').isString().notEmpty().withMessage('ID de la personne cible requis'),
], familyController.createRelationship);
router.delete('/:id', isAuth, canDeleteRelationship, familyController.deleteRelationship);
module.exports = router;
