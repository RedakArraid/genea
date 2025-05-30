/**
 * Routes pour la gestion des arbres généalogiques
 */

const express = require('express');
const { body } = require('express-validator');
const familyTreeController = require('../controllers/familyTree.controller');
const { isAuth, isOwner } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/family-trees
 * @desc Récupérer tous les arbres généalogiques de l'utilisateur
 * @access Private
 */
router.get('/', isAuth, familyTreeController.getAllTrees);

/**
 * @route GET /api/family-trees/:id
 * @desc Récupérer un arbre généalogique par son ID
 * @access Private
 */
router.get('/:id', isAuth, isOwner('FamilyTree'), familyTreeController.getTreeById);

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
  isOwner('FamilyTree'),
  [
    body('name').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
    body('description').optional(),
    body('isPublic').optional().isBoolean()
  ],
  familyTreeController.updateTree
);

/**
 * @route DELETE /api/family-trees/:id
 * @desc Supprimer un arbre généalogique
 * @access Private
 */
router.delete('/:id', isAuth, isOwner('FamilyTree'), familyTreeController.deleteTree);

module.exports = router;