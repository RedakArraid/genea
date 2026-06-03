// Test unitaire simple pour valider les corrections de dates
// Placez ce fichier dans frontend/src/utils/dateValidation.test.js

/**
 * Fonction de validation des dates extraite de notre logique
 */
function validateDate(dateValue, fieldName) {
  try {
    if (!dateValue) return { valid: true, value: null };
    
    if (typeof dateValue !== 'string') {
      return { valid: false, error: `${fieldName} doit être une chaîne de caractères` };
    }
    
    const trimmedValue = dateValue.trim();
    if (!trimmedValue) return { valid: true, value: null };
    
    const date = new Date(trimmedValue);
    if (isNaN(date.getTime())) {
      return { valid: false, error: `${fieldName} n'est pas une date valide` };
    }
    
    const year = date.getFullYear();
    if (year < 1800 || year > new Date().getFullYear()) {
      return { valid: false, error: `${fieldName} doit être entre 1800 et aujourd'hui` };
    }
    
    return { valid: true, value: trimmedValue };
  } catch (error) {
    return { valid: false, error: `Erreur lors de la validation de ${fieldName}: ${error.message}` };
  }
}

/**
 * Tests des cas d'usage
 */
function runTests() {
  console.log('🧪 Tests de validation des dates');
  console.log('================================');
  
  const testCases = [
    // Cas valides
    { input: '1990-01-01', field: 'birthDate', expected: true },
    { input: '2000-12-31', field: 'birthDate', expected: true },
    { input: '', field: 'birthDate', expected: true }, // Vide est valide
    { input: null, field: 'birthDate', expected: true },
    { input: undefined, field: 'birthDate', expected: true },
    
    // Cas invalides
    { input: 'invalid-date', field: 'birthDate', expected: false },
    { input: '1799-01-01', field: 'birthDate', expected: false }, // Trop ancien
    { input: '2030-01-01', field: 'birthDate', expected: false }, // Futur
    { input: 123, field: 'birthDate', expected: false }, // Pas une string
    { input: '2000-13-01', field: 'birthDate', expected: false }, // Mois invalide
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = validateDate(testCase.input, testCase.field);
    const success = result.valid === testCase.expected;
    
    if (success) {
      console.log(`✅ Test ${index + 1}: PASS`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: FAIL`);
      console.log(`   Input: ${testCase.input}`);
      console.log(`   Expected: ${testCase.expected}`);
      console.log(`   Got: ${result.valid}`);
      console.log(`   Error: ${result.error || 'none'}`);
      failed++;
    }
  });
  
  console.log('');
  console.log(`📊 Résultats: ${passed} réussis, ${failed} échoués`);
  
  if (failed === 0) {
    console.log('🎉 Tous les tests sont passés !');
  } else {
    console.log('⚠️  Certains tests ont échoué');
  }
}

// Exporter pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateDate, runTests };
} else {
  // Exécuter directement dans le navigateur
  runTests();
}
