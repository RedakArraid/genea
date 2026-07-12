import { useRef, useState } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { FamilyTree, TreeBackgroundMode } from "@/types"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { useStorageConfig, photoMaxBytes } from "@/hooks/use-storage-config"
import { uploadTreeBackground } from "@/lib/upload"
import { getDefaultBackgroundOpacity } from "@/lib/tree-background"
import { AuthenticatedImage } from "@/components/ui/authenticated-image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OrgBackgroundSettingsProps {
  tree: FamilyTree
  canEdit: boolean
}

export function OrgBackgroundSettings({ tree, canEdit }: OrgBackgroundSettingsProps) {
  const { t } = useTranslation("tree")
  const { updateTreeBackground } = useFamilyTreeStore()
  const storageConfig = useStorageConfig()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const mode = (tree.backgroundMode || "NONE") as TreeBackgroundMode
  const opacity = tree.backgroundOpacity ?? getDefaultBackgroundOpacity(mode === "REPEAT" ? "REPEAT" : "COVER")
  const overlay = tree.backgroundOverlay ?? true
  const tileSize = tree.backgroundTileSize ?? 160
  const imageUrl = tree.backgroundImageUrl || null
  const storageReady = storageConfig?.ready ?? false

  const persist = async (patch: Parameters<typeof updateTreeBackground>[1]) => {
    setBusy(true)
    const result = await updateTreeBackground(tree.id, patch)
    setBusy(false)
    if (!result.success) {
      toast.error(result.message || t("org.background.saveError"))
      return false
    }
    return true
  }

  const handleUpload = async (file: File) => {
    if (!storageReady) {
      toast.error(t("org.background.storageUnavailable"))
      return
    }
    const maxBytes = photoMaxBytes(storageConfig)
    if (file.size > maxBytes) {
      toast.error(t("org.background.fileTooLarge", { max: Math.round(maxBytes / (1024 * 1024)) }))
      return
    }

    setBusy(true)
    try {
      const { url } = await uploadTreeBackground(file, tree.id)
      const nextMode: TreeBackgroundMode = mode === "NONE" ? "COVER" : mode
      const ok = await persist({
        backgroundImageUrl: url,
        backgroundMode: nextMode,
        backgroundOpacity: tree.backgroundOpacity ?? getDefaultBackgroundOpacity(nextMode),
      })
      if (ok) toast.success(t("org.background.uploaded"))
    } catch {
      toast.error(t("org.background.uploadError"))
    } finally {
      setBusy(false)
    }
  }

  const handleModeChange = async (nextMode: TreeBackgroundMode) => {
    if (nextMode === "NONE") {
      const ok = await persist({ backgroundMode: "NONE", backgroundImageUrl: null })
      if (ok) toast.success(t("org.background.removed"))
      return
    }
    if (!imageUrl) {
      toast.error(t("org.background.imageRequired"))
      return
    }
    await persist({
      backgroundMode: nextMode,
      backgroundOpacity: getDefaultBackgroundOpacity(nextMode),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Separator />
      <div>
        <h3 className="text-sm font-semibold">{t("org.background.title")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("org.background.hint")}</p>
      </div>

      {imageUrl ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted/30">
          <AuthenticatedImage
            src={imageUrl}
            alt=""
            className="h-28 w-full object-cover"
            fallback={<div className="flex h-28 items-center justify-center text-xs text-muted-foreground">{t("org.background.preview")}</div>}
          />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground">
          {t("org.background.empty")}
        </div>
      )}

      {canEdit && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (file) void handleUpload(file)
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || !storageReady}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="mr-1 size-4" />
              {imageUrl ? t("org.background.replace") : t("org.background.upload")}
            </Button>
            {imageUrl && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void handleModeChange("NONE")}
              >
                <Trash2 className="mr-1 size-4" />
                {t("org.background.remove")}
              </Button>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <Label>{t("org.background.mode")}</Label>
        <Select
          value={mode}
          onValueChange={(v) => v && canEdit && void handleModeChange(v as TreeBackgroundMode)}
          disabled={!canEdit || busy}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">{t("org.background.modeNone")}</SelectItem>
            <SelectItem value="COVER">{t("org.background.modeCover")}</SelectItem>
            <SelectItem value="REPEAT">{t("org.background.modeRepeat")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode !== "NONE" && imageUrl && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bg-opacity">
              {t("org.background.opacity")} — {Math.round(opacity * 100)}%
            </Label>
            <input
              id="bg-opacity"
              type="range"
              min={5}
              max={100}
              step={5}
              value={Math.round(opacity * 100)}
              disabled={!canEdit || busy}
              className="w-full accent-primary"
              onChange={(e) => void persist({ backgroundOpacity: Number(e.target.value) / 100 })}
            />
          </div>

          {mode === "REPEAT" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="bg-tile">
                {t("org.background.tileSize")} — {tileSize}px
              </Label>
              <input
                id="bg-tile"
                type="range"
                min={80}
                max={320}
                step={20}
                value={tileSize}
                disabled={!canEdit || busy}
                className="w-full accent-primary"
                onChange={(e) => void persist({ backgroundTileSize: Number(e.target.value) })}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <Label className="min-w-0 flex-1">{t("org.background.overlay")}</Label>
            <Switch
              className="shrink-0"
              checked={overlay}
              disabled={!canEdit || busy}
              onCheckedChange={(v) => void persist({ backgroundOverlay: v })}
            />
          </div>
        </>
      )}
    </div>
  )
}
