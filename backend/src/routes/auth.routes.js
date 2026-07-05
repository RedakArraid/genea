/**
 * Routes d'authentification
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { isAuth } = require('../middleware/auth.middleware');
const { looksLikePhone, DEFAULT_COUNTRY } = require('../lib/phone');

const phoneValidator = body('phone')
  .trim()
  .notEmpty()
  .withMessage('Le numéro de téléphone est requis')
  .custom((value, { req }) => {
    const country = req.body.phoneCountry || DEFAULT_COUNTRY;
    if (!looksLikePhone(value, country)) {
      throw new Error('Numéro de téléphone invalide');
    }
    return true;
  });

const loginValidator = body('login')
  .optional()
  .trim()
  .custom((value, { req }) => {
    const login = value || req.body.phone || req.body.email;
    if (!login) throw new Error('Téléphone ou email requis');
    if (login.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
        throw new Error('Email invalide');
      }
    } else if (!looksLikePhone(login, req.body.phoneCountry || DEFAULT_COUNTRY)) {
      throw new Error('Numéro de téléphone invalide');
    }
    return true;
  });

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    phoneValidator,
    body('email')
      .optional({ values: 'falsy' })
      .trim()
      .isEmail()
      .withMessage('Veuillez fournir un email valide'),
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

router.get('/otp/status', authController.otpStatus);

router.post('/otp/request', [phoneValidator], authController.requestOtp);

router.post(
  '/otp/verify',
  [
    phoneValidator,
    body('code')
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('Le code doit contenir 6 chiffres'),
  ],
  authController.verifyOtp,
);

module.exports = router;
