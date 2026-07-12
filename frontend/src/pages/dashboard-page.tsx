import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Trash2, Users, GitBranch, Share2, CreditCard, Link2, Building2, TreePine } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { formatRelativeDate } from "@/lib/format"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { WelcomePanel } from "@/components/dashboard/welcome-panel"
import type { TreeType } from "@/types"

export default function DashboardPage() {
  const { t } = useTranslation("dashboard")
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const planActive = user?.planActive ?? false
  const { trees, sharedTrees, isLoading, fetchTrees, createTree, deleteTree } = useFamilyTreeStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ name: string; description: string; isPublic: boolean; treeType: TreeType }>({
    name: "",
    description: "",
    isPublic: false,
    treeType: "GENEALOGY",
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTrees()
  }, [fetchTrees])

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error(t("nameRequired"))
      return
    }
    setCreating(true)
    const result = await createTree(form)
    setCreating(false)
    if (result.success && result.tree) {
      toast.success(t("treeCreated"))
      setOpen(false)
      setForm({ name: "", description: "", isPublic: false, treeType: "GENEALOGY" })
      navigate(`/family-tree/${result.tree.id}`)
    } else {
      toast.error(result.message)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("deleteConfirm", { name }))) return
    const result = await deleteTree(id)
    if (result.success) toast.success(t("treeDeleted"))
    else toast.error(result.message)
  }

  const handleCopyPublicLink = async (treeId: string) => {
    const url = `${window.location.origin}/tree/${treeId}`
    await navigator.clipboard.writeText(url)
    toast.success(t("publicLinkCopied"))
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      {!planActive && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5" />
              {t("activatePlan.title")}
            </CardTitle>
            <CardDescription>
              {t("activatePlan.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/pricing" className={buttonVariants()}>{t("activatePlan.seePricing")}</Link>
          </CardContent>
        </Card>
      )}

      <WelcomePanel
        userName={user?.name}
        trees={trees}
        sharedTrees={sharedTrees}
        planActive={planActive}
        onCreateTree={() => setOpen(true)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!planActive} className="w-full sm:w-auto">
          <Plus className="mr-2 size-4" />
          {t("newTree")}
        </Button>
      </div>

      {trees.length + sharedTrees.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("stats.trees")}</CardDescription>
              <CardTitle className="text-3xl">{trees.length + sharedTrees.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("stats.totalPersons")}</CardDescription>
              <CardTitle className="text-3xl">
                {[...trees, ...sharedTrees].reduce((acc, tree) => acc + (tree._count?.Person || 0), 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t("stats.publicTrees")}</CardDescription>
              <CardTitle className="text-3xl">{trees.filter((tree) => tree.isPublic).length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {sharedTrees.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Share2 className="size-5" />
            {t("sharedWithMe")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {sharedTrees.map((tree) => (
              <Card key={tree.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      <Link to={`/family-tree/${tree.id}`} className="hover:underline">
                        {tree.name}
                      </Link>
                    </CardTitle>
                    <Badge variant="secondary">
                      {tree.TreeCollaborator?.[0]?.role === "EDITOR" ? t("role.editor") : t("role.viewer")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    {t("personCount", { count: tree._count?.Person || 0 })}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">{t("myTrees")}</h2>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : trees.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <GitBranch className="size-12 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("empty.title")}</p>
              <p className="text-sm text-muted-foreground">{t("empty.subtitle")}</p>
            </div>
            <Button onClick={() => setOpen(true)} disabled={!planActive}>
              <Plus className="mr-2 size-4" />
              {t("createTree")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trees.map((tree) => (
            <Card key={tree.id} className="group transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      <Link to={`/family-tree/${tree.id}`} className="hover:underline">
                        {tree.name}
                      </Link>
                    </CardTitle>
                    {tree.description && (
                      <CardDescription className="mt-1">{tree.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={tree.visibility === "PUBLIC" || tree.isPublic ? "default" : tree.visibility === "SHARED" ? "outline" : "secondary"}>
                      {tree.visibility === "PUBLIC" || tree.isPublic ? t("visibility.public") : tree.visibility === "SHARED" ? t("visibility.shared") : t("visibility.private")}
                    </Badge>
                    {tree.treeType === "ORGANIZATION" && (
                      <Badge variant="outline">{t("treeTypeBadge.organization")}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-4" />
                      {t("personCount", { count: tree._count?.Person || 0 })}
                    </span>
                    {tree.updatedAt && (
                      <span>
                        {formatRelativeDate(tree.updatedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {(tree.visibility === "PUBLIC" || tree.isPublic) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("copyPublicLink")}
                        onClick={() => handleCopyPublicLink(tree.id)}
                      >
                        <Link2 className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-9 min-w-9 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                      onClick={() => handleDelete(tree.id, tree.name)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createDialog.title")}</DialogTitle>
            <DialogDescription>{t("createDialog.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("createDialog.typeLabel")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                    form.treeType === "GENEALOGY" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setForm({ ...form, treeType: "GENEALOGY" })}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <TreePine className="size-4" />
                    {t("createDialog.typeGenealogy")}
                  </span>
                  <span className="text-xs text-muted-foreground">{t("createDialog.typeGenealogyHint")}</span>
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                    form.treeType === "ORGANIZATION" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setForm({ ...form, treeType: "ORGANIZATION" })}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Building2 className="size-4" />
                    {t("createDialog.typeOrganization")}
                  </span>
                  <span className="text-xs text-muted-foreground">{t("createDialog.typeOrganizationHint")}</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tree-name">{t("createDialog.nameLabel")}</Label>
              <Input
                id="tree-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={form.treeType === "ORGANIZATION" ? "Acme Corp" : t("createDialog.namePlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tree-desc">{t("createDialog.descLabel")}</Label>
              <Textarea
                id="tree-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("createDialog.descPlaceholder")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tree-public">{t("createDialog.publicLabel")}</Label>
              <Switch
                id="tree-public"
                checked={form.isPublic}
                onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common:actions.cancel")}</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? t("createDialog.creating") : t("createDialog.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
