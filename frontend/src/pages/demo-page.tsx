import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import api from "@/lib/api"
import FamilyTreePage from "@/pages/family-tree-page"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function DemoPage() {
  const { t } = useTranslation("marketing")
  const [demoTreeId, setDemoTreeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get("/family-trees/demo")
      .then(({ data }) => {
        if (data.demoTree?.id) setDemoTreeId(data.demoTree.id)
        else setError("unavailable")
      })
      .catch((err) => {
        const status = (err as { response?: { status?: number } }).response?.status
        setError(status === 404 ? "unavailable" : "loadError")
      })
  }, [])

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">{t(`demo.${error}`)}</p>
        <Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>{t("demo.backHome")}</Link>
      </div>
    )
  }

  if (!demoTreeId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="size-12 rounded-full" />
      </div>
    )
  }

  return <FamilyTreePage treeIdOverride={demoTreeId} publicDemo />
}
