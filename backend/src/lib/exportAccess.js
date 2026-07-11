const prisma = require('./prisma');
const { assertGenealogyTree } = require('./treeType');
const { getEffectivePlanLimits } = require('./planAccess');

async function loadTreeExportData(treeId) {
  const tree = await prisma.familyTree.findUnique({
    where: { id: treeId },
    include: { Person: true },
  });

  if (!tree) {
    const err = new Error('Arbre généalogique non trouvé');
    err.statusCode = 404;
    throw err;
  }

  if (tree.isDemo) {
    const err = new Error('Export indisponible pour l\'arbre de démonstration');
    err.statusCode = 403;
    err.code = 'EXPORT_DEMO_FORBIDDEN';
    throw err;
  }

  const personIds = tree.Person.map((p) => p.id);
  const relationships = personIds.length
    ? await prisma.relationship.findMany({
        where: {
          OR: [
            { sourceId: { in: personIds } },
            { targetId: { in: personIds } },
          ],
        },
      })
    : [];

  return { tree, relationships };
}

async function assertCanExportTree(tree) {
  const owner = await prisma.user.findUnique({ where: { id: tree.ownerId } });
  if (!owner) {
    const err = new Error('Propriétaire de l\'arbre introuvable');
    err.statusCode = 404;
    throw err;
  }

  const limits = getEffectivePlanLimits(owner);
  if (!limits.canExport) {
    const err = new Error('Export GEDCOM & PDF réservé aux forfaits Famille et Patrimoine');
    err.statusCode = 403;
    err.code = 'EXPORT_NOT_ALLOWED';
    throw err;
  }
}

function slugifyFilename(name) {
  return (name || 'arbre')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'arbre';
}

async function assertCanImportExportTree(tree) {
  await assertCanExportTree(tree);
  assertGenealogyTree(tree);
}

async function assertCanExportGedcom(tree) {
  await assertCanExportTree(tree);
  assertGenealogyTree(tree);
}

module.exports = {
  loadTreeExportData,
  assertCanExportTree,
  assertCanImportExportTree,
  assertCanExportGedcom,
  slugifyFilename,
};
