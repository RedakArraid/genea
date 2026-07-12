import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { TreePine } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { composePhone, DEFAULT_COUNTRY, normalizePhoneInput } from "@/lib/phone"
import { resolvePostLoginPath } from "@/lib/post-login-destination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const { login } = useAuthStore()

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const goAfterLogin = async () => {
    const target = await resolvePostLoginPath(redirect)
    navigate(target)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const trimmed = loginId.trim()
    let resolvedLogin = trimmed
    if (!trimmed.includes("@")) {
      const composed = composePhone(trimmed, DEFAULT_COUNTRY)
      resolvedLogin =
        normalizePhoneInput(composed, DEFAULT_COUNTRY) ||
        normalizePhoneInput(trimmed, DEFAULT_COUNTRY) ||
        trimmed
    }
    const result = await login(resolvedLogin, password)
    setLoading(false)
    if (result.success) {
      toast.success(t("login.success"))
      await goAfterLogin()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <TreePine className="size-6" />
          </div>
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>{t("login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login">{t("login.loginField")}</Label>
              <Input
                id="login"
                type="text"
                inputMode="tel"
                autoComplete="username"
                placeholder={t("login.loginPlaceholder")}
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full" data-testid="login-submit">
              {loading ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              {t("login.registerLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
