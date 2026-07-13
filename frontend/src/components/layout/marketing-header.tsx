import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { LogOut, Menu, TreePine } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { Button, buttonVariants } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/")
    setMobileOpen(false)
  }

  const closeMobile = () => setMobileOpen(false)

  const featuresHref = isHome ? "#fonctionnalites" : "/#fonctionnalites"
  const pricingHref = isHome ? "#prix" : "/#prix"

  const navLinkClass = "text-base font-medium text-foreground transition-colors hover:text-primary"

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <TreePine className="size-5" />
          geneamap
        </Link>

        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {isHome ? (
            <a href="#fonctionnalites" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.features")}
            </a>
          ) : (
            <Link to="/#fonctionnalites" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.features")}
            </Link>
          )}
          <Link to="/demo" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("nav.demo")}
          </Link>
          {isHome ? (
            <a href="#prix" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.pricing")}
            </a>
          ) : (
            <Link to="/#prix" className="text-muted-foreground transition-colors hover:text-foreground">
              {t("nav.pricing")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
                {t("nav.myTrees")}
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
                <LogOut className="mr-1.5 size-4" />
                {t("actions.logout")}
              </Button>
            </>
          ) : (
            <>
              {variant !== "minimal" && (
                <Link to="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
                  {t("actions.login")}
                </Link>
              )}
              <Link to="/register" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
                {t("actions.getStarted")}
              </Link>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t("nav.menu", { defaultValue: "Menu" })}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="bottom" className="gap-0 overflow-y-auto px-6 pb-8 pt-4">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>geneamap</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 pt-4">
            {isHome ? (
              <a href={featuresHref} className={navLinkClass} onClick={closeMobile}>
                {t("nav.features")}
              </a>
            ) : (
              <Link to={featuresHref} className={navLinkClass} onClick={closeMobile}>
                {t("nav.features")}
              </Link>
            )}
            <Link to="/demo" className={navLinkClass} onClick={closeMobile}>
              {t("nav.demo")}
            </Link>
            {isHome ? (
              <a href={pricingHref} className={navLinkClass} onClick={closeMobile}>
                {t("nav.pricing")}
              </a>
            ) : (
              <Link to={pricingHref} className={navLinkClass} onClick={closeMobile}>
                {t("nav.pricing")}
              </Link>
            )}
            <div className="border-t pt-4">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center gap-2 border-t pt-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">{t("theme.label")}</span>
            </div>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className={navLinkClass} onClick={closeMobile}>
                  {t("nav.myTrees")}
                </Link>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 size-4" />
                  {t("actions.logout")}
                </Button>
              </>
            ) : (
              <>
                {variant !== "minimal" && (
                  <Link to="/login" className={navLinkClass} onClick={closeMobile}>
                    {t("actions.login")}
                  </Link>
                )}
                <Link to="/register" className={buttonVariants()} onClick={closeMobile}>
                  {t("actions.getStarted")}
                </Link>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
