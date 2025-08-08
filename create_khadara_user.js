const bcrypt = require('bcryptjs');

// Fonction pour créer l'utilisateur Khadara directement dans Supabase
async function createKhadaraUser() {
  const userData = {
    name: 'Khadara Diarrassouba',
    email: 'kader.diarrassouba9@gmail.com',
    password: 'Password123'
  };

  try {
    console.log('🚀 Création de l\'utilisateur Khadara...');
    console.log('📧 Email:', userData.email);
    console.log('👤 Nom:', userData.name);

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    console.log('🔐 Mot de passe haché avec succès');

    // Pour l'instant, afficher les informations (l'insertion se fera via l'API)
    console.log('✅ Données préparées pour insertion:');
    console.log({
      name: userData.name,
      email: userData.email,
      hashedPassword: hashedPassword.substring(0, 20) + '...'
    });

    return {
      name: userData.name,
      email: userData.email,
      hashedPassword
    };

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

// Si exécuté directement
if (require.main === module) {
  createKhadaraUser()
    .then(() => console.log('🎉 Préparation terminée'))
    .catch(err => console.error('💥 Erreur:', err));
}

module.exports = createKhadaraUser;
