import i18n from "@/i18n"

type ApiErrorPayload = {
  code?: string
  message?: string
  params?: Record<string, string | number>
}

/**
 * Traduit une erreur API (code + params) ou retombe sur message / clé générique.
 */
export function translateApiError(
  data: ApiErrorPayload | undefined,
  fallbackKey = "errors:GENERIC"
): string {
  if (!data) return i18n.t(fallbackKey)
  if (data.code) {
    const key = `errors:${data.code}`
    if (i18n.exists(key)) {
      return i18n.t(key, data.params as Record<string, string>)
    }
  }
  if (data.message) return data.message
  return i18n.t(fallbackKey)
}

/** Extrait le payload d'erreur axios */
export function getApiErrorPayload(error: unknown): ApiErrorPayload | undefined {
  return (error as { response?: { data?: ApiErrorPayload } })?.response?.data
}
