import { useEffect, useState } from "react"
import { Database, FileText, Image } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import { toast } from "sonner"
import { fetchAdminStorage, type AdminStorageInfo } from "@/lib/admin-api"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function AdminStoragePage() {
  const [info, setInfo] = useState<AdminStorageInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStorage()
      .then(setInfo)
      .catch(() => toast.error("Impossible de charger le stockage"))
      .finally(() => setLoading(false))
  }, [])

  const storage = info?.storage

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stockage</h1>
        <p className="text-muted-foreground">MinIO et fichiers en base</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Statut MinIO"
          value={loading ? "…" : storage?.ready ? "Prêt" : storage?.enabled ? "Indisponible" : "Désactivé"}
          icon={Database}
          loading={loading}
          description={storage?.proxyUrl ? `Proxy : ${storage.proxyUrl}` : undefined}
        />
        <AdminStatCard title="Documents" value={info?.counts.documents ?? 0} icon={FileText} loading={loading} />
        <AdminStatCard title="Photos profil" value={info?.counts.photos ?? 0} icon={Image} loading={loading} />
      </div>

      {storage?.publicConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(storage.publicConfig, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Derniers documents</CardTitle>
          <CardDescription>10 uploads les plus récents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="rounded-md border min-w-[320px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead className="hidden md:table-cell">Personne</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Taille</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(info?.recentDocuments ?? []).map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {doc.Person.firstName} {doc.Person.lastName} · {formatDateTime(doc.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{doc.Person.firstName} {doc.Person.lastName}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline">{doc.category}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell">{formatBytes(doc.sizeBytes)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDateTime(doc.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {!loading && !info?.recentDocuments?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">Aucun document</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
