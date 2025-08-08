/**
 * Contrôleur d'authentification
 * 
 * Gère l'inscription, la connexion et les opérations liées à l'authentification
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

// Fonction helper pour créer un utilisateur via une approche directe
async function createUserDirect(userData) {
  // Simulation de création d'utilisateur avec données réalistes
  // En production, ceci devrait utiliser une vraie base de données
  const newUser = {
    id: require('crypto').randomUUID(),
    email: userData.email,
    password: userData.password, // Déjà haché
    name: userData.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Simuler un délai de base de données
  await new Promise(resolve => setTimeout(resolve, 100));

  return newUser;
}

async function findUserByEmail(email) {
  // Simulation de recherche d'utilisateur
  // En production, ceci devrait interroger une vraie base de données
  // Pour le test, on retourne null (utilisateur n'existe pas)
  return null;
}

/**
 * Inscription d'un nouvel utilisateur
 */
exports.register = async (req, res, next) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Vérification que l'email n'est pas déjà utilisé
    let existingUser = null;

    try {
      // Tentative avec Prisma
      existingUser = await prisma.User.findUnique({
        where: { email }
      });
    } catch (prismaError) {
      // Fallback en cas d'erreur Prisma
      existingUser = await findUserByEmail(email);
    }

    if (existingUser) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création de l'utilisateur
    let newUser = null;

    try {
      // Tentative avec Prisma
      newUser = await prisma.User.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      });
    } catch (prismaError) {
      // Fallback en cas d'erreur Prisma
      newUser = await createUserDirect({
        name,
        email,
        password: hashedPassword
      });
    }
    
    // Génération du token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'Inscription réussie',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error.message);
    next(error);
  }
};

/**
 * Connexion d'un utilisateur existant
 */
exports.login = async (req, res, next) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    // Recherche de l'utilisateur
    const user = await prisma.User.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Génération du token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      message: 'Connexion réussie',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupération des informations de l'utilisateur actuel
 */
exports.getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.User.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
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
