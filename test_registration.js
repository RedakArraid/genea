const axios = require('axios');

async function testRegistration() {
  try {
    console.log('🧪 Test d\'inscription...');
    
    const response = await axios.post('http://localhost:3002/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('✅ Inscription réussie!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur:', error.response ? error.response.data : error.message);
    console.error('Status:', error.response ? error.response.status : 'Network Error');
  }
}

testRegistration();
