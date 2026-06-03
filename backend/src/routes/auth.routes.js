/**
 * Routes d'authentification
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { isAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Veuillez fournir un email valide'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Le mot de passe doit contenir au moins 6 caractères')
  ],
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Connexion d'un utilisateur existant
 * @access Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Veuillez fournir un email valide'),
    body('password').notEmpty().withMessage('Le mot de passe est requis')
  ],
  authController.login
);

/**
 * @route GET /api/auth/me
 * @desc Récupération des informations de l'utilisateur connecté
 * @access Private
 */
router.get('/me', isAuth, authController.getMe);

module.exports = router;