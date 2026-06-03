// Script de débogage pour la console du navigateur
// Copiez ce code dans la console du navigateur (F12)

console.log('🔍 DEBUG DU STORE ZUSTAND');

// Accéder au store Zustand
const store = window.useFamilyTreeStore?.getState();

if (!store) {
  console.log('❌ Store Zustand non trouvé');
  console.log('Vérifiez que l\'application est chargée');
} else {
  console.log('✅ Store Zustand trouvé');
  
  console.log('📊 État du store:');
  console.log('- Trees:', store.trees?.length || 0);
  console.log('- Current Tree:', store.currentTree ? store.currentTree.id : 'Aucun');
  console.log('- Nodes:', store.nodes?.length || 0);
  console.log('- Edges:', store.edges?.length || 0);
  console.log('- Loading:', store.isLoading);
  console.log('- Error:', store.error);
  
  // Afficher les arêtes
  if (store.edges && store.edges.length > 0) {
    console.log('📊 Arêtes dans le store:');
    store.edges.forEach((edge, index) => {
      console.log(`  ${index + 1}. ID: ${edge.id}`);
      console.log(`     Source: ${edge.source}`);
      console.log(`     Target: ${edge.target}`);
      console.log(`     Type: ${edge.type}`);
      console.log(`     Data:`, edge.data);
      console.log(`     SourceHandle: ${edge.sourceHandle}`);
      console.log(`     TargetHandle: ${edge.targetHandle}`);
      console.log('     ---');
    });
  } else {
    console.log('❌ Aucune arête dans le store');
  }
  
  // Afficher les nœuds
  if (store.nodes && store.nodes.length > 0) {
    console.log('📊 Nœuds dans le store:');
    store.nodes.forEach((node, index) => {
      console.log(`  ${index + 1}. ID: ${node.id}`);
      console.log(`     Data:`, node.data);
      console.log(`     Position:`, node.position);
      console.log('     ---');
    });
  } else {
    console.log('❌ Aucun nœud dans le store');
  }
}

// Vérifier les arêtes transformées
console.log('🔍 VÉRIFICATION DES ARÊTES TRANSFORMÉES');

// Trouver le composant ReactFlow
const reactFlowElement = document.querySelector('[data-testid="react-flow"]') || 
                        document.querySelector('.react-flow') ||
                        document.querySelector('[class*="react-flow"]');

if (reactFlowElement) {
  console.log('✅ Composant ReactFlow trouvé');
  
  // Chercher les arêtes dans le DOM
  const edgeElements = document.querySelectorAll('[data-testid*="edge"]') ||
                      document.querySelectorAll('[class*="edge"]') ||
                      document.querySelectorAll('path[stroke]');
  
  console.log(`📊 ${edgeElements.length} éléments d'arête trouvés dans le DOM`);
  
  edgeElements.forEach((element, index) => {
    console.log(`  ${index + 1}. Element:`, element);
    console.log(`     Classes:`, element.className);
    console.log(`     Data-testid:`, element.getAttribute('data-testid'));
    console.log('     ---');
  });
} else {
  console.log('❌ Composant ReactFlow non trouvé');
}
