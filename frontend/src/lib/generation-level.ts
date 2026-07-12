/** Plus haut dans l'organigramme = niveau N plus élevé ; la base = N1. */
export function getMaxGeneration(people: { generation?: number }[]): number {
  if (!people.length) return 1
  return Math.max(...people.map((p) => p.generation ?? 1))
}

export function toOrgLevel(generation: number, maxGeneration: number): number {
  return maxGeneration - generation + 1
}

export function formatGenerationBadge(
  generation: number | undefined,
  options: { isOrg: boolean; maxGeneration?: number }
): string {
  const gen = generation ?? 1
  if (!options.isOrg) return `G${gen}`
  const max = options.maxGeneration ?? gen
  return `N${toOrgLevel(gen, max)}`
}
