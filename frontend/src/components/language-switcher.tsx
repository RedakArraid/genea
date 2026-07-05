import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocale } from "@/hooks/use-locale"
import type { Locale } from "@/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

/** Menu compact (header marketing) */
export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { locale, setLocale, supportedLocales } = useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" aria-label={t("language.label")}>
            <Languages className="size-4" />
            <span className="ml-1 uppercase">{locale}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {supportedLocales.map((l) => (
          <DropdownMenuItem key={l} onClick={() => setLocale(l)} data-active={l === locale}>
            {LOCALE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Select pleine largeur (page profil) */
export function LanguageSelect() {
  const { locale, setLocale, supportedLocales } = useLocale()

  return (
    <Select value={locale} onValueChange={(v) => v && setLocale(v as Locale)}>
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
