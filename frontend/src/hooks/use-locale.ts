import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/i18n"
import api from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"

export function normalizeLocale(lng?: string | null): Locale {
  const short = (lng || "").split("-")[0] as Locale
  return SUPPORTED_LOCALES.includes(short) ? short : DEFAULT_LOCALE
}

/**
 * Locale courante + changement de langue (i18next, <html lang>,
 * et persistance sur le profil si l'utilisateur est connecté).
 */
export function useLocale() {
  const { i18n } = useTranslation()
  const { isAuthenticated, user } = useAuthStore()
  const locale = normalizeLocale(i18n.language)

  const setLocale = useCallback(
    async (next: Locale) => {
      if (next === normalizeLocale(i18n.language)) return
      await i18n.changeLanguage(next)
      if (isAuthenticated && user) {
        api.put("/users/profile", { locale: next }).catch(() => {
          // Non bloquant : la langue reste appliquée localement
        })
      }
    },
    [i18n, isAuthenticated, user]
  )

  return { locale, setLocale, supportedLocales: SUPPORTED_LOCALES }
}
