const axios = require('axios');

async function testRegister() {
  try {
    console.log('🧪 Test d\'inscription via API...');
    
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    console.log('📤 Envoi des données:', testData);
    
    const response = await axios.post('http://localhost:3001/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Succès!', response.data);
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    console.error('📊 Status:', error.response?.status);
    console.error('🔍 Headers:', error.response?.headers);
  }
}

testRegister();
