/**
 * Routes pour la gestion des arbres généalogiques
 */

const express = require('express');
const { body } = require('express-validator');
const familyTreeController = require('../controllers/familyTree.controller');
const collaborationController = require('../controllers/collaboration.controller');
const { isAuth, optionalAuth } = require('../middleware/auth.middleware');
const { canReadTree } = require('../middleware/treeAccess.middleware');

const router = express.Router();

router.get('/', isAuth, familyTreeController.getAllTrees);

router.get('/demo', collaborationController.getDemoTree);
router.post('/invites/:token/accept', isAuth, collaborationController.acceptInvite);
router.get('/:id/access', isAuth, collaborationController.getTreeAccess);
router.get('/:id/collaborators', isAuth, collaborationController.listCollaborators);
router.post('/:id/collaborators', isAuth, collaborationController.inviteCollaborator);
router.delete('/:id/collaborators/:userId', isAuth, collaborationController.removeCollaborator);
router.delete('/:id/invites/:inviteId', isAuth, collaborationController.revokeInvite);
router.put('/:id/visibility', isAuth, collaborationController.updateVisibility);

router.get('/:id/export/gedcom', isAuth, canReadTree, familyTreeController.exportGedcom);
router.get('/:id/export/pdf', isAuth, canReadTree, familyTreeController.exportPdf);

router.get('/:id', optionalAuth, canReadTree, familyTreeController.getTreeById);

/**
 * @route POST /api/family-trees
 * @desc Créer un nouvel arbre généalogique
 * @access Private
 */
router.post(
  '/',
  isAuth,
  [
    body('name').trim().notEmpty().withMessage('Le nom de l\'arbre est requis'),
    body('description').optional(),
    body('isPublic').optional().isBoolean()
  ],
  familyTreeController.createTree
);

/**
 * @route PUT /api/family-trees/:id
 * @desc Mettre à jour un arbre généalogique
 * @access Private
 */
router.put(
  '/:id',
  isAuth,
  familyTreeController.updateTree
);

/**
 * @route DELETE /api/family-trees/:id
 * @desc Supprimer un arbre généalogique
 * @access Private
 */
router.delete('/:id', isAuth, familyTreeController.deleteTree);

module.exports = router;