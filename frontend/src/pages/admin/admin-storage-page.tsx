import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Database, FileText, Image } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import { toast } from "sonner"
import { fetchAdminStorage, type AdminStorageInfo } from "@/lib/admin-api"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function formatBytes(bytes: number, t: (key: string, opts?: { count: string }) => string) {
  if (bytes < 1024) return t("storage.bytes.bytes", { count: String(bytes) })
  if (bytes < 1024 * 1024) return t("storage.bytes.kb", { count: (bytes / 1024).toFixed(1) })
  return t("storage.bytes.mb", { count: (bytes / (1024 * 1024)).toFixed(1) })
}

export default function AdminStoragePage() {
  const { t } = useTranslation("admin")
  const [info, setInfo] = useState<AdminStorageInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStorage()
      .then(setInfo)
      .catch(() => toast.error(t("storage.toasts.loadFailed")))
      .finally(() => setLoading(false))
  }, [t])

  const storage = info?.storage

  const minioStatus = loading
    ? "…"
    : storage?.ready
      ? t("storage.minioReady")
      : storage?.enabled
        ? t("storage.minioUnavailable")
        : t("storage.minioDisabled")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("storage.title")}</h1>
        <p className="text-muted-foreground">{t("storage.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title={t("storage.minioStatus")}
          value={minioStatus}
          icon={Database}
          loading={loading}
          description={storage?.proxyUrl ? t("storage.proxy", { url: storage.proxyUrl }) : undefined}
        />
        <AdminStatCard title={t("storage.documents")} value={info?.counts.documents ?? 0} icon={FileText} loading={loading} />
        <AdminStatCard title={t("storage.profilePhotos")} value={info?.counts.photos ?? 0} icon={Image} loading={loading} />
      </div>

      {storage?.publicConfig && (
        <Card>
          <CardHeader>
            <CardTitle>{t("storage.configuration")}</CardTitle>
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
          <CardTitle>{t("storage.recentDocuments.title")}</CardTitle>
          <CardDescription>{t("storage.recentDocuments.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="rounded-md border min-w-[320px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("storage.table.title")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("storage.table.person")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("storage.table.type")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("storage.table.size")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("storage.table.date")}</TableHead>
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
                    <TableCell className="hidden lg:table-cell">{formatBytes(doc.sizeBytes, t)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDateTime(doc.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {!loading && !info?.recentDocuments?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">{t("storage.noDocuments")}</TableCell>
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
