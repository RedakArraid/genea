import {
  MARKETING_DEMO_PERSONS,
  MARKETING_DEMO_POSITIONS,
  MARKETING_DEMO_RELATIONSHIPS,
  MARKETING_HIGHLIGHT_PERSON_ID,
} from "@/lib/marketing-tree-demo"
import { MarketingTreePreview } from "@/components/marketing/marketing-tree-preview"

export function AnimatedTreeHero({ className }: { className?: string }) {
  return (
    <MarketingTreePreview
      className={className}
      persons={MARKETING_DEMO_PERSONS}
      relationships={MARKETING_DEMO_RELATIONSHIPS}
      initialPositions={MARKETING_DEMO_POSITIONS}
      highlightPersonId={MARKETING_HIGHLIGHT_PERSON_ID}
    />
  )
}
