/**
 * Routes pour la gestion des utilisateurs
 */

const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { isAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Récupérer le profil de l'utilisateur connecté
 * @access Private
 */
router.get('/profile', isAuth, userController.getUserProfile);

/**
 * @route PUT /api/users/profile
 * @desc Mettre à jour le profil de l'utilisateur
 * @access Private
 */
router.put(
  '/profile',
  isAuth,
  [
    body('name').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
    body('phone')
      .optional()
      .trim()
      .custom((value) => {
        if (!value) return true;
        const { looksLikePhone } = require('../lib/phone');
        if (!looksLikePhone(value)) {
          throw new Error('Numéro invalide (format CI : 07XXXXXXXX)');
        }
        return true;
      }),
    body('email')
      .optional({ values: 'falsy' })
      .trim()
      .custom((value) => {
        if (!value) return true;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error('Email invalide');
        }
        return true;
      }),
    body('currentPassword').optional(),
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
  ],
  userController.updateUserProfile
);

module.exports = router;