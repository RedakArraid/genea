import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Plus, Trash2, Users, GitBranch, Share2 } from "lucide-react"
import { toast } from "sonner"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { Button } from "@/components/ui/button"
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

export default function DashboardPage() {
  const navigate = useNavigate()
  const { trees, sharedTrees, isLoading, fetchTrees, createTree, deleteTree } = useFamilyTreeStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", isPublic: false })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTrees()
  }, [fetchTrees])

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom est requis")
      return
    }
    setCreating(true)
    const result = await createTree(form)
    setCreating(false)
    if (result.success && result.tree) {
      toast.success("Arbre créé")
      setOpen(false)
      setForm({ name: "", description: "", isPublic: false })
      navigate(`/family-tree/${result.tree.id}`)
    } else {
      toast.error(result.message)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'arbre "${name}" ?`)) return
    const result = await deleteTree(id)
    if (result.success) toast.success("Arbre supprimé")
    else toast.error(result.message)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes arbres généalogiques</h1>
          <p className="text-muted-foreground">Créez et gérez vos lignées familiales</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 size-4" />
          Nouvel arbre
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Arbres</CardDescription>
            <CardTitle className="text-3xl">{trees.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Personnes totales</CardDescription>
            <CardTitle className="text-3xl">
              {trees.reduce((acc, t) => acc + (t._count?.Person || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Arbres publics</CardDescription>
            <CardTitle className="text-3xl">{trees.filter((t) => t.isPublic).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {sharedTrees.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Share2 className="size-5" />
            Arbres partagés avec moi
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
                      {tree.TreeCollaborator?.[0]?.role === "EDITOR" ? "Éditeur" : "Lecteur"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    {tree._count?.Person || 0} personnes
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Mes arbres</h2>
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
              <p className="font-medium">Aucun arbre pour le moment</p>
              <p className="text-sm text-muted-foreground">Créez votre premier arbre pour commencer</p>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" />
              Créer un arbre
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
                  <Badge variant={tree.visibility === "PUBLIC" || tree.isPublic ? "default" : tree.visibility === "SHARED" ? "outline" : "secondary"}>
                    {tree.visibility === "PUBLIC" || tree.isPublic ? "Public" : tree.visibility === "SHARED" ? "Partagé" : "Privé"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-4" />
                      {tree._count?.Person || 0} personnes
                    </span>
                    {tree.updatedAt && (
                      <span>
                        {formatDistanceToNow(new Date(tree.updatedAt), { addSuffix: true, locale: fr })}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(tree.id, tree.name)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
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
            <DialogTitle>Nouvel arbre généalogique</DialogTitle>
            <DialogDescription>Donnez un nom à votre nouvelle lignée familiale</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tree-name">Nom *</Label>
              <Input
                id="tree-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Famille Dupont"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tree-desc">Description</Label>
              <Textarea
                id="tree-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Lignée paternelle..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tree-public">Arbre public</Label>
              <Switch
                id="tree-public"
                checked={form.isPublic}
                onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
