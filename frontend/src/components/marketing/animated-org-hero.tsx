import { useMemo } from "react"
import {
  MARKETING_ORG_COMPANY_NAME,
  MARKETING_ORG_HIGHLIGHT_PERSON_ID,
  MARKETING_ORG_PERSONS,
  MARKETING_ORG_RELATIONSHIPS,
} from "@/lib/marketing-org-demo"
import { buildConnections, computeLayout, getCardDimensions, normalizePersons } from "@/utils/tree-layout"
import type { NormalizedPerson, PersonTone } from "@/types"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

const TONE_STYLES: Record<PersonTone, { bg: string; fg: string }> = {
  stone: { bg: "bg-stone-100", fg: "text-stone-700" },
  rose: { bg: "bg-rose-100", fg: "text-rose-700" },
  ocean: { bg: "bg-sky-100", fg: "text-sky-700" },
  sage: { bg: "bg-emerald-100", fg: "text-emerald-700" },
  amber: { bg: "bg-amber-100", fg: "text-amber-700" },
  plum: { bg: "bg-violet-100", fg: "text-violet-700" },
}

const CANVAS_PADDING = 40

function computePreviewBounds(
  people: NormalizedPerson[],
  positions: Record<string, { x: number; y: number }>,
  cardW: number,
  cardH: number,
  connections: ReturnType<typeof buildConnections>
) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const include = (x: number, y: number) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  for (const p of people) {
    const pos = positions[p.id]
    if (!pos) continue
    include(pos.x, pos.y)
    include(pos.x + cardW, pos.y + cardH)
  }

  for (const c of connections) {
    if (c.midX != null && c.midY != null) include(c.midX, c.midY)
  }

  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, width: 600, height: 400, offsetX: 0, offsetY: 0 }
  }

  minX -= CANVAS_PADDING
  minY -= CANVAS_PADDING
  maxX += CANVAS_PADDING
  maxY += CANVAS_PADDING

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
    offsetX: -minX,
    offsetY: -minY,
  }
}

function MiniOrgCard({
  person,
  x,
  y,
  w,
  h,
  selected,
}: {
  person: NormalizedPerson
  x: number
  y: number
  w: number
  h: number
  selected?: boolean
}) {
  const tone = TONE_STYLES[person.tone] || TONE_STYLES.stone
  const role = person.occupation?.trim() || ""

  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow",
        selected && "ring-2 ring-primary marketing-tree-pulse"
      )}
      style={{ left: x, top: y, width: w, height: h }}
    >
      <div className={cn("flex h-9 items-center justify-center text-[10px] font-bold", tone.bg, tone.fg)}>
        {(person.given[0] || "?").toUpperCase()}
        {(person.sur && person.sur !== "-" ? person.sur[0] : "").toUpperCase()}
      </div>
      <div className="px-2 py-1">
        <p className="truncate text-[10px] font-semibold leading-tight">
          {person.given} {person.sur !== "-" ? person.sur : ""}
        </p>
        {role ? <p className="truncate text-[9px] text-muted-foreground">{role}</p> : null}
      </div>
    </div>
  )
}

export function AnimatedOrgHero({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion()
  const { w: cardW, h: cardH } = getCardDimensions("square", { organization: true })

  const { people, positions, connections, bounds } = useMemo(() => {
    const normalized = normalizePersons(MARKETING_ORG_PERSONS, MARKETING_ORG_RELATIONSHIPS)
    const { positions: pos } = computeLayout(normalized, "vertical", "spacious", { organization: true })
    const conns = buildConnections(normalized, pos, "elbow", "vertical", cardW, cardH)
    const b = computePreviewBounds(normalized, pos, cardW, cardH, conns)
    return { people: normalized, positions: pos, connections: conns, bounds: b }
  }, [cardW, cardH])

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted/30 shadow-lg backdrop-blur-sm",
        className
      )}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b bg-background/80 px-3 py-2 text-xs backdrop-blur-sm">
        <span className="font-semibold text-foreground">{MARKETING_ORG_COMPANY_NAME}</span>
        <span className="text-muted-foreground">{people.length} collaborateurs</span>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/40 via-transparent to-muted/50" />
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center pt-8",
          !reducedMotion && "marketing-tree-drift"
        )}
      >
        <div
          className="relative origin-center scale-[0.58] sm:scale-[0.65] lg:scale-[0.72]"
          style={{ width: bounds.width, height: bounds.height }}
        >
          <svg
            className="pointer-events-none absolute left-0 top-0 z-[1] marketing-tree-lines-in"
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
            width={bounds.width}
            height={bounds.height}
          >
            {connections.map((c, i) => (
              <g key={i}>
                <path
                  d={c.path}
                  fill="none"
                  stroke="var(--background)"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                <path
                  d={c.path}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  opacity={0.9}
                />
              </g>
            ))}
          </svg>

          {people.map((p) => {
            const pos = positions[p.id]
            if (!pos) return null
            return (
              <MiniOrgCard
                key={p.id}
                person={p}
                x={pos.x + bounds.offsetX}
                y={pos.y + bounds.offsetY}
                w={cardW}
                h={cardH}
                selected={p.id === MARKETING_ORG_HIGHLIGHT_PERSON_ID}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
