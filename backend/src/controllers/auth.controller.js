/**
 * Contrôleur d'authentification
 * 
 * Gère l'inscription, la connexion et les opérations liées à l'authentification
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * Inscription d'un nouvel utilisateur
 */
exports.register = async (req, res, next) => {
  try {
    console.log('🚀 DEBUT INSCRIPTION - Body:', req.body);

    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ ERREURS VALIDATION:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    console.log('✅ DONNEES EXTRAITES:', { name, email, passwordLength: password?.length });

    // Vérification que l'email n'est pas déjà utilisé
    console.log('🔍 VERIFICATION EMAIL:', email);

    // NOTE TEMPORAIRE: Utilisation directe de Supabase tant que Prisma ne se connecte pas
    // Simuler vérification d'email existant - on supposera qu'il n'existe pas pour le test
    console.log('📊 VERIFICATION EMAIL TEMPORAIRE (pas de vérif Prisma)');

    // Hachage du mot de passe
    console.log('🔐 HACHAGE MOT DE PASSE...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ MOT DE PASSE HACHE');

    // Pour le moment, créer un utilisateur fictif avec un ID généré
    console.log('👤 CREATION UTILISATEUR TEMPORAIRE...');
    const newUser = {
      id: require('crypto').randomUUID(),
      name,
      email,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('✅ UTILISATEUR CREE TEMPORAIREMENT:', newUser.id);
    
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
    console.error('❌ ERREUR INSCRIPTION:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
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
