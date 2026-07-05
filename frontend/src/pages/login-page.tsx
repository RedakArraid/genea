import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { TreePine } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import type { CountryCode } from "libphonenumber-js"
import { useAuthStore } from "@/stores/auth-store"
import api from "@/lib/api"
import { PhoneInput } from "@/components/phone-input"
import { composePhone, formatPhoneDisplay, DEFAULT_COUNTRY, normalizePhoneInput } from "@/lib/phone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const { login, requestOtp, verifyOtp } = useAuthStore()

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const [otpPhone, setOtpPhone] = useState("")
  const [otpCountry, setOtpCountry] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpEnabled, setOtpEnabled] = useState(false)
  const [composedOtpPhone, setComposedOtpPhone] = useState("")

  useEffect(() => {
    api.get("/auth/otp/status").then(({ data }) => setOtpEnabled(data.enabled)).catch(() => setOtpEnabled(false))
  }, [])

  const goAfterLogin = () => {
    navigate(redirect.startsWith("/") ? redirect : "/dashboard")
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
      goAfterLogin()
    } else {
      toast.error(result.message)
    }
  }

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    const composed = composePhone(otpPhone, otpCountry)
    setOtpLoading(true)
    const result = await requestOtp(composed, otpCountry)
    setOtpLoading(false)
    if (result.success) {
      setComposedOtpPhone(composed)
      setOtpSent(true)
      toast.success(result.message || t("otp.sent"))
    } else {
      toast.error(result.message)
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpLoading(true)
    const result = await verifyOtp(composedOtpPhone, otpCode, otpCountry)
    setOtpLoading(false)
    if (result.success) {
      toast.success(t("login.success"))
      goAfterLogin()
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
          <Tabs defaultValue="password">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="password">{t("login.passwordTab")}</TabsTrigger>
              <TabsTrigger value="otp" disabled={!otpEnabled}>
                {t("login.otpTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password">
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
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? t("login.submitting") : t("login.submit")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              {!otpSent ? (
                <form onSubmit={handleOtpRequest} className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">{t("otp.intro")}</p>
                  <PhoneInput
                    id="otp-phone"
                    label={t("otp.phone")}
                    country={otpCountry}
                    onCountryChange={setOtpCountry}
                    value={otpPhone}
                    onChange={setOtpPhone}
                    required
                  />
                  <Button type="submit" disabled={otpLoading} className="w-full">
                    {otpLoading ? t("otp.requesting") : t("otp.request")}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    <Trans
                      ns="auth"
                      i18nKey="otp.sentTo"
                      values={{ phone: formatPhoneDisplay(composedOtpPhone, otpCountry) }}
                      components={{ strong: <strong /> }}
                    />
                  </p>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="otp-code">{t("otp.codeLabel")}</Label>
                    <Input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      maxLength={6}
                      pattern="\d{6}"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={otpLoading || otpCode.length !== 6} className="w-full">
                    {otpLoading ? t("otp.verifying") : t("otp.verify")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOtpSent(false)
                      setOtpCode("")
                    }}
                  >
                    {t("otp.changeNumber")}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

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
