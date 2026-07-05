import { useCallback, useEffect, useState } from "react"
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

const sessionStatusLabel: Record<string, string> = {
  created: "Créée",
  initializing: "Initialisation",
  qr_ready: "QR code prêt",
  authenticating: "Authentification",
  ready: "Connectée",
  disconnected: "Déconnectée",
  failed: "Échec",
}

export default function AdminOpenWaPage() {
  const [settings, setSettings] = useState<AdminOpenWaSettings | null>(null)
  const [status, setStatus] = useState<AdminOpenWaStatusResponse | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [testPhone, setTestPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

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
      toast.error("Impossible de charger la configuration OpenWA")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const result = await fetchOpenWaStatus()
      setStatus(result)
    } catch {
      setStatus({ reachable: false, configured: false, message: "Erreur de statut" })
    } finally {
      setStatusLoading(false)
    }
  }, [])

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
      toast.success("Configuration OpenWA enregistrée")
      await loadStatus()
    } catch {
      toast.error("Échec de l'enregistrement OpenWA")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Indiquez un numéro de téléphone de test")
      return
    }
    setTesting(true)
    try {
      const result = await testOpenWaSettings(testPhone.trim())
      toast.success(result.message)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "Échec du test OpenWA")
    } finally {
      setTesting(false)
    }
  }

  const sourceLabel =
    settings?.source === "db"
      ? "Base de données (admin)"
      : settings?.source === "env"
        ? "Variables d'environnement"
        : "Non configuré"

  const session = status?.session
  const sessionLabel = session?.status
    ? sessionStatusLabel[session.status] || session.status
    : "—"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp / OpenWA</h1>
        <p className="text-muted-foreground">
          Configuration de l'envoi des codes OTP via WhatsApp (OpenWA self-hosted)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Intégration"
          value={loading ? "…" : settings?.enabled && settings?.configured ? "Activée" : settings?.configured ? "Configurée (inactive)" : "Non configurée"}
          icon={MessageCircle}
          loading={loading}
          description={sourceLabel}
        />
        <AdminStatCard
          title="Session WhatsApp"
          value={statusLoading ? "…" : session?.connected ? "Connectée" : session ? sessionLabel : status?.message || "—"}
          icon={MessageCircle}
          loading={statusLoading}
          description={session?.phone ? `+${session.phone}` : undefined}
        />
        <AdminStatCard
          title="Dernière mise à jour"
          value={settings?.updatedAt ? formatDateTime(settings.updatedAt) : "—"}
          icon={MessageCircle}
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connexion OpenWA</CardTitle>
          <CardDescription>
            OpenWA doit tourner en service séparé (Docker). Créez une session et scannez le QR code
            depuis le dashboard OpenWA, puis renseignez l'URL de l'API, la clé API et l'ID de session.
            WhatsApp est utilisé en priorité pour l'OTP ; l'email SMTP reste le canal de secours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <Switch
                id="openwa-enabled"
                checked={form.enabled}
                onCheckedChange={(enabled) => setForm({ ...form, enabled })}
              />
              <Label htmlFor="openwa-enabled">Activer l'envoi OTP par WhatsApp</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openwa-base-url">URL de l'API</Label>
              <Input
                id="openwa-base-url"
                placeholder="http://openwa:2785/api"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                URL de base incluant <code>/api</code> (ex. http://localhost:2785/api)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openwa-session-id">ID de session</Label>
              <Input
                id="openwa-session-id"
                placeholder="uuid de la session OpenWA"
                value={form.sessionId}
                onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openwa-api-key">
                Clé API
                {settings?.hasApiKey && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Définie
                  </Badge>
                )}
              </Label>
              <Input
                id="openwa-api-key"
                type="password"
                autoComplete="new-password"
                placeholder={settings?.hasApiKey ? "Laisser vide pour ne pas changer" : ""}
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enregistrer
              </Button>
              <Button type="button" variant="outline" onClick={loadStatus} disabled={statusLoading}>
                {statusLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 size-4" />
                )}
                Actualiser le statut
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {session && (
        <Card>
          <CardHeader>
            <CardTitle>Détails session</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2 max-w-xl">
            <div>
              <span className="text-muted-foreground">Nom : </span>
              {session.name}
            </div>
            <div>
              <span className="text-muted-foreground">Statut : </span>
              {sessionLabel}
            </div>
            {session.pushName && (
              <div>
                <span className="text-muted-foreground">Profil : </span>
                {session.pushName}
              </div>
            )}
            {session.lastError && (
              <div className="sm:col-span-2 text-destructive">
                Erreur : {session.lastError}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test d'envoi</CardTitle>
          <CardDescription>
            Enregistrez la configuration et assurez-vous que la session est connectée, puis envoyez
            un message WhatsApp de test.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3 max-w-xl">
          <div className="flex-1 space-y-2 min-w-[200px]">
            <Label htmlFor="test-phone">Numéro (format international)</Label>
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
            disabled={testing || !settings?.configured || !session?.connected}
          >
            {testing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Envoyer un test
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
