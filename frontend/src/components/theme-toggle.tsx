import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation("common")
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <Button variant="ghost" size="icon" className={cn("size-8", className)} disabled aria-hidden />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-8", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("theme.light") : t("theme.dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
