/**
 * Script de vérification de santé pour le backend GeneaIA
 * Utilisé par Docker pour vérifier que l'application fonctionne correctement
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const healthCheck = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✅ Backend is healthy');
    process.exit(0);
  } else {
    console.log('❌ Backend is unhealthy');
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.log('❌ Health check failed:', err.message);
  process.exit(1);
});

healthCheck.on('timeout', () => {
  console.log('❌ Health check timed out');
  healthCheck.destroy();
  process.exit(1);
});

healthCheck.end();
