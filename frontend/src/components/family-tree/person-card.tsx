import { cn } from "@/lib/utils"
import { formatGenerationBadge } from "@/lib/generation-level"
import { AuthenticatedImage } from "@/components/ui/authenticated-image"
import { getCardDimensions } from "@/utils/tree-layout"
import { estimateOrgCardHeight } from "@/lib/org-layout"
import type { NormalizedPerson, PersonTone, OrgLexiconConfig } from "@/types"
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
  const s = sur && sur !== "-" ? sur[0]?.toUpperCase() : ""
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
  isOrg?: boolean
  maxGeneration?: number
  lexicon?: OrgLexiconConfig | null
  hidePhotos?: boolean
  hideDates?: boolean
  hidePlaces?: boolean
  selected?: boolean
  dragging?: boolean
  dim?: boolean
  highlight?: boolean
  onSelect?: (id: string) => void
  onDrag?: (id: string, pos: { x: number; y: number }) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onHover?: (id: string | null) => void
}

export function PersonCard({
  person,
  pos,
  scale,
  cardStyle = "square",
  isOrg = false,
  maxGeneration,
  lexicon,
  hidePhotos = false,
  hideDates = false,
  hidePlaces = false,
  selected = false,
  dragging = false,
  dim = false,
  highlight = false,
  onSelect,
  onDrag,
  onDragStart,
  onDragEnd,
  onHover,
}: PersonCardProps) {
  const tone = TONE_STYLES[person.tone] || TONE_STYLES.stone
  const { w: cardW, h: cardH } = getCardDimensions(cardStyle, { organization: isOrg })
  const orgCardH = isOrg ? estimateOrgCardHeight(person) : cardH
  const initials = getInitials(person.given, person.sur)
  const lifespan = getLifespan(person.born, person.died)
  const role = person.occupation?.trim() || ""
  const fullName = `${person.given}${person.sur && person.sur !== "-" ? ` ${person.sur}` : ""}`
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = !hidePhotos && person.photoUrl && !photoFailed

  useEffect(() => {
    setPhotoFailed(false)
  }, [person.photoUrl])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return

    // Touch : tap pour sélectionner, le canvas gère le pan continu
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      const pointerId = e.pointerId
      const startX = e.clientX
      const startY = e.clientY
      let moved = false

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8) moved = true
      }

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
      }

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        if (!moved) onSelect?.(person.id)
        cleanup()
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
      return
    }

    e.stopPropagation()
    e.preventDefault()
    if (!onDrag) {
      onSelect?.(person.id)
      return
    }

    const startX = e.clientX
    const startY = e.clientY
    const startPos = { x: pos.x, y: pos.y }
    let moved = false
    let dragging = false

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) {
        moved = true
        if (!dragging) {
          dragging = true
          onDragStart?.()
        }
      }
      if (moved) {
        onDrag(person.id, { x: startPos.x + dx, y: startPos.y + dy })
      }
    }

    const endDrag = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      if (dragging) onDragEnd?.()
    }

    const onUp = () => {
      if (!moved && onSelect) onSelect(person.id)
      endDrag()
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  const onDragStartPrevent = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      className={cn(
        "tree-person-card absolute z-[2] flex flex-col overflow-visible cursor-grab select-none rounded-lg border bg-card shadow-sm transition-opacity active:cursor-grabbing",
        dragging && "z-[30]",
        cardStyle !== "round" && cardStyle !== "minimal" && !isOrg && "w-[120px]",
        isOrg && cardStyle !== "round" && cardStyle !== "minimal" && "w-[200px]",
        selected && "ring-2 ring-primary",
        highlight && "ring-2 ring-primary/50",
        dim && "opacity-30",
        cardStyle === "round" && "w-[90px] items-center rounded-full p-2"
      )}
      style={{
        left: pos.x,
        top: pos.y,
        width: cardW,
        // Org cards: height matches layout estimate so branches attach below the card.
        ...(isOrg
          ? { minHeight: orgCardH, height: orgCardH, overflow: "visible" }
          : { height: cardH }),
      }}
      onPointerDown={onPointerDown}
      onDragStart={onDragStartPrevent}
      onMouseEnter={() => onHover?.(person.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {cardStyle !== "minimal" && (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-t-lg",
            tone.bg,
            cardStyle === "round" && "size-14 rounded-full",
            cardStyle !== "round" && (isOrg ? "h-[128px]" : "h-20")
          )}
        >
          {(!isOrg || lexicon?.showLevelOnCard !== false) && (
            <span className="absolute left-1 top-1 rounded bg-background/80 px-1 text-[10px] font-medium">
              {formatGenerationBadge(person.generation, { isOrg, maxGeneration, lexicon })}
            </span>
          )}
          {showPhoto ? (
            <AuthenticatedImage
              src={person.photoUrl}
              alt={person.given}
              draggable={false}
              className="pointer-events-none size-full object-cover"
              onError={() => setPhotoFailed(true)}
              fallback={
                <div className={cn("flex size-full items-center justify-center text-lg font-semibold", tone.fg)}>
                  {initials}
                </div>
              }
            />
          ) : (
            <div className={cn("flex size-full items-center justify-center text-lg font-semibold", tone.fg)}>
              {initials}
            </div>
          )}
        </div>
      )}
      <div className={cn("p-2", isOrg ? "flex flex-col gap-0.5" : "mt-auto")}>
        <p
          className={cn(
            "text-xs font-semibold",
            isOrg ? "break-words whitespace-normal leading-snug" : "truncate"
          )}
          title={fullName}
        >
          {fullName}
        </p>
        {isOrg ? (
          role ? (
            <p
              className="break-words whitespace-normal text-[10px] leading-snug text-muted-foreground"
              title={role}
              style={{ overflow: "visible", textOverflow: "clip", whiteSpace: "normal" }}
            >
              {role}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">-</p>
          )
        ) : (
          <>
            {!hideDates && <p className="text-[10px] text-muted-foreground">{lifespan}</p>}
            {!hidePlaces && person.place && <p className="truncate text-[10px] text-muted-foreground">{person.place}</p>}
          </>
        )}
      </div>
    </div>
  )
}
