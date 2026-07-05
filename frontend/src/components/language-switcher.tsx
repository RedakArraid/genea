import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocale } from "@/hooks/use-locale"
import type { Locale } from "@/i18n"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
}

/** Boutons FR / EN compacts (header marketing + app) */
export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { locale, setLocale, supportedLocales } = useLocale()

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border bg-background p-0.5"
      role="group"
      aria-label={t("language.label")}
    >
      {supportedLocales.map((l) => (
        <Button
          key={l}
          type="button"
          variant={locale === l ? "secondary" : "ghost"}
          size="sm"
          className="h-7 min-w-9 px-2 uppercase"
          aria-pressed={locale === l}
          onClick={() => void setLocale(l)}
        >
          {l}
        </Button>
      ))}
      <span className="sr-only">
        <Languages aria-hidden />
      </span>
    </div>
  )
}

/** Select pleine largeur (page profil) */
export function LanguageSelect() {
  const { locale, setLocale, supportedLocales } = useLocale()

  return (
    <Select
      value={locale}
      onValueChange={(v) => {
        if (v) void setLocale(v as Locale)
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue>{LOCALE_LABELS[locale]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedLocales.map((l) => (
          <SelectItem key={l} value={l}>
            {LOCALE_LABELS[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
