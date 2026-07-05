import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/i18n"
import api from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"

export function normalizeLocale(lng?: string | null): Locale {
  const short = (lng || "").split("-")[0] as Locale
  return SUPPORTED_LOCALES.includes(short) ? short : DEFAULT_LOCALE
}

const STORAGE_KEY = "geneaia_locale"

/**
 * Locale courante + changement de langue (i18next, <html lang>,
 * localStorage et persistance sur le profil si connecté).
 */
export function useLocale() {
  const { i18n } = useTranslation()
  const { isAuthenticated, user } = useAuthStore()
  const [locale, setLocaleState] = useState<Locale>(() => normalizeLocale(i18n.language))

  useEffect(() => {
    const sync = (lng: string) => setLocaleState(normalizeLocale(lng))
    i18n.on("languageChanged", sync)
    return () => {
      i18n.off("languageChanged", sync)
    }
  }, [i18n])

  const setLocale = useCallback(
    async (next: Locale) => {
      if (next === normalizeLocale(i18n.language)) return
      localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
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
