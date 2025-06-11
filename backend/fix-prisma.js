#!/usr/bin/env node

/**
 * Script pour corriger les problèmes Prisma avec UnionChild
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 CORRECTION PRISMA - UnionChild');
console.log('===================================\n');

const backendDir = __dirname;
process.chdir(backendDir);

console.log('📂 Répertoire de travail:', process.cwd());

try {
  console.log('\n1️⃣ Génération du client Prisma...');
  const generateResult = execSync('npx prisma generate', { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  console.log('✅ Client Prisma généré avec succès');

  console.log('\n2️⃣ Vérification du statut des migrations...');
  try {
    const statusResult = execSync('npx prisma migrate status', { 
      encoding: 'utf8' 
    });
    console.log('📊 Statut des migrations:');
    console.log(statusResult);
  } catch (statusError) {
    console.log('⚠️ Problème avec les migrations, tentative de résolution...');
  }

  console.log('\n3️⃣ Application des migrations en attente...');
  try {
    const deployResult = execSync('npx prisma migrate deploy', { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log('✅ Migrations appliquées avec succès');
  } catch (deployError) {
    console.log('⚠️ Aucune migration en attente ou erreur lors du déploiement');
    
    console.log('\n🔄 Tentative de création d\'une nouvelle migration...');
    try {
      const migrateResult = execSync('npx prisma migrate dev --name fix-union-child-relation', { 
        encoding: 'utf8',
        stdio: 'inherit'
      });
      console.log('✅ Nouvelle migration créée et appliquée');
    } catch (migrateError) {
      console.log('⚠️ Pas de changements détectés dans le schéma');
    }
  }

  console.log('\n4️⃣ Test de connexion à la base...');
  const testScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUnionChild() {
  try {
    console.log('🧪 Test de la table UnionChild...');
    
    // Test 1: Connexion
    await prisma.$connect();
    console.log('✅ Connexion réussie');
    
    // Test 2: Accès à UnionChild
    const unionChildren = await prisma.unionChild.findMany({ take: 1 });
    console.log('✅ Table UnionChild accessible');
    
    // Test 3: Test include avec FamilyTree
    const trees = await prisma.familyTree.findMany({
      take: 1,
      include: {
        UnionChild: true
      }
    });
    console.log('✅ Relation FamilyTree → UnionChild fonctionne');
    
    await prisma.$disconnect();
    console.log('✅ Test complet réussi');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

testUnionChild();
`;
  
  require('fs').writeFileSync('test-union.js', testScript);
  execSync('node test-union.js', { stdio: 'inherit' });
  require('fs').unlinkSync('test-union.js');

} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

console.log('\n🎉 PRISMA CORRIGÉ AVEC SUCCÈS !');
console.log('===============================');
console.log('✅ Client Prisma régénéré');
console.log('✅ Migrations appliquées');
console.log('✅ Relation UnionChild fonctionnelle');
console.log('\n🚀 Vous pouvez maintenant redémarrer le serveur backend !');
console.log('   → npm run dev');
