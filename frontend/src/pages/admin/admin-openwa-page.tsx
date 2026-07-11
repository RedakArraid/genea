import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, MessageCircle, RefreshCw, Send } from "lucide-react"
import { toast } from "sonner"
import {
  fetchOpenWaSettings,
  fetchOpenWaStatus,
  testOpenWaSettings,
  updateOpenWaSettings,
  type AdminOpenWaSettings,
  type AdminOpenWaStatusResponse,
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
  enabled: false,
  baseUrl: "",
  apiKey: "",
  sessionId: "",
}

export default function AdminOpenWaPage() {
  const { t } = useTranslation("admin")
  const [settings, setSettings] = useState<AdminOpenWaSettings | null>(null)
  const [status, setStatus] = useState<AdminOpenWaStatusResponse | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [testPhone, setTestPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const sessionStatusLabel = (statusKey: string) =>
    t(`openwa.sessionStatus.${statusKey}`, { defaultValue: statusKey })

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const openwa = await fetchOpenWaSettings()
      setSettings(openwa)
      setForm({
        enabled: openwa.enabled,
        baseUrl: openwa.baseUrl || "",
        apiKey: "",
        sessionId: openwa.sessionId || "",
      })
    } catch {
      toast.error(t("openwa.toasts.loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const result = await fetchOpenWaStatus()
      setStatus(result)
    } catch {
      setStatus({ reachable: false, configured: false, message: t("openwa.toasts.statusError") })
    } finally {
      setStatusLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadSettings()
    loadStatus()
  }, [loadSettings, loadStatus])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const openwa = await updateOpenWaSettings({
        enabled: form.enabled,
        baseUrl: form.baseUrl,
        apiKey: form.apiKey || undefined,
        sessionId: form.sessionId,
      })
      setSettings(openwa)
      setForm((f) => ({ ...f, apiKey: "" }))
      toast.success(t("openwa.toasts.saveSuccess"))
      await loadStatus()
    } catch {
      toast.error(t("openwa.toasts.saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error(t("openwa.test.phoneRequired"))
      return
    }
    setTesting(true)
    try {
      const result = await testOpenWaSettings(testPhone.trim())
      toast.success(result.message)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || t("openwa.toasts.testFailed"))
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

  const session = status?.session
  const sessionLabel = session?.status
    ? sessionStatusLabel(session.status)
    : t("common.dash")

  const testBlockedReason = !settings?.configured
    ? t("openwa.test.blockedIncomplete")
    : !status?.reachable && status?.message
      ? status.message
      : session && !session.connected
        ? t("openwa.test.blockedNotConnected", { status: sessionLabel })
        : !session?.connected
          ? status?.message || t("openwa.test.blockedNoSession")
          : null

  const canTest = Boolean(settings?.configured && session?.connected)

  const integrationValue = loading
    ? "…"
    : settings?.enabled && settings?.configured
      ? t("openwa.integrationActive")
      : settings?.configured
        ? t("openwa.integrationConfiguredInactive")
        : t("openwa.integrationNotConfigured")

  const sessionValue = statusLoading
    ? "…"
    : session?.connected
      ? t("openwa.sessionConnected")
      : session
        ? sessionLabel
        : status?.message || t("common.dash")

  const openWaDashboardUrl = form.baseUrl?.replace(/\/api\/?$/, "") || t("common.dash")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("openwa.title")}</h1>
        <p className="text-muted-foreground">{t("openwa.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title={t("openwa.integration")}
          value={integrationValue}
          icon={MessageCircle}
          loading={loading}
          description={sourceLabel}
        />
        <AdminStatCard
          title={t("openwa.whatsappSession")}
          value={sessionValue}
          icon={MessageCircle}
          loading={statusLoading}
          description={session?.phone ? `+${session.phone}` : undefined}
        />
        <AdminStatCard
          title={t("smtp.lastUpdated")}
          value={settings?.updatedAt ? formatDateTime(settings.updatedAt) : t("common.dash")}
          icon={MessageCircle}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("openwa.connection.title")}</CardTitle>
          <CardDescription>{t("openwa.connection.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <Switch
                id="openwa-enabled"
                checked={form.enabled}
                onCheckedChange={(enabled) => setForm({ ...form, enabled })}
              />
              <Label htmlFor="openwa-enabled">{t("openwa.fields.enabled")}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openwa-base-url">{t("openwa.fields.apiUrl")}</Label>
              <Input
                id="openwa-base-url"
                placeholder="http://openwa:2785/api"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {t("openwa.fields.apiUrlHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openwa-session-id">{t("openwa.fields.sessionId")}</Label>
              <Input
                id="openwa-session-id"
                placeholder="uuid de la session OpenWA"
                value={form.sessionId}
                onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openwa-api-key">
                {t("openwa.fields.apiKey")}
                {settings?.hasApiKey && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {t("common.defined")}
                  </Badge>
                )}
              </Label>
              <Input
                id="openwa-api-key"
                type="password"
                autoComplete="new-password"
                placeholder={settings?.hasApiKey ? t("common.leaveBlankToKeep") : ""}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("common.save")}
              </Button>
              <Button type="button" variant="outline" onClick={loadStatus} disabled={statusLoading}>
                {statusLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 size-4" />
                )}
                {t("openwa.refreshStatus")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {status?.message && !session?.connected && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <CardContent className="pt-6 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-medium">{t("openwa.sessionUnavailable.title")}</p>
            <p className="mt-1">{status.message}</p>
            <p className="mt-2 text-muted-foreground">
              {t("openwa.sessionUnavailable.hint", { url: openWaDashboardUrl })}
            </p>
          </CardContent>
        </Card>
      )}

      {session && (
        <Card>
          <CardHeader>
            <CardTitle>{t("openwa.sessionDetails.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2 max-w-xl">
            <div>
              <span className="text-muted-foreground">{t("openwa.sessionDetails.name")} </span>
              {session.name}
            </div>
            <div>
              <span className="text-muted-foreground">{t("openwa.sessionDetails.status")} </span>
              {sessionLabel}
            </div>
            {session.pushName && (
              <div>
                <span className="text-muted-foreground">{t("openwa.sessionDetails.profile")} </span>
                {session.pushName}
              </div>
            )}
            {session.lastError && (
              <div className="sm:col-span-2 text-destructive">
                {t("openwa.sessionDetails.error")} {session.lastError}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("openwa.test.title")}</CardTitle>
          <CardDescription>{t("openwa.test.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3 max-w-xl">
          <div className="flex-1 space-y-2 min-w-[200px]">
            <Label htmlFor="test-phone">{t("openwa.test.phone")}</Label>
            <Input
              id="test-phone"
              placeholder="+2250700000001"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing || !canTest}
          >
            {testing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            {t("common.sendTest")}
          </Button>
          {testBlockedReason && !canTest && (
            <p className="w-full text-sm text-muted-foreground">{testBlockedReason}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
