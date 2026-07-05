/**
 * Routes d'authentification
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { isAuth } = require('../middleware/auth.middleware');
const { looksLikePhone } = require('../lib/phone');

const loginValidator = body('login')
  .optional()
  .trim()
  .custom((value, { req }) => {
    const login = value || req.body.email;
    if (!login) throw new Error('Email ou téléphone requis');
    if (login.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
        throw new Error('Email invalide');
      }
    } else if (!looksLikePhone(login)) {
      throw new Error('Numéro de téléphone invalide (ex. 07XXXXXXXX)');
    }
    return true;
  });

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Veuillez fournir un email valide'),
    body('phone')
      .optional({ values: 'falsy' })
      .trim()
      .custom((value) => {
        if (!value) return true;
        if (!looksLikePhone(value)) {
          throw new Error('Numéro invalide (format CI : 07XXXXXXXX)');
        }
        return true;
      }),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  ],
  authController.register,
);

router.post(
  '/login',
  [
    loginValidator,
    body('password').notEmpty().withMessage('Le mot de passe est requis'),
  ],
  authController.login,
);

router.get('/me', isAuth, authController.getMe);

module.exports = router;
