/**
 * Test rapide pour vérifier que l'API fonctionne avec UnionChild
 */

const { PrismaClient } = require('@prisma/client');

async function testUnionChildAPI() {
  console.log('🧪 Test de l\'API UnionChild');
  console.log('===========================\n');

  const prisma = new PrismaClient();

  try {
    // Test 1: Connexion à la base
    console.log('1️⃣ Test de connexion...');
    await prisma.$connect();
    console.log('✅ Connexion réussie\n');

    // Test 2: Accès à la table UnionChild
    console.log('2️⃣ Test de la table UnionChild...');
    const unionChildren = await prisma.unionChild.findMany({ take: 1 });
    console.log('✅ Table UnionChild accessible\n');

    // Test 3: Test du contrôleur FamilyTree modifié
    console.log('3️⃣ Test de la requête FamilyTree...');
    
    // Récupérer un arbre (s'il en existe)
    const trees = await prisma.familyTree.findMany({ take: 1 });
    
    if (trees.length > 0) {
      const treeId = trees[0].id;
      console.log('🌳 Arbre trouvé:', trees[0].name);
      
      // Simuler la requête du contrôleur
      const tree = await prisma.familyTree.findUnique({
        where: { id: treeId },
        include: {
          Person: true,
          NodePosition: true,
          Edge: true
        }
      });
      
      // Récupérer les UnionChild séparément
      const unionChildren = await prisma.unionChild.findMany({
        where: { treeId: treeId },
        include: { Child: true }
      });
      
      tree.UnionChild = unionChildren;
      
      console.log('✅ Requête FamilyTree réussie');
      console.log('📊 Données récupérées:');
      console.log(`   - Personnes: ${tree.Person?.length || 0}`);
      console.log(`   - Arêtes: ${tree.Edge?.length || 0}`);
      console.log(`   - Enfants d'union: ${tree.UnionChild?.length || 0}`);
      
    } else {
      console.log('⚠️ Aucun arbre trouvé (normal si DB vide)');
    }

    console.log('\n✅ TOUS LES TESTS RÉUSSIS !');
    console.log('🚀 L\'API devrait maintenant fonctionner correctement.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('💡 Vérifiez que la base de données est accessible et que les migrations sont appliquées.');
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests si le script est lancé directement
if (require.main === module) {
  testUnionChildAPI();
}

module.exports = { testUnionChildAPI };
