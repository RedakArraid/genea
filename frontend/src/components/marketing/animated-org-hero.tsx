import {
  MARKETING_ORG_COMPANY_NAME,
  MARKETING_ORG_HIGHLIGHT_PERSON_ID,
  MARKETING_ORG_PERSONS,
  MARKETING_ORG_RELATIONSHIPS,
} from "@/lib/marketing-org-demo"
import { MarketingTreePreview } from "@/components/marketing/marketing-tree-preview"

export function AnimatedOrgHero({ className }: { className?: string }) {
  return (
    <MarketingTreePreview
      className={className}
      persons={MARKETING_ORG_PERSONS}
      relationships={MARKETING_ORG_RELATIONSHIPS}
      isOrg
      highlightPersonId={MARKETING_ORG_HIGHLIGHT_PERSON_ID}
      header={
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">{MARKETING_ORG_COMPANY_NAME}</span>
          <span className="text-muted-foreground">{MARKETING_ORG_PERSONS.length} collaborateurs</span>
        </div>
      }
    />
  )
}
