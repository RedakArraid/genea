// Script temporaire pour créer l'utilisateur Khadara via l'API
const https = require('http');

const userData = {
  name: 'Khadara Diarrassouba',
  email: 'kader.diarrassouba9@gmail.com',
  password: 'Password123'
};

const postData = JSON.stringify(userData);

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Création de l\'utilisateur Khadara via API...');
console.log('📧 Email:', userData.email);
console.log('👤 Nom:', userData.name);

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (res.statusCode === 201) {
        console.log('✅ Utilisateur créé avec succès!');
        console.log('🆔 ID:', response.user.id);
        console.log('👤 Nom:', response.user.name);
        console.log('📧 Email:', response.user.email);
        console.log('📅 Créé le:', response.user.createdAt);
        console.log('🔑 Token JWT généré:', response.token ? 'Oui' : 'Non');
      } else if (res.statusCode === 409) {
        console.log('⚠️ Utilisateur déjà existant');
        console.log('💬 Message:', response.message);
      } else {
        console.log('❌ Erreur lors de la création');
        console.log('💬 Réponse:', response);
      }
    } catch (error) {
      console.log('❌ Erreur de parsing:', error.message);
      console.log('📄 Réponse brute:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('💥 Erreur de requête:', error.message);
});

req.write(postData);
req.end();
