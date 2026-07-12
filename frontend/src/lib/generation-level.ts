import type { LevelOrder, OrgLexiconConfig } from "../types"
import { resolveOrgLexicon } from "./org-lexicon"

export function getMaxGeneration(people: { generation?: number }[]): number {
  if (!people.length) return 1
  return Math.max(...people.map((p) => p.generation ?? 1))
}

export function toDisplayLevel(
  generation: number,
  maxGeneration: number,
  levelOrder: LevelOrder = "TOP_HIGH"
): number {
  return levelOrder === "TOP_HIGH" ? maxGeneration - generation + 1 : generation
}

export interface LevelBadgeOptions {
  isOrg: boolean
  maxGeneration?: number
  lexicon?: OrgLexiconConfig | null
}

export function formatGenerationBadge(
  generation: number | undefined,
  options: LevelBadgeOptions
): string {
  const gen = generation ?? 1
  if (!options.isOrg) return `G${gen}`
  const lex = options.lexicon ? normalizeLex(options.lexicon) : null
  const max = options.maxGeneration ?? gen
  const abbrev = lex?.levelAbbrev ?? "N"
  const order = lex?.levelOrder ?? "TOP_HIGH"
  return `${abbrev}${toDisplayLevel(gen, max, order)}`
}

export function formatLevelFilterLabel(
  generation: number,
  maxGeneration: number,
  lexicon: OrgLexiconConfig
): string {
  const num = toDisplayLevel(generation, maxGeneration, lexicon.levelOrder)
  return `${lexicon.levelTerm} ${num} (${lexicon.levelAbbrev}${num})`
}

function normalizeLex(lex: OrgLexiconConfig): OrgLexiconConfig {
  return resolveOrgLexicon({ orgLexicon: lex })
}

/** @deprecated use toDisplayLevel */
export function toOrgLevel(generation: number, maxGeneration: number): number {
  return toDisplayLevel(generation, maxGeneration, "TOP_HIGH")
}
