/**
 * Contrôleur d'authentification
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { findUserByLogin } = require('../lib/authLogin');
const { normalizePhone, isValidCiPhone } = require('../lib/phone');

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

const userPublicSelect = {
  id: true,
  email: true,
  phone: true,
  name: true,
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
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone: rawPhone } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    let phone = null;
    if (rawPhone) {
      phone = normalizePhone(rawPhone);
      if (!phone || !isValidCiPhone(phone)) {
        return res.status(400).json({ message: 'Numéro de téléphone invalide (format CI : 07XXXXXXXX)' });
      }
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: jwtExpiresIn },
    );

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: 'Inscription réussie',
      user: userWithoutPassword,
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
      return res.status(400).json({ errors: errors.array() });
    }

    const login = req.body.login || req.body.email;
    const { password } = req.body;

    const user = await findUserByLogin(login);
    if (!user) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: jwtExpiresIn },
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'Connexion réussie',
      user: userWithoutPassword,
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
