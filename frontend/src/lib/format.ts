import { formatDistanceToNow } from "date-fns"
import { fr as dfFr, enUS as dfEn } from "date-fns/locale"
import i18n from "@/i18n"

function currentLocale() {
  return (i18n.language || "fr").split("-")[0]
}

function intlTag() {
  return currentLocale() === "en" ? "en-US" : "fr-FR"
}

export function dateFnsLocale() {
  return currentLocale() === "en" ? dfEn : dfFr
}

/** Date courte : 05/07/2026 (fr) / 7/5/2026 (en) */
export function formatShortDate(date: string | Date | null | undefined) {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(intlTag())
}

/** Date longue : 5 juillet 2026 (fr) / July 5, 2026 (en) */
export function formatLongDate(date: string | Date | null | undefined) {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(intlTag(), { day: "numeric", month: "long", year: "numeric" })
}

/** "il y a 3 jours" / "3 days ago" */
export function formatRelativeDate(date: string | Date | null | undefined) {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  return formatDistanceToNow(d, { addSuffix: true, locale: dateFnsLocale() })
}

/** 5 juil. 2026 / Jul 5, 2026 */
export function formatMediumDate(date: string | Date | null | undefined) {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(intlTag(), { day: "numeric", month: "short", year: "numeric" })
}

/** 5 juillet 2026 à 14:30 */
export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString(intlTag(), {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
