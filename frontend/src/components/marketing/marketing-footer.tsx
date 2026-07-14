import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { TreePine } from "lucide-react"

export function MarketingFooter() {
  const { t } = useTranslation(["marketing", "common"])

  return (
    <footer className="border-t py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <TreePine className="size-5" />
          geneamap
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link to="/demo" className="hover:text-foreground">
            {t("footer.links.demo")}
          </Link>
          <Link to="/organisation" className="hover:text-foreground">
            {t("footer.links.organisation")}
          </Link>
          <Link to="/pricing" className="hover:text-foreground">
            {t("footer.links.pricing")}
          </Link>
          <Link to="/login" className="hover:text-foreground">
            {t("footer.links.login")}
          </Link>
          <Link to="/register" className="hover:text-foreground">
            {t("footer.links.register")}
          </Link>
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          {t("common:footer")}
        </p>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground md:justify-end">
          <Link to="/legal/mentions-legales" className="hover:text-foreground hover:underline">
            {t("footer.links.legalNotice")}
          </Link>
          <Link to="/legal/cgu" className="hover:text-foreground hover:underline">
            {t("footer.links.terms")}
          </Link>
          <Link to="/legal/cgv" className="hover:text-foreground hover:underline">
            {t("footer.links.sales")}
          </Link>
          <Link to="/legal/confidentialite" className="hover:text-foreground hover:underline">
            {t("footer.links.privacy")}
          </Link>
          <Link to="/legal/cookies" className="hover:text-foreground hover:underline">
            {t("footer.links.cookies")}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
