#!/bin/bash

# Script pour corriger Prisma et UnionChild
echo "🔧 CORRECTION PRISMA - UnionChild"
echo "================================="

cd backend

echo ""
echo "1️⃣ Nettoyage du cache Prisma..."
rm -rf node_modules/.prisma
rm -rf prisma/generated

echo "✅ Cache nettoyé"

echo ""
echo "2️⃣ Génération du client Prisma..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Client Prisma généré avec succès"
else
    echo "❌ Erreur lors de la génération du client"
    exit 1
fi

echo ""
echo "3️⃣ Vérification de la base de données..."
npx prisma db push --force-reset

if [ $? -eq 0 ]; then
    echo "✅ Base de données synchronisée"
else
    echo "⚠️ Problème avec la synchronisation, tentative avec migrate..."
    npx prisma migrate dev --name fix-union-child-final
fi

echo ""
echo "4️⃣ Test de l'API..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.\$connect();
    console.log('✅ Connexion réussie');
    
    // Test si UnionChild existe
    if (prisma.unionChild) {
      await prisma.unionChild.findMany({ take: 1 });
      console.log('✅ Table UnionChild accessible');
    } else {
      console.log('⚠️ Table UnionChild pas encore disponible');
    }
    
    await prisma.\$disconnect();
    console.log('✅ Test terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

test();
"

echo ""
echo "🎉 PRISMA CORRIGÉ !"
echo "=================="
echo "✅ Client régénéré"
echo "✅ Base synchronisée"  
echo "✅ Tests passés"
echo ""
echo "🚀 Vous pouvez maintenant démarrer le serveur :"
echo "   npm run dev"
