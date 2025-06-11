/**
 * Script de test pour valider la distance fixe de 200px
 * entre les générations dans l'alignement automatique
 */

import { simpleGenerationAlignment, smartGenerationAlignment } from '../frontend/src/utils/simpleAlignment.js';
import { debugAlignment } from '../frontend/src/utils/debugAlignment.js';

// Données de test : Grand-parent -> Parent -> Enfant
const testNodes = [
  {
    id: 'grand-pere',
    data: { firstName: 'Jean', lastName: 'Dupont' },
    position: { x: 100, y: 50 }
  },
  {
    id: 'grand-mere', 
    data: { firstName: 'Marie', lastName: 'Dupont' },
    position: { x: 200, y: 60 }
  },
  {
    id: 'pere',
    data: { firstName: 'Pierre', lastName: 'Dupont' },
    position: { x: 150, y: 300 }
  },
  {
    id: 'mere',
    data: { firstName: 'Sophie', lastName: 'Dupont' },
    position: { x: 250, y: 320 }
  },
  {
    id: 'enfant1',
    data: { firstName: 'Lucas', lastName: 'Dupont' },
    position: { x: 100, y: 600 }
  },
  {
    id: 'enfant2',
    data: { firstName: 'Emma', lastName: 'Dupont' },
    position: { x: 300, y: 620 }
  }
];

const testEdges = [
  // Relations parent-enfant
  {
    id: 'edge1',
    source: 'grand-pere',
    target: 'pere',
    data: { type: 'parent_child_connection' }
  },
  {
    id: 'edge2', 
    source: 'grand-mere',
    target: 'pere',
    data: { type: 'parent_child_connection' }
  },
  {
    id: 'edge3',
    source: 'pere',
    target: 'enfant1',
    data: { type: 'parent_child_connection' }
  },
  {
    id: 'edge4',
    source: 'mere',
    target: 'enfant1', 
    data: { type: 'parent_child_connection' }
  },
  {
    id: 'edge5',
    source: 'pere',
    target: 'enfant2',
    data: { type: 'parent_child_connection' }
  },
  {
    id: 'edge6',
    source: 'mere',
    target: 'enfant2',
    data: { type: 'parent_child_connection' }
  },
  // Relations conjugales
  {
    id: 'mariage1',
    source: 'grand-pere',
    target: 'grand-mere',
    data: { type: 'spouse_connection' }
  },
  {
    id: 'mariage2',
    source: 'pere',
    target: 'mere',
    data: { type: 'spouse_connection' }
  }
];

// Fonction de test
function testFixedDistance() {
  console.log('🧪 TEST: Distance fixe 200px entre générations');
  console.log('===============================================');
  
  // Test avec chaque algorithme d'alignement
  const algorithms = [
    { name: 'Simple', func: simpleGenerationAlignment },
    { name: 'Smart', func: smartGenerationAlignment },
    { name: 'Debug', func: debugAlignment }
  ];
  
  algorithms.forEach(({ name, func }) => {
    console.log(`\n📋 Test ${name} Alignment:`);
    
    try {
      const alignedNodes = func(testNodes, testEdges);
      
      if (!alignedNodes || alignedNodes.length === 0) {
        console.log(`❌ ${name}: Aucun nœud aligné`);
        return;
      }
      
      // Grouper par génération (même Y)
      const generations = new Map();
      alignedNodes.forEach(node => {
        const y = node.position.y;
        if (!generations.has(y)) {
          generations.set(y, []);
        }
        generations.get(y).push(node);
      });
      
      const sortedYs = Array.from(generations.keys()).sort((a, b) => a - b);
      console.log(`   Générations trouvées: ${sortedYs.length}`);
      
      // Vérifier les distances entre générations
      let allDistancesValid = true;
      for (let i = 1; i < sortedYs.length; i++) {
        const distance = sortedYs[i] - sortedYs[i-1];
        const isValid = distance === 200;
        
        console.log(`   Gen ${i-1} → Gen ${i}: ${distance}px ${isValid ? '✅' : '❌'}`);
        
        if (!isValid) {
          allDistancesValid = false;
        }
        
        // Afficher les personnes dans chaque génération
        const genPrevious = generations.get(sortedYs[i-1]);
        const genCurrent = generations.get(sortedYs[i]);
        
        const namesPrev = genPrevious.map(n => n.data.firstName).join(', ');
        const namesCurr = genCurrent.map(n => n.data.firstName).join(', ');
        
        console.log(`     ${namesPrev} (y=${sortedYs[i-1]}) → ${namesCurr} (y=${sortedYs[i]})`);
      }
      
      console.log(`\n   Résultat ${name}: ${allDistancesValid ? '✅ VALIDÉ' : '❌ ÉCHEC'}`);
      
      if (allDistancesValid) {
        console.log(`   🎉 ${name}: Distance fixe 200px respectée !`);
      } else {
        console.log(`   ⚠️ ${name}: Distance fixe NON respectée`);
      }
      
    } catch (error) {
      console.log(`❌ ${name}: Erreur - ${error.message}`);
    }
  });
  
  console.log('\n===============================================');
  console.log('🏁 Tests terminés');
}

// Configuration pour Node.js vs Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFixedDistance };
} else if (typeof window !== 'undefined') {
  window.testFixedDistance = testFixedDistance;
}

// Auto-exécution si script lancé directement
if (typeof require !== 'undefined' && require.main === module) {
  testFixedDistance();
}
