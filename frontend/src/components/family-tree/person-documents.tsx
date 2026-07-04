import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { FileText, Trash2, Upload, ExternalLink } from "lucide-react"
import type { PersonDocument } from "@/types"
import {
  deletePersonDocument,
  fetchPersonDocuments,
  formatFileSize,
  getStorageConfig,
  uploadPersonDocument,
  DOCUMENT_CATEGORY_LABELS,
  resolveMediaUrl,
} from "@/lib/upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PersonDocumentsProps {
  personId: string
  readOnly?: boolean
}

export function PersonDocuments({ personId, readOnly = false }: PersonDocumentsProps) {
  const [documents, setDocuments] = useState<PersonDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [maxMb, setMaxMb] = useState(20)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("other")
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [docs, cfg] = await Promise.all([
        fetchPersonDocuments(personId),
        getStorageConfig().catch(() => null),
      ])
      setDocuments(docs)
      setStorageReady(!!cfg?.ready)
      setMaxMb(cfg?.limits?.documentMaxMb ?? 20)
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [personId])

  useEffect(() => {
    load()
  }, [load])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || readOnly) return
    if (!storageReady) {
      toast.error("Stockage MinIO indisponible")
      return
    }
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${maxMb} Mo)`)
      return
    }
    setUploading(true)
    try {
      const doc = await uploadPersonDocument(
        personId,
        file,
        title.trim() || file.name,
        category
      )
      setDocuments((prev) => [doc, ...prev])
      setTitle("")
      setCategory("other")
      if (fileRef.current) fileRef.current.value = ""
      toast.success("Document ajouté")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Échec de l'upload"
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Supprimer ce document ?")) return
    try {
      await deletePersonDocument(personId, docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success("Document supprimé")
    } catch {
      toast.error("Impossible de supprimer le document")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Documents ({documents.length})
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : documents.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun document</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-start gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-xs"
            >
              <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{doc.title}</p>
                <p className="text-muted-foreground">
                  {DOCUMENT_CATEGORY_LABELS[doc.category] || doc.category} · {formatFileSize(doc.sizeBytes)}
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <a
                  href={resolveMediaUrl(doc.fileUrl) || doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ouvrir"
                  className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                >
                  <ExternalLink className="size-3.5" />
                </a>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && storageReady && (
        <div className="mt-1 flex flex-col gap-2 rounded-md border border-dashed p-2">
          <Label className="text-xs">Ajouter un document (PDF, images, Word… max {maxMb} Mo)</Label>
          <Input
            placeholder="Titre du document"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 text-xs"
          />
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt" onChange={handleUpload} />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-1 size-3.5" />
            {uploading ? "Envoi…" : "Choisir un fichier"}
          </Button>
        </div>
      )}

      {!readOnly && !storageReady && !loading && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Stockage MinIO non disponible — configurez S3_* dans le backend.
        </p>
      )}
    </div>
  )
}
