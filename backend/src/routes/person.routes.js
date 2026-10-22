/** Routes for people and atomic family creation. */
const express = require('express');
const { body } = require('express-validator');
const personController = require('../controllers/person.controller');
const familyController = require('../controllers/familyMutation.controller');
const { isAuth, optionalAuth } = require('../middleware/auth.middleware');
const { canAccessPerson } = require('../middleware/person.middleware');
const { canReadTree, canWriteTree, canWritePerson, canEditPersonInfo } = require('../middleware/treeAccess.middleware');

const birthDateValidator = body('birthDate')
  .optional({ checkFalsy: true }).isISO8601().toDate()
  .withMessage('Format de date de naissance invalide')
  .custom((value) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (value > today) throw new Error('La date de naissance ne peut pas etre dans le futur');
    return true;
  });
const router = express.Router();
router.get('/tree/:treeId', optionalAuth, canReadTree, personController.getAllPersons);
router.get('/:id', optionalAuth, canAccessPerson, personController.getPersonById);

const creationValidators = [
  body('firstName').isString().trim().notEmpty().withMessage('Le prenom est requis'),
  body('lastName').isString().trim().notEmpty().withMessage('Le nom de famille est requis'),
  birthDateValidator,
  body('birthPlace').optional({ nullable: true }).isString(),
  body('deathDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Format de date de deces invalide'),
  body('occupation').optional({ nullable: true }).isString(),
  body('biography').optional({ nullable: true }).isString(),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Genre invalide'),
  body('photoUrl').optional({ nullable: true }).isString(),
];
// Keep the legacy endpoint while making creation itself transactional.
router.post('/tree/:treeId', isAuth, canWriteTree, creationValidators, familyController.createMember);
router.post('/tree/:treeId/family-member', isAuth, canWriteTree, creationValidators, familyController.createMember);
router.post('/tree/:treeId/link-child', isAuth, canWriteTree, familyController.linkChild);

router.patch('/:id/photo', isAuth, canWritePerson,
  [body('photoUrl').optional({ nullable: true })], personController.updatePersonPhoto);
router.put('/:id', isAuth, canEditPersonInfo, [
  body('firstName').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Le prenom ne peut pas etre vide'),
  body('lastName').optional({ checkFalsy: true }).trim(),
  birthDateValidator,
  body('birthPlace').optional(),
  body('deathDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Format de date de deces invalide'),
  body('occupation').optional(), body('biography').optional(),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Genre invalide'),
  body('photoUrl').optional(),
], personController.updatePerson);
router.delete('/:id', isAuth, canWritePerson, personController.deletePerson);
router.get('/:id/revisions', isAuth, canAccessPerson, personController.getPersonRevisions);
router.post('/:id/revisions/:revisionId/restore', isAuth, canEditPersonInfo, personController.restorePersonRevision);
module.exports = router;
