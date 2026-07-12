import { Link } from "react-router-dom"
import { ArrowRight, GitBranch, Plus, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { FamilyTree } from "@/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface WelcomePanelProps {
  userName?: string | null
  trees: FamilyTree[]
  sharedTrees: FamilyTree[]
  planActive: boolean
  onCreateTree: () => void
}

export function WelcomePanel({
  userName,
  trees,
  sharedTrees,
  planActive,
  onCreateTree,
}: WelcomePanelProps) {
  const { t } = useTranslation("dashboard")
  const primaryTree = trees[0] ?? sharedTrees[0]
  const totalTrees = trees.length + sharedTrees.length
  const firstName = userName?.split(" ")[0] || t("welcome.defaultName")

  if (totalTrees === 0) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="text-xl">{t("welcome.greeting", { name: firstName })}</CardTitle>
          <CardDescription>{t("welcome.emptySubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>{t("welcome.steps.create")}</li>
            <li>{t("welcome.steps.add")}</li>
            <li>{t("welcome.steps.share")}</li>
          </ol>
          <Button className="w-fit" onClick={onCreateTree} disabled={!planActive}>
            <Plus className="mr-2 size-4" />
            {t("createTree")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="size-5 text-primary" />
          {t("welcome.greeting", { name: firstName })}
        </CardTitle>
        <CardDescription>{t("welcome.hasTreesSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {primaryTree && (
          <Link
            to={`/family-tree/${primaryTree.id}`}
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            <GitBranch className="size-4" />
            {t("welcome.openTree", { name: primaryTree.name })}
            <ArrowRight className="size-4" />
          </Link>
        )}
        <Button variant="outline" onClick={onCreateTree} disabled={!planActive}>
          <Plus className="mr-2 size-4" />
          {t("newTree")}
        </Button>
        <Link to="/demo" className={cn(buttonVariants({ variant: "ghost" }), "text-muted-foreground")}>
          {t("welcome.tryDemo")}
        </Link>
      </CardContent>
    </Card>
  )
}
