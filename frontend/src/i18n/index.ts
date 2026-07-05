import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import frCommon from "@/locales/fr/common.json"
import frAuth from "@/locales/fr/auth.json"
import frMarketing from "@/locales/fr/marketing.json"
import frTree from "@/locales/fr/tree.json"
import frDashboard from "@/locales/fr/dashboard.json"
import frBilling from "@/locales/fr/billing.json"
import frErrors from "@/locales/fr/errors.json"

import enCommon from "@/locales/en/common.json"
import enAuth from "@/locales/en/auth.json"
import enMarketing from "@/locales/en/marketing.json"
import enTree from "@/locales/en/tree.json"
import enDashboard from "@/locales/en/dashboard.json"
import enBilling from "@/locales/en/billing.json"
import enErrors from "@/locales/en/errors.json"

export const SUPPORTED_LOCALES = ["fr", "en"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "fr"

export const resources = {
  fr: {
    common: frCommon,
    auth: frAuth,
    marketing: frMarketing,
    tree: frTree,
    dashboard: frDashboard,
    billing: frBilling,
    errors: frErrors,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    marketing: enMarketing,
    tree: enTree,
    dashboard: enDashboard,
    billing: enBilling,
    errors: enErrors,
  },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS: "common",
    ns: ["common", "auth", "marketing", "tree", "dashboard", "billing", "errors"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "geneaia_locale",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  })

// Garde <html lang="..."> synchronisé pour l'accessibilité et le SEO
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng
})
document.documentElement.lang = i18n.language?.split("-")[0] || DEFAULT_LOCALE

export default i18n
