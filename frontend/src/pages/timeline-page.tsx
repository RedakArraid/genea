import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { normalizePersons } from "@/utils/tree-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function TimelinePage() {
  const { id: treeId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTree, fetchTreeById, isLoading } = useFamilyTreeStore()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (treeId) fetchTreeById(treeId)
  }, [treeId, fetchTreeById])

  if (isLoading) {
    return <div className="flex justify-center py-20"><Skeleton className="size-12 rounded-full" /></div>
  }

  if (!currentTree) {
    return (
      <div className="text-center py-20">
        <p>Arbre non trouvé</p>
        <Button className="mt-4" onClick={() => navigate("/dashboard")}>Retour</Button>
      </div>
    )
  }

  const normalized = normalizePersons(currentTree.Person || [], currentTree.Relationship)
  const sorted = [...normalized]
    .filter((p) => p.born !== null)
    .sort((a, b) => (+a.born!) - (+b.born!))

  const filtered = sorted.filter((p) => {
    const q = searchQuery.toLowerCase()
    return `${p.given} ${p.sur}`.toLowerCase().includes(q) || String(p.born).includes(q) || (p.place || "").toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Chronologie · {currentTree.name}</p>
          <h1 className="text-2xl font-bold">Timeline familiale</h1>
        </div>
        <Input
          className="max-w-xs"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="relative flex flex-col gap-0">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        {filtered.map((p) => (
          <div key={p.id} className="relative flex gap-6 pb-6 pl-10">
            <div className="absolute left-2.5 top-2 size-3 rounded-full border-2 border-primary bg-background" />
            <Card
              className="flex-1 cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/family-tree/${treeId}?select=${p.id}`)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="text-lg font-bold text-primary">{p.born}</div>
                <div>
                  <p className="font-medium">{p.given} {p.sur !== "—" ? p.sur : ""}</p>
                  <p className="text-sm text-muted-foreground">
                    G{p.generation}
                    {p.died ? ` · ${p.born}–${p.died}` : ""}
                    {p.place ? ` · ${p.place}` : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">Aucune personne avec date de naissance</p>
        )}
      </div>
    </div>
  )
}
