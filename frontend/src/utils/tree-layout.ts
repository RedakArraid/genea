import type { NormalizedPerson, Person, Relationship } from "@/types"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - legacy layout engine
import {
  computeLayout as rawComputeLayout,
  normalizePersons as rawNormalizePersons,
  buildConnections as rawBuildConnections,
  computeLineage as rawComputeLineage,
  CARD_W,
  CARD_H,
  getCardDimensions as rawGetCardDimensions,
} from "./layout-engine"

export { CARD_W, CARD_H }

export function getCardDimensions(cardStyle = "square") {
  return rawGetCardDimensions(cardStyle) as { w: number; h: number }
}

export function normalizePersons(
  apiPersons: Person[],
  apiRelationships?: Relationship[]
): NormalizedPerson[] {
  return rawNormalizePersons(apiPersons, apiRelationships as never) as NormalizedPerson[]
}

export function computeLayout(
  people: NormalizedPerson[],
  layout = "vertical",
  density = "spacious"
) {
  return rawComputeLayout(people, layout, density) as {
    positions: Record<string, { x: number; y: number }>
    canvasW: number
    canvasH: number
  }
}

export function buildConnections(
  people: NormalizedPerson[],
  positions: Record<string, { x: number; y: number }>,
  connStyle = "elbow",
  layout = "vertical",
  cardW = CARD_W,
  cardH = CARD_H
) {
  return rawBuildConnections(people, positions, connStyle, layout, cardW, cardH)
}

export function computeLineage(rootId: string, people: NormalizedPerson[]) {
  return rawComputeLineage(rootId, people) as Set<string>
}
