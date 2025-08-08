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
    console.log('🚀 Début inscription - Body reçu:', req.body);

    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Erreurs de validation:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    console.log('✅ Données validées:', { name, email, passwordLength: password?.length });
    
    // Vérification que l'email n'est pas déjà utilisé
    console.log('🔍 Vérification email existant pour:', email);
    const existingUser = await prisma.User.findUnique({
      where: { email }
    });
    console.log('��� Utilisateur existant trouvé:', !!existingUser);

    if (existingUser) {
      console.log('❌ Email déjà utilisé');
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hachage du mot de passe
    console.log('🔐 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Mot de passe haché');

    // Création de l'utilisateur
    console.log('👤 Création de l\'utilisateur...');
    const newUser = await prisma.User.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });
    console.log('✅ Utilisateur créé avec ID:', newUser.id);
    
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
    console.error('❌ Erreur lors de l\'inscription:', error);
    console.error('📋 Stack trace:', error.stack);
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
