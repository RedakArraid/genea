/**
 * Contrôleur pour la gestion des utilisateurs
 */

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { normalizePhone, isValidCiPhone } = require('../lib/phone');

const profileSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: profileSelect,
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { name, email, phone: rawPhone, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (rawPhone !== undefined) {
      const phone = normalizePhone(rawPhone);
      if (!phone || !isValidCiPhone(phone)) {
        return res.status(400).json({ message: 'Numéro de téléphone invalide (format CI : 07XXXXXXXX)' });
      }
      if (phone !== user.phone) {
        const existingPhone = await prisma.user.findUnique({ where: { phone } });
        if (existingPhone) {
          return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
        }
        updateData.phone = phone;
      }
    }

    if (email !== undefined) {
      const normalizedEmail = email && String(email).trim()
        ? String(email).trim().toLowerCase()
        : null;

      if (normalizedEmail !== user.email) {
        if (normalizedEmail) {
          const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          if (existingUser) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
          }
        }
        updateData.email = normalizedEmail;
      }
    }

    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: profileSelect,
    });

    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
