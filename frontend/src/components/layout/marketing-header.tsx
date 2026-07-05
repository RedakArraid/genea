import { Link, useLocation, useNavigate } from "react-router-dom"
import { LogOut, TreePine } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { Button, buttonVariants } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"

interface MarketingHeaderProps {
  /** Sur /demo : barre compacte sans distraire du canvas */
  variant?: "default" | "minimal"
}

export function MarketingHeader({ variant = "default" }: MarketingHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout } = useAuthStore()
  const isHome = location.pathname === "/"

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const featuresLink = isHome ? (
    <a href="#fonctionnalites" className="text-muted-foreground transition-colors hover:text-foreground">
      {t("nav.features")}
    </a>
  ) : (
    <Link to="/#fonctionnalites" className="text-muted-foreground transition-colors hover:text-foreground">
      {t("nav.features")}
    </Link>
  )

  const pricingLink = isHome ? (
    <a href="#prix" className="text-muted-foreground transition-colors hover:text-foreground">
      {t("nav.pricing")}
    </a>
  ) : (
    <Link to="/#prix" className="text-muted-foreground transition-colors hover:text-foreground">
      {t("nav.pricing")}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <TreePine className="size-5" />
          GeneaIA
        </Link>

        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {featuresLink}
          <Link to="/demo" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("nav.demo")}
          </Link>
          {pricingLink}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                {t("nav.myTrees")}
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 size-4" />
                {t("actions.logout")}
              </Button>
            </>
          ) : (
            <>
              {variant !== "minimal" && (
                <Link to="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  {t("actions.login")}
                </Link>
              )}
              <Link to="/register" className={cn(buttonVariants({ size: "sm" }))}>
                {t("actions.getStarted")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
