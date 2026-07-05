import i18n from "@/i18n"

export function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function validateBirthDate(date: string): string | null {
  if (!date) return null
  if (date > todayIsoDate()) {
    return i18n.t("errors:BIRTH_DATE_FUTURE")
  }
  return null
}
