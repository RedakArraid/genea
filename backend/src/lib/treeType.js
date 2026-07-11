function isOrganizationTree(tree) {
  return tree?.treeType === 'ORGANIZATION';
}

function isGenealogyTree(tree) {
  return !tree?.treeType || tree.treeType === 'GENEALOGY';
}

function assertGenealogyTree(tree) {
  if (isOrganizationTree(tree)) {
    const err = new Error('Fonctionnalité réservée aux arbres généalogiques');
    err.statusCode = 403;
    err.code = 'GENEALOGY_TREE_REQUIRED';
    throw err;
  }
}

module.exports = {
  isOrganizationTree,
  isGenealogyTree,
  assertGenealogyTree,
};
