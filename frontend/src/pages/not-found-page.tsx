import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { buttonVariants } from "@/components/ui/button"

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold">{t("notFound.title")}</h1>
      <p className="text-muted-foreground">{t("notFound.message")}</p>
      <div className="flex gap-2">
        <Link to="/" className={buttonVariants({ variant: "outline" })}>{t("notFound.backHome")}</Link>
        <Link to="/dashboard" className={buttonVariants()}>{t("notFound.backDashboard")}</Link>
      </div>
    </div>
  )
}
