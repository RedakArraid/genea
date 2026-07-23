import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { FamilyTree, OrgLexiconConfig, OrgLexiconPreset } from "@/types"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import {
  getPresetLexicon,
  normalizeOrgLexicon,
} from "@/lib/org-lexicon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OrgLexiconSettingsProps {
  tree: FamilyTree
  canEdit: boolean
}

const PRESET_KEYS: Exclude<OrgLexiconPreset, "custom">[] = ["enterprise", "school", "promo", "crew"]

export function OrgLexiconSettings({ tree, canEdit }: OrgLexiconSettingsProps) {
  const { t } = useTranslation("tree")
  const { updateTreeLexicon } = useFamilyTreeStore()
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<OrgLexiconConfig>(() => normalizeOrgLexicon(tree.orgLexicon))

  useEffect(() => {
    setDraft(normalizeOrgLexicon(tree.orgLexicon))
  }, [tree.orgLexicon])

  const persist = async (payload: { orgLexicon?: Partial<OrgLexiconConfig>; orgLexiconPreset?: OrgLexiconPreset }) => {
    setBusy(true)
    const result = await updateTreeLexicon(tree.id, payload)
    setBusy(false)
    if (!result.success) {
      toast.error(result.message || t("org.lexicon.saveError"))
      return false
    }
    return true
  }

  const handlePresetChange = async (preset: OrgLexiconPreset) => {
    if (preset === "custom") {
      setDraft((prev) => ({ ...prev, preset: "custom" }))
      return
    }
    const next = { ...getPresetLexicon(preset), showLevelOnCard: draft.showLevelOnCard }
    setDraft(next)
    const ok = await persist({ orgLexiconPreset: preset })
    if (ok) toast.success(t("org.lexicon.saved"))
  }

  const handleShowLevelOnCard = async (checked: boolean) => {
    const next = { ...draft, showLevelOnCard: checked }
    setDraft(next)
    if (!canEdit) return
    const ok = await persist({ orgLexicon: next })
    if (ok) toast.success(t("org.lexicon.saved"))
  }

  const handleSaveCustom = async () => {
    const ok = await persist({ orgLexicon: { ...draft, preset: "custom" } })
    if (ok) toast.success(t("org.lexicon.saved"))
  }

  const setField = <K extends keyof OrgLexiconConfig>(key: K, value: OrgLexiconConfig[K]) => {
    setDraft((prev) => ({ ...prev, preset: "custom", [key]: value }))
  }

  return (
    <div className="flex flex-col gap-4">
      <Separator />
      <div>
        <h3 className="text-sm font-semibold">{t("org.lexicon.title")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("org.lexicon.hint")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("org.lexicon.preset")}</Label>
        <Select
          value={draft.preset}
          onValueChange={(v) => v && canEdit && void handlePresetChange(v as OrgLexiconPreset)}
          disabled={!canEdit || busy}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESET_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {t(`org.lexicon.presets.${key}`)}
              </SelectItem>
            ))}
            <SelectItem value="custom">{t("org.lexicon.presets.custom")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lex-level-term">{t("org.lexicon.levelTerm")}</Label>
          <Input
            id="lex-level-term"
            value={draft.levelTerm}
            disabled={!canEdit || busy}
            onChange={(e) => setField("levelTerm", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lex-level-abbrev">{t("org.lexicon.levelAbbrev")}</Label>
          <Input
            id="lex-level-abbrev"
            value={draft.levelAbbrev}
            maxLength={3}
            disabled={!canEdit || busy}
            onChange={(e) => setField("levelAbbrev", e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
        <div className="min-w-0">
          <Label htmlFor="lex-show-level" className="text-sm font-medium">
            {t("org.lexicon.showLevelOnCard")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("org.lexicon.showLevelOnCardHint")}</p>
        </div>
        <Switch
          id="lex-show-level"
          checked={draft.showLevelOnCard}
          disabled={!canEdit || busy}
          onCheckedChange={(v) => void handleShowLevelOnCard(v)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("org.lexicon.levelOrder")}</Label>
        <Select
          value={draft.levelOrder}
          onValueChange={(v) => v && setField("levelOrder", v as OrgLexiconConfig["levelOrder"])}
          disabled={!canEdit || busy}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOP_HIGH">{t("org.lexicon.levelOrderTopHigh")}</SelectItem>
            <SelectItem value="TOP_LOW">{t("org.lexicon.levelOrderTopLow")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lex-superior">{t("org.lexicon.superiorLabel")}</Label>
          <Input
            id="lex-superior"
            value={draft.superiorLabel}
            disabled={!canEdit || busy}
            onChange={(e) => setField("superiorLabel", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lex-subordinate">{t("org.lexicon.subordinateLabel")}</Label>
          <Input
            id="lex-subordinate"
            value={draft.subordinateLabel}
            disabled={!canEdit || busy}
            onChange={(e) => setField("subordinateLabel", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lex-role">{t("org.lexicon.roleLabel")}</Label>
        <Input
          id="lex-role"
          value={draft.roleLabel}
          disabled={!canEdit || busy}
          onChange={(e) => setField("roleLabel", e.target.value)}
        />
      </div>

      <details className="rounded-lg border p-3 text-sm">
        <summary className="cursor-pointer font-medium">{t("org.lexicon.advanced")}</summary>
        <div className="mt-3 grid gap-3">
          {(
            [
              ["newSubordinate", "org.lexicon.newSubordinate"],
              ["linkExistingSubordinate", "org.lexicon.linkExistingSubordinate"],
              ["asSuperior", "org.lexicon.asSuperior"],
              ["asSubordinate", "org.lexicon.asSubordinate"],
              ["superiorOf", "org.lexicon.superiorOf"],
              ["subordinateOf", "org.lexicon.subordinateOf"],
              ["addTitle", "org.lexicon.addTitle"],
            ] as const
          ).map(([key, labelKey]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={`lex-${key}`}>{t(labelKey)}</Label>
              <Input
                id={`lex-${key}`}
                value={draft[key]}
                disabled={!canEdit || busy}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </details>

      {canEdit && draft.preset === "custom" && (
        <Button type="button" size="sm" disabled={busy} onClick={() => void handleSaveCustom()}>
          {t("org.lexicon.save")}
        </Button>
      )}

      {canEdit && draft.preset !== "custom" && (
        <p className="text-xs text-muted-foreground">
          {t("org.lexicon.presetHint", { preset: t(`org.lexicon.presets.${draft.preset}`) })}
        </p>
      )}
    </div>
  )
}
