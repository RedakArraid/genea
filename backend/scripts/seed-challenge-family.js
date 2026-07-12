#!/usr/bin/env node
/**
 * Crée l'arbre test Challenge Family pour le compte famille40 (0700000003).
 * Usage : node scripts/seed-challenge-family.js [--replace]
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const prisma = require('../src/lib/prisma');
const { createChallengeFamilyTree, TREE_NAME } = require('../src/lib/challengeFamilyTree');

const OWNER_PHONE = process.env.CHALLENGE_OWNER_PHONE || '+2250700000003';

async function main() {
  const replace = process.argv.includes('--replace');

  const owner = await prisma.user.findFirst({
    where: { phone: OWNER_PHONE },
    select: { id: true, phone: true, email: true, name: true },
  });

  if (!owner) {
    console.error(`Utilisateur introuvable (${OWNER_PHONE}). Lancez d'abord: npm run db:seed`);
    process.exit(1);
  }

  const result = await createChallengeFamilyTree(owner.id, { replace });

  console.log('Challenge Family — arbre créé');
  console.log(`  Propriétaire : ${owner.name} (${owner.phone})`);
  console.log(`  Arbre        : ${TREE_NAME}`);
  console.log(`  ID           : ${result.tree.id}`);
  console.log(`  Membres      : ${result.personCount}`);
  console.log(`  Promos       : ${result.promos?.length ?? 5}`);
  if (result.skipped) {
    console.log('  (arbre existant — utilisez --replace pour recréer)');
  }
  console.log(`\nOuvrir : /family-tree/${result.tree.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
