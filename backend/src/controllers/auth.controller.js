/**
 * Contrôleur d'authentification
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { SOLO_TRIAL_DAYS } = require('../lib/plans');
const { findUserByLogin } = require('../lib/authLogin');
const { normalizePhone, isValidPhone } = require('../lib/phone');
const { requestLoginOtp, verifyLoginOtp, isOtpDeliveryAvailable } = require('../lib/otp');
const { sendError, sendValidationErrors } = require('../lib/apiErrors');

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, email: user.email || undefined, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: jwtExpiresIn },
  );
}

function stripPassword(user) {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

const userPublicSelect = {
  id: true,
  phone: true,
  email: true,
  name: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
  plan: true,
  planActive: true,
  planExpiresAt: true,
  role: true,
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationErrors(res, errors);
    }

    const { name, email: rawEmail, password, phone: rawPhone, locale, phoneCountry } = req.body;
    const userLocale = ['fr', 'en'].includes(locale) ? locale : 'fr';
    const phone = normalizePhone(rawPhone, phoneCountry || 'CI');
    if (!phone || !isValidPhone(phone)) {
      return sendError(res, 400, 'INVALID_PHONE', 'Numéro de téléphone invalide.');
    }

    let normalizedEmail = null;
    if (rawEmail && String(rawEmail).trim()) {
      normalizedEmail = String(rawEmail).trim().toLowerCase();
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return sendError(res, 409, 'PHONE_TAKEN', 'Ce numéro de téléphone est déjà utilisé');
    }

    if (normalizedEmail) {
      const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingEmail) {
        return sendError(res, 409, 'EMAIL_TAKEN', 'Cet email est déjà utilisé');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const trialExpiresAt = new Date(Date.now() + SOLO_TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email: normalizedEmail,
        password: hashedPassword,
        locale: userLocale,
        plan: 'SOLO',
        planActive: true,
        planExpiresAt: trialExpiresAt,
      },
    });

    const token = signToken(newUser);

    res.status(201).json({
      message: 'Inscription réussie',
      user: stripPassword(newUser),
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationErrors(res, errors);
    }

    const login = req.body.login || req.body.phone || req.body.email;
    const { password } = req.body;

    const user = await findUserByLogin(login);
    if (!user) {
      return sendError(res, 401, 'LOGIN_FAILED', 'Identifiant ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 401, 'LOGIN_FAILED', 'Identifiant ou mot de passe incorrect');
    }

    const token = signToken(user);

    res.status(200).json({
      message: 'Connexion réussie',
      user: stripPassword(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userPublicSelect,
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

exports.otpStatus = async (req, res) => {
  res.json({ enabled: await isOtpDeliveryAvailable() });
};

exports.requestOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!(await isOtpDeliveryAvailable())) {
      return res.status(503).json({ message: 'Connexion par code indisponible.' });
    }

    const { phone, phoneCountry } = req.body;
    const result = await requestLoginOtp(phone, phoneCountry || 'CI');

    if (!result.ok) {
      return res.status(result.status || 400).json({
        code: result.code,
        message: result.message,
        ...(result.params && { params: result.params }),
      });
    }

    res.status(200).json({ message: result.message });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, code, phoneCountry } = req.body;
    const result = await verifyLoginOtp(phone, code, phoneCountry || 'CI');

    if (!result.ok) {
      return res.status(401).json({ code: result.code, message: result.message });
    }

    const token = signToken(result.user);
    res.status(200).json({
      message: 'Connexion réussie',
      user: stripPassword(result.user),
      token,
    });
  } catch (error) {
    next(error);
  }
};
