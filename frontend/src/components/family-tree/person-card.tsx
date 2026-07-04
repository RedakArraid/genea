import { cn } from "@/lib/utils"
import { resolveMediaUrl } from "@/lib/upload"
import { getCardDimensions } from "@/utils/tree-layout"
import type { NormalizedPerson, PersonTone } from "@/types"
import { useState, useEffect } from "react"

const TONE_STYLES: Record<PersonTone, { bg: string; fg: string; ring: string }> = {
  stone: { bg: "bg-stone-100", fg: "text-stone-700", ring: "ring-stone-300" },
  rose: { bg: "bg-rose-100", fg: "text-rose-700", ring: "ring-rose-300" },
  ocean: { bg: "bg-sky-100", fg: "text-sky-700", ring: "ring-sky-300" },
  sage: { bg: "bg-emerald-100", fg: "text-emerald-700", ring: "ring-emerald-300" },
  amber: { bg: "bg-amber-100", fg: "text-amber-700", ring: "ring-amber-300" },
  plum: { bg: "bg-violet-100", fg: "text-violet-700", ring: "ring-violet-300" },
}

function getInitials(given: string, sur: string) {
  const g = (given || "?")[0]?.toUpperCase() || "?"
  const s = sur && sur !== "—" ? sur[0]?.toUpperCase() : ""
  return g + s
}

function getLifespan(born: number | null, died: number | null) {
  if (!born) return "?"
  return died ? `${born}–${died}` : `${born}–`
}

interface PersonCardProps {
  person: NormalizedPerson
  pos: { x: number; y: number }
  scale: number
  cardStyle?: string
  hidePhotos?: boolean
  hideDates?: boolean
  hidePlaces?: boolean
  selected?: boolean
  dim?: boolean
  highlight?: boolean
  onSelect?: (id: string) => void
  onDrag?: (id: string, pos: { x: number; y: number }) => void
  onHover?: (id: string | null) => void
}

export function PersonCard({
  person,
  pos,
  scale,
  cardStyle = "square",
  hidePhotos = false,
  hideDates = false,
  hidePlaces = false,
  selected = false,
  dim = false,
  highlight = false,
  onSelect,
  onDrag,
  onHover,
}: PersonCardProps) {
  const tone = TONE_STYLES[person.tone] || TONE_STYLES.stone
  const { w: cardW, h: cardH } = getCardDimensions(cardStyle)
  const initials = getInitials(person.given, person.sur)
  const lifespan = getLifespan(person.born, person.died)
  const [photoFailed, setPhotoFailed] = useState(false)
  const photoSrc = resolveMediaUrl(person.photoUrl)
  const showPhoto = !hidePhotos && photoSrc && !photoFailed

  useEffect(() => {
    setPhotoFailed(false)
  }, [person.photoUrl])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    if (!onDrag) {
      onSelect?.(person.id)
      return
    }
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startY = e.clientY
    const startPos = { ...pos }
    let moved = false

    const onMove = (ev: Event) => {
      const pev = ev as PointerEvent
      const dx = (pev.clientX - startX) / scale
      const dy = (pev.clientY - startY) / scale
      if (!moved && Math.hypot(pev.clientX - startX, pev.clientY - startY) > 4) moved = true
      if (moved) onDrag(person.id, { x: startPos.x + dx, y: startPos.y + dy })
    }

    const onUp = (ev: Event) => {
      const pev = ev as PointerEvent
      el.releasePointerCapture(pev.pointerId)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerup", onUp)
      if (!moved && onSelect) onSelect(person.id)
    }

    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerup", onUp)
  }

  return (
    <div
      className={cn(
        "tree-person-card absolute z-[2] flex flex-col cursor-grab select-none rounded-lg border bg-card shadow-sm transition-opacity active:cursor-grabbing",
        cardStyle !== "round" && cardStyle !== "minimal" && "w-[120px]",
        selected && "ring-2 ring-primary",
        highlight && "ring-2 ring-primary/50",
        dim && "opacity-30",
        cardStyle === "round" && "w-[90px] items-center rounded-full p-2"
      )}
      style={{ left: pos.x, top: pos.y, width: cardW, height: cardH }}
      onPointerDown={onPointerDown}
      onMouseEnter={() => onHover?.(person.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {cardStyle !== "minimal" && (
        <div className={cn("relative h-20 overflow-hidden rounded-t-lg", tone.bg, cardStyle === "round" && "size-14 rounded-full")}>
          <span className="absolute left-1 top-1 rounded bg-background/80 px-1 text-[10px] font-medium">
            G{person.generation}
          </span>
          {showPhoto ? (
            <img
              src={photoSrc}
              alt={person.given}
              className="size-full object-cover"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <div className={cn("flex size-full items-center justify-center text-lg font-semibold", tone.fg)}>
              {initials}
            </div>
          )}
        </div>
      )}
      <div className="mt-auto p-2">
        <p className="truncate text-xs font-semibold">
          {person.given}{person.sur && person.sur !== "—" ? ` ${person.sur}` : ""}
        </p>
        {!hideDates && <p className="text-[10px] text-muted-foreground">{lifespan}</p>}
        {!hidePlaces && person.place && <p className="truncate text-[10px] text-muted-foreground">{person.place}</p>}
      </div>
    </div>
  )
}
