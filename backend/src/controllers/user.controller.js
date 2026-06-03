/**
 * Contrôleur pour la gestion des utilisateurs
 */

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * Récupérer le profil de l'utilisateur connecté
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le profil de l'utilisateur
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userId = req.user.id;
    const { name, email, currentPassword, newPassword } = req.body;
    
    // Récupérer l'utilisateur actuel
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Préparer les données à mettre à jour
    const updateData = {};
    
    if (name) {
      updateData.name = name;
    }
    
    if (email && email !== user.email) {
      // Vérifier que l'email n'est pas déjà utilisé
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(409).json({ message: 'Cet email est déjà utilisé' });
      }
      
      updateData.email = email;
    }
    
    // Mise à jour du mot de passe si nécessaire
    if (currentPassword && newPassword) {
      // Vérifier l'ancien mot de passe
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
      
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }
    
    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};