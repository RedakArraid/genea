import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js"

export const DEFAULT_COUNTRY: CountryCode = "CI"

export const PHONE_COUNTRIES: { code: CountryCode; dial: string; label: string }[] = [
  { code: "CI", dial: "+225", label: "Côte d'Ivoire" },
  { code: "SN", dial: "+221", label: "Sénégal" },
  { code: "ML", dial: "+223", label: "Mali" },
  { code: "BF", dial: "+226", label: "Burkina Faso" },
  { code: "GN", dial: "+224", label: "Guinée" },
  { code: "FR", dial: "+33", label: "France" },
  { code: "US", dial: "+1", label: "États-Unis" },
  { code: "GB", dial: "+44", label: "Royaume-Uni" },
]

export function normalizePhoneInput(raw: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = parsePhoneNumberFromString(trimmed, country)
  if (!parsed?.isValid()) return null
  return parsed.format("E.164")
}

export function formatPhoneDisplay(phone: string | null | undefined, country: CountryCode = DEFAULT_COUNTRY): string {
  if (!phone) return ""
  const parsed = parsePhoneNumberFromString(phone, country)
  if (!parsed) return phone
  if (parsed.country === "CI") return `0${parsed.nationalNumber}`
  return parsed.formatNational()
}

/** Compose indicatif + numéro local (ex. 07… → +22507…) */
export function composePhone(localNumber: string, country: CountryCode = DEFAULT_COUNTRY): string {
  const entry = PHONE_COUNTRIES.find((c) => c.code === country)
  const dial = entry?.dial || "+225"
  const local = localNumber.trim().replace(/^0+/, "")
  if (local.startsWith("+")) return local
  return `${dial}${local.startsWith("0") ? local.slice(1) : local}`
}
