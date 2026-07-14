/**
 * Contrôleur pour la gestion des utilisateurs
 */

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const storage = require('../lib/storage');
const { normalizePhone, isValidPhone } = require('../lib/phone');
const { sendError, sendValidationErrors } = require('../lib/apiErrors');

const profileSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
};

const SUPPORTED_LOCALES = ['fr', 'en'];

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
      return sendValidationErrors(res, errors);
    }

    const userId = req.user.id;
    const { name, email, phone: rawPhone, currentPassword, newPassword, locale, phoneCountry } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (locale !== undefined) {
      if (!SUPPORTED_LOCALES.includes(locale)) {
        return res.status(400).json({ message: 'Langue non supportée', code: 'UNSUPPORTED_LOCALE' });
      }
      updateData.locale = locale;
    }

    if (rawPhone !== undefined) {
      const phone = normalizePhone(rawPhone, phoneCountry || 'CI');
      if (!phone || !isValidPhone(phone)) {
        return sendError(res, 400, 'INVALID_PHONE_CI', 'Numéro de téléphone invalide (format CI : 07XXXXXXXX)');
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

/**
 * Suppression définitive du compte de l'utilisateur connecté : ses arbres
 * possédés (et leur contenu, en cascade), ses accès collaborateur/invitations
 * sur d'autres arbres, ses paiements, puis le compte lui-même. Best-effort de
 * nettoyage des fichiers (photos/documents) sur le stockage objet.
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationErrors(res, errors);
    }

    const userId = req.user.id;
    const { password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    if (user.role === 'ADMIN') {
      const otherAdmins = await prisma.user.count({ where: { role: 'ADMIN', id: { not: userId } } });
      if (otherAdmins === 0) {
        return res.status(409).json({
          message: 'Impossible de supprimer le dernier compte administrateur',
          code: 'LAST_ADMIN',
        });
      }
    }

    const ownedTrees = await prisma.familyTree.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const ownedTreeIds = ownedTrees.map((t) => t.id);

    const [persons, documents] = await Promise.all([
      ownedTreeIds.length
        ? prisma.person.findMany({ where: { treeId: { in: ownedTreeIds } }, select: { photoUrl: true } })
        : [],
      ownedTreeIds.length
        ? prisma.personDocument.findMany({ where: { treeId: { in: ownedTreeIds } }, select: { fileKey: true } })
        : [],
    ]);

    await prisma.$transaction(async (tx) => {
      if (ownedTreeIds.length) {
        await tx.familyTree.deleteMany({ where: { id: { in: ownedTreeIds } } });
      }
      await tx.user.delete({ where: { id: userId } });
    });

    // Nettoyage best-effort du stockage objet — ne bloque pas la réponse en cas d'échec.
    Promise.all([
      ...persons.filter((p) => p.photoUrl).map((p) => storage.deleteByUrl(p.photoUrl)),
      ...documents.filter((d) => d.fileKey).map((d) => storage.deleteByKey(d.fileKey)),
    ]).catch((err) => console.warn('Nettoyage stockage après suppression de compte:', err.message));

    res.status(200).json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    next(error);
  }
};
