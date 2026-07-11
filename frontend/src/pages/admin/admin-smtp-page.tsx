import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Mail, Send } from "lucide-react"
import { toast } from "sonner"
import {
  fetchSmtpSettings,
  testSmtpSettings,
  updateSmtpSettings,
  type AdminSmtpSettings,
} from "@/lib/admin-api"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/format"

const emptyForm = {
  host: "",
  port: "587",
  secure: false,
  user: "",
  pass: "",
  from: "",
}

export default function AdminSmtpPage() {
  const { t } = useTranslation("admin")
  const [settings, setSettings] = useState<AdminSmtpSettings | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [testEmail, setTestEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const smtp = await fetchSmtpSettings()
      setSettings(smtp)
      setForm({
        host: smtp.host || "",
        port: String(smtp.port || 587),
        secure: smtp.secure,
        user: smtp.user || "",
        pass: "",
        from: smtp.from || "",
      })
      if (!testEmail && smtp.user) setTestEmail(smtp.user)
    } catch {
      toast.error(t("smtp.toasts.loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [testEmail, t])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const smtp = await updateSmtpSettings({
        host: form.host,
        port: parseInt(form.port, 10) || 587,
        secure: form.secure,
        user: form.user,
        pass: form.pass || undefined,
        from: form.from,
      })
      setSettings(smtp)
      setForm((f) => ({ ...f, pass: "" }))
      toast.success(t("smtp.toasts.saveSuccess"))
    } catch {
      toast.error(t("smtp.toasts.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast.error(t("smtp.test.emailRequired"))
      return
    }
    setTesting(true)
    try {
      const result = await testSmtpSettings(testEmail.trim())
      toast.success(result.message)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || t("smtp.toasts.testFailed"))
    } finally {
      setTesting(false)
    }
  }

  const sourceLabel =
    settings?.source === "db"
      ? t("common.source.db")
      : settings?.source === "env"
        ? t("common.source.env")
        : t("common.source.none")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("smtp.title")}</h1>
        <p className="text-muted-foreground">{t("smtp.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard
          title={t("smtp.status")}
          value={loading ? "…" : settings?.configured ? t("common.configured") : t("common.notConfigured")}
          icon={Mail}
          loading={loading}
          description={sourceLabel}
        />
        <AdminStatCard
          title={t("smtp.lastUpdated")}
          value={settings?.updatedAt ? formatDateTime(settings.updatedAt) : t("common.dash")}
          icon={Mail}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("smtp.server.title")}</CardTitle>
          <CardDescription>{t("smtp.server.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">{t("smtp.fields.host")}</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.example.com"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-port">{t("smtp.fields.port")}</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  id="smtp-secure"
                  checked={form.secure}
                  onCheckedChange={(secure) => setForm({ ...form, secure })}
                />
                <Label htmlFor="smtp-secure">{t("smtp.fields.secure")}</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-user">{t("smtp.fields.user")}</Label>
              <Input
                id="smtp-user"
                autoComplete="off"
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-pass">
                {t("smtp.fields.password")}
                {settings?.hasPassword && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {t("common.defined")}
                  </Badge>
                )}
              </Label>
              <Input
                id="smtp-pass"
                type="password"
                autoComplete="new-password"
                placeholder={settings?.hasPassword ? t("common.leaveBlankToKeep") : ""}
                value={form.pass}
                onChange={(e) => setForm({ ...form, pass: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-from">{t("smtp.fields.from")}</Label>
              <Input
                id="smtp-from"
                placeholder="geneamap <noreply@geneamap.com>"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("smtp.test.title")}</CardTitle>
          <CardDescription>{t("smtp.test.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3 max-w-xl">
          <div className="flex-1 space-y-2 min-w-[200px]">
            <Label htmlFor="test-email">{t("smtp.test.recipient")}</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="admin@geneamap.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={handleTest} disabled={testing || !settings?.configured}>
            {testing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            {t("common.sendTest")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
