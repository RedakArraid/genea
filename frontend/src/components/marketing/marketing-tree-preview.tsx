import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { PersonCard } from "@/components/family-tree/person-card"
import { buildConnections, computeLayout, getCardDimensions, normalizePersons } from "@/utils/tree-layout"
import type { Person, Relationship, TreeTweaks } from "@/types"
import { getMaxGeneration } from "@/lib/generation-level"
import { resolveOrgLexicon } from "@/lib/org-lexicon"
import {
  computeMarketingConnectionBounds,
  computeMarketingContentBounds,
  computeMarketingFitScale,
  MARKETING_VIEW_PADDING,
} from "@/lib/marketing-tree-viewport"
import { cn } from "@/lib/utils"

const PREVIEW_TWEAKS: TreeTweaks = {
  layout: "vertical",
  connStyle: "elbow",
  cardStyle: "square",
  density: "spacious",
  generation: "all",
  hidePhotos: false,
  hideDates: false,
  hidePlaces: false,
}

interface MarketingTreePreviewProps {
  persons: Person[]
  relationships: Relationship[]
  /** Positions fixes (ex. démo Famille Dupont) — sinon layout auto */
  initialPositions?: Record<string, { x: number; y: number }>
  isOrg?: boolean
  highlightPersonId?: string
  header?: ReactNode
  className?: string
}

export function MarketingTreePreview({
  persons,
  relationships,
  initialPositions,
  isOrg = false,
  highlightPersonId,
  header,
  className,
}: MarketingTreePreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 40, y: 32 })
  const [scale, setScale] = useState(0.5)
  const [selectedId] = useState<string | null>(highlightPersonId ?? null)

  const people = useMemo(
    () => normalizePersons(persons, relationships),
    [persons, relationships]
  )

  const positions = useMemo(() => {
    if (initialPositions) return initialPositions
    return computeLayout(people, PREVIEW_TWEAKS.layout, PREVIEW_TWEAKS.density, {
      organization: isOrg,
    }).positions
  }, [people, initialPositions, isOrg])

  const { w: cardW, h: cardH } = useMemo(
    () => getCardDimensions(PREVIEW_TWEAKS.cardStyle, { organization: isOrg }),
    [isOrg]
  )

  const orgLexicon = useMemo(() => (isOrg ? resolveOrgLexicon(null) : null), [isOrg])
  const maxGens = useMemo(() => getMaxGeneration(people), [people])

  const connections = useMemo(
    () =>
      buildConnections(
        people,
        positions,
        PREVIEW_TWEAKS.connStyle,
        PREVIEW_TWEAKS.layout,
        cardW,
        cardH
      ),
    [people, positions, cardW, cardH]
  )

  const connectionBounds = useMemo(
    () => computeMarketingConnectionBounds(people, positions, cardW, cardH, connections),
    [people, positions, cardW, cardH, connections]
  )

  const fitToView = useCallback(() => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r || people.length === 0) return

    const headerOffset = header ? 40 : 0
    const personIds = new Set(people.map((p) => p.id))
    let bounds = computeMarketingContentBounds(positions, personIds, cardW, cardH)
    if (!bounds || bounds.width === 0 || bounds.height === 0) return

    const availW = r.width - MARKETING_VIEW_PADDING * 2
    const availH = r.height - MARKETING_VIEW_PADDING * 2 - headerOffset
    const newScale = computeMarketingFitScale(bounds, availW, availH)

    const visibleCenterX = MARKETING_VIEW_PADDING + availW / 2
    const visibleCenterY = headerOffset + MARKETING_VIEW_PADDING + availH / 2

    setScale(newScale)
    setPan({
      x: visibleCenterX - bounds.centerX * newScale,
      y: visibleCenterY - bounds.centerY * newScale,
    })
  }, [people, positions, cardW, cardH, header, isOrg])

  useEffect(() => {
    const frame = requestAnimationFrame(() => fitToView())
    return () => cancelAnimationFrame(frame)
  }, [fitToView])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || people.length === 0) return
    const observer = new ResizeObserver(() => fitToView())
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [people.length, fitToView])

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted/20 shadow-lg",
        className
      )}
      aria-hidden="true"
    >
      {header ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 border-b bg-background/90 px-3 py-2 text-xs backdrop-blur-sm">
          {header}
        </div>
      ) : null}
      <div
        className={cn("absolute inset-0 z-[1]", header && "top-10")}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <svg
          className="pointer-events-none absolute z-[1]"
          viewBox={`${connectionBounds.minX} ${connectionBounds.minY} ${connectionBounds.width} ${connectionBounds.height}`}
          width={connectionBounds.width}
          height={connectionBounds.height}
          style={{ left: connectionBounds.minX, top: connectionBounds.minY }}
        >
          {connections.map((c, i) => (
            <g key={i}>
              <path
                d={c.path}
                fill="none"
                stroke="var(--background)"
                strokeWidth={4.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={c.kind === "spouse" ? "6 4" : undefined}
              />
              <path
                d={c.path}
                fill="none"
                stroke={c.kind === "spouse" ? "var(--muted-foreground)" : "var(--primary)"}
                strokeWidth={2.5}
                strokeLinecap="butt"
                strokeLinejoin="miter"
                strokeDasharray={c.kind === "spouse" ? "6 4" : undefined}
                opacity={0.95}
              />
            </g>
          ))}
        </svg>

        {people.map((p) => {
          const pos = positions[p.id]
          if (!pos) return null
          return (
            <PersonCard
              key={p.id}
              person={p}
              pos={pos}
              scale={scale}
              cardStyle={PREVIEW_TWEAKS.cardStyle}
              isOrg={isOrg}
              maxGeneration={maxGens}
              lexicon={orgLexicon}
              hidePhotos={PREVIEW_TWEAKS.hidePhotos}
              hideDates={PREVIEW_TWEAKS.hideDates}
              hidePlaces={PREVIEW_TWEAKS.hidePlaces}
              selected={selectedId === p.id || p.id === highlightPersonId}
              highlight={p.id === highlightPersonId}
            />
          )
        })}
      </div>
    </div>
  )
}
