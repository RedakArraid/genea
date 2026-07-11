export type TreeType = "GENEALOGY" | "ORGANIZATION"

export function isOrganizationTree(tree?: { treeType?: TreeType } | null): boolean {
  return tree?.treeType === "ORGANIZATION"
}

export function isGenealogyTree(tree?: { treeType?: TreeType } | null): boolean {
  return !tree?.treeType || tree.treeType === "GENEALOGY"
}
