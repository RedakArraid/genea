import { useRef, useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Search, Settings, Share2, LayoutGrid, Maximize2 } from "lucide-react"
import { PersonCard } from "./person-card"
import { buildConnections, computeLineage, getCardDimensions } from "@/utils/tree-layout"
import type { NormalizedPerson, TreeTweaks } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const TOOLBAR_H = 48
const VIEW_PADDING = 40

function computeContentBounds(
  positions: Record<string, { x: number; y: number }>,
  personIds: Set<string>,
  cardW: number,
  cardH: number
) {
  const entries = Object.entries(positions).filter(([id]) => personIds.has(id))
  if (entries.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [, pos] of entries) {
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + cardW)
    maxY = Math.max(maxY, pos.y + cardH)
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

interface TreeCanvasProps {
  people: NormalizedPerson[]
  tweaks: TreeTweaks
  positions: Record<string, { x: number; y: number }>
  setPositions: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }>>>
  selectedId: string | null
  onSelect: (id: string) => void
  hoverId: string | null
  onHover: (id: string | null) => void
  canvasW?: number
  canvasH?: number
  onOpenAdd: (parentId?: string | null, relType?: string | null, parent2Id?: string | null) => void
  onOpenShare: () => void
  onOpenTweaks: () => void
  onSetTweak: (key: keyof TreeTweaks, val: string | boolean) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  onReorganize?: () => void
  fitRequestId?: number
  readOnly?: boolean
  canDrag?: boolean
  isDemo?: boolean
  canShare?: boolean
}

export function TreeCanvas({
  people = [],
  tweaks,
  positions,
  setPositions,
  selectedId,
  onSelect,
  hoverId,
  onHover,
  canvasW = 1400,
  canvasH = 1000,
  onOpenAdd,
  onOpenShare,
  onOpenTweaks,
  onSetTweak,
  searchQuery,
  onSearchChange,
  onReorganize,
  fitRequestId = 0,
  readOnly = false,
  canDrag = true,
  isDemo = false,
  canShare = true,
}: TreeCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const lastFitKeyRef = useRef<string | null>(null)
  const [pan, setPan] = useState({ x: 60, y: 40 })
  const [scale, setScale] = useState(0.85)
  const [panning, setPanning] = useState(false)

  const layout = tweaks.layout || "vertical"
  const connStyle = tweaks.connStyle || "elbow"
  const genFilter = tweaks.generation || "all"
  const cardStyle = tweaks.cardStyle || "square"
  const { w: cardW, h: cardH } = useMemo(() => getCardDimensions(cardStyle), [cardStyle])

  const filteredIds = useMemo(() => {
    if (genFilter === "all") return new Set(people.map((p) => p.id))
    const gen = +genFilter
    return new Set(people.filter((p) => p.generation === gen).map((p) => p.id))
  }, [genFilter, people])

  const lineage = useMemo(() => {
    if (!hoverId) return null
    return computeLineage(hoverId, people)
  }, [hoverId, people])

  const connections = useMemo(
    () => buildConnections(people, positions, connStyle, layout, cardW, cardH),
    [people, positions, connStyle, layout, cardW, cardH]
  )

  const onCardDrag = useCallback(
    (id: string, np: { x: number; y: number }) => {
      setPositions((prev) => ({ ...prev, [id]: np }))
    },
    [setPositions]
  )

  const onPointerDownBg = (e: React.PointerEvent) => {
    const el = e.target as HTMLElement
    const isBackground =
      el === wrapRef.current ||
      el === innerRef.current ||
      el.classList.contains("tree-connections") ||
      el.tagName === "svg" ||
      el.tagName === "path"
    if (!isBackground) return

    const startX = e.clientX
    const startY = e.clientY
    const startPan = { ...pan }
    setPanning(true)

    const onMove = (ev: PointerEvent) => {
      setPan({ x: startPan.x + (ev.clientX - startX), y: startPan.y + (ev.clientY - startY) })
    }
    const onUp = () => {
      setPanning(false)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect) return
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const factor = e.deltaY > 0 ? 0.92 : 1.08
      const newScale = Math.max(0.2, Math.min(2.5, scale * factor))
      const wx = (mx - pan.x) / scale
      const wy = (my - pan.y) / scale
      setScale(newScale)
      setPan({ x: mx - wx * newScale, y: my - wy * newScale })
    },
    [scale, pan]
  )

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    wrap.addEventListener("wheel", onWheel, { passive: false })
    return () => wrap.removeEventListener("wheel", onWheel)
  }, [onWheel])

  const jumpTo = useCallback(
    (wx: number, wy: number) => {
      const r = wrapRef.current?.getBoundingClientRect()
      if (!r) return
      setPan({ x: r.width / 2 - wx * scale, y: r.height / 2 - wy * scale })
    },
    [scale]
  )

  const fitToView = useCallback(() => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r || people.length === 0) return

    const personIds = new Set(people.map((p) => p.id))
    const bounds = computeContentBounds(positions, personIds, cardW, cardH)
    if (!bounds || bounds.width === 0 || bounds.height === 0) return

    const availW = r.width - VIEW_PADDING * 2
    const availH = r.height - TOOLBAR_H - VIEW_PADDING * 2
    const newScale = Math.max(
      0.2,
      Math.min(2.5, Math.min(availW / bounds.width, availH / bounds.height))
    )

    const visibleCenterX = r.width / 2
    const visibleCenterY = TOOLBAR_H + (r.height - TOOLBAR_H) / 2

    setScale(newScale)
    setPan({
      x: visibleCenterX - bounds.centerX * newScale,
      y: visibleCenterY - bounds.centerY * newScale,
    })
  }, [people, positions, cardW, cardH])

  useEffect(() => {
    if (fitRequestId === 0) return
    lastFitKeyRef.current = null
    const frame = requestAnimationFrame(() => fitToView())
    return () => cancelAnimationFrame(frame)
  }, [fitRequestId, fitToView])

  useEffect(() => {
    if (people.length === 0 || Object.keys(positions).length === 0) return

    const fitKey = `${layout}-${people.map((p) => p.id).sort().join(",")}-${Object.keys(positions).length}`
    if (lastFitKeyRef.current === fitKey) return
    lastFitKeyRef.current = fitKey

    const frame = requestAnimationFrame(() => fitToView())
    return () => cancelAnimationFrame(frame)
  }, [people, positions, layout, fitToView])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || people.length === 0) return

    const observer = new ResizeObserver(() => {
      if (lastFitKeyRef.current) fitToView()
    })
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [people.length, fitToView])

  useEffect(() => {
    window.__focusOn = (id) => {
      const pos = positions[id]
      if (pos) jumpTo(pos.x + cardW / 2, pos.y + cardH / 2)
    }
    return () => { window.__focusOn = undefined }
  }, [positions, jumpTo, cardW, cardH])

  const maxGens = useMemo(() => {
    if (!people.length) return 1
    return Math.max(...people.map((p) => p.generation))
  }, [people])

  const generationOptions = useMemo(
    () => [
      { value: "all", label: "Toutes les générations" },
      ...Array.from({ length: maxGens }, (_, i) => ({
        value: String(i + 1),
        label: `Génération ${i + 1} (G${i + 1})`,
      })),
    ],
    [maxGens]
  )

  return (
    <div
      ref={wrapRef}
      className={cn("relative size-full overflow-hidden bg-muted/20", panning && "cursor-grabbing")}
      onPointerDown={onPointerDownBg}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b bg-background/95 p-2 backdrop-blur">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={genFilter} onValueChange={(v) => v && onSetTweak("generation", v)}>
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue placeholder="Génération" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {generationOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {(["vertical", "horizontal", "radial"] as const).map((l) => (
            <Button
              key={l}
              size="sm"
              variant={layout === l ? "default" : "outline"}
              onClick={() => onSetTweak("layout", l)}
            >
              {l === "vertical" ? "↓" : l === "horizontal" ? "→" : "◎"}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          onClick={onReorganize}
          disabled={!onReorganize || people.length === 0 || (readOnly && !isDemo)}
          title="Recalculer les positions et centrer l'arbre"
        >
          <LayoutGrid className="mr-1 size-4" />
          Réorganiser
        </Button>
        <Button size="sm" variant="outline" onClick={fitToView} title="Centrer l'arbre dans la vue">
          <Maximize2 className="mr-1 size-4" />
          Centrer
        </Button>
        <Button size="sm" variant="ghost" onClick={onOpenTweaks}>
          <Settings className="size-4" />
        </Button>
        {!readOnly && canShare && (
          <>
            <Button size="sm" variant="outline" onClick={onOpenShare}>
              <Share2 className="mr-1 size-4" />
              Partager
            </Button>
            <Button size="sm" onClick={() => onOpenAdd()}>
              <Plus className="mr-1 size-4" />
              Ajouter
            </Button>
          </>
        )}
        {!readOnly && !canShare && (
          <Button size="sm" onClick={() => onOpenAdd()}>
            <Plus className="mr-1 size-4" />
            Ajouter
          </Button>
        )}
      </div>

      <div
        ref={innerRef}
        className="absolute left-0 right-0 bottom-0 top-12"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}
      >
        <svg
          className="tree-connections pointer-events-none absolute left-0 top-0 z-[1]"
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          width={canvasW}
          height={canvasH}
        >
          {connections.map((c, i) => {
            const dim = lineage && !c.ids.every((id: string) => lineage.has(id))
            const hi = lineage && c.ids.every((id: string) => lineage.has(id))
            return (
              <g key={i}>
                <path
                  d={c.path}
                  fill="none"
                  stroke="var(--background)"
                  strokeWidth={hi ? 5 : 4.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={c.kind === "spouse" ? "6 4" : undefined}
                  opacity={dim ? 0.25 : 1}
                />
                <path
                  d={c.path}
                  fill="none"
                  stroke={c.kind === "spouse" ? "var(--muted-foreground)" : "var(--primary)"}
                  strokeWidth={hi ? 3 : 2.5}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  strokeDasharray={c.kind === "spouse" ? "6 4" : undefined}
                  opacity={dim ? 0.2 : hi ? 1 : 0.95}
                />
              </g>
            )
          })}
        </svg>

        {people.map((p) => {
          const pos = positions[p.id]
          if (!pos) return null
          if (searchQuery) {
            const q = searchQuery.toLowerCase()
            if (!`${p.given} ${p.sur}`.toLowerCase().includes(q)) return null
          }
          const isFiltered = !filteredIds.has(p.id)
          const dim = (lineage && !lineage.has(p.id)) || isFiltered
          const hi = lineage?.has(p.id)

          return (
            <PersonCard
              key={p.id}
              person={p}
              pos={pos}
              scale={scale}
              cardStyle={tweaks.cardStyle}
              hidePhotos={tweaks.hidePhotos}
              hideDates={tweaks.hideDates}
              hidePlaces={tweaks.hidePlaces}
              selected={selectedId === p.id}
              dim={!!dim}
              highlight={!!hi}
              onSelect={onSelect}
              onDrag={canDrag ? onCardDrag : undefined}
              onHover={onHover}
            />
          )
        })}

        {!readOnly &&
          connections
            .filter((c) => c.kind === "spouse" && c.midX != null && c.midY != null)
            .map((c, i) => (
              <button
                key={`spouse-add-${i}`}
                type="button"
                title="Ajouter un enfant"
                className="absolute z-[10] flex size-[22px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-primary bg-primary text-sm font-bold text-primary-foreground shadow-md pointer-events-auto hover:scale-110"
                style={{ left: c.midX, top: c.midY }}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenAdd(c.ids[0], "child", c.ids[1])
                }}
              >
                +
              </button>
            ))}
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-lg border bg-background p-1 shadow">
        <Button size="sm" variant="ghost" onClick={() => setScale((s) => Math.min(2.5, s * 1.15))}>+</Button>
        <span className="px-2 text-center text-xs">{Math.round(scale * 100)}%</span>
        <Button size="sm" variant="ghost" onClick={() => setScale((s) => Math.max(0.2, s / 1.15))}>−</Button>
        <Button size="sm" variant="ghost" onClick={fitToView} title="Centrer l'arbre">
          <Maximize2 className="size-4" />
        </Button>
      </div>

      {people.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-12">
          <div className="text-center text-muted-foreground">
            <p className="text-4xl">🌳</p>
            <p className="mt-2 font-medium">Arbre vide</p>
            <p className="text-sm">{readOnly ? "Explorez les fiches en cliquant sur une personne" : "Cliquez sur Ajouter pour commencer"}</p>
          </div>
        </div>
      )}
    </div>
  )
}
