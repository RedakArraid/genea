import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { TreePine } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { CountryCode } from "libphonenumber-js"
import { useAuthStore } from "@/stores/auth-store"
import { PhoneInput } from "@/components/phone-input"
import { composePhone, DEFAULT_COUNTRY, normalizePhoneInput } from "@/lib/phone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const loginHref = redirect !== "/dashboard"
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : "/login"
  const { register } = useAuthStore()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error(t("register.passwordTooShort"))
      return
    }
    if (password !== confirm) {
      toast.error(t("register.passwordMismatch"))
      return
    }
    setLoading(true)
    const composed = composePhone(phone, phoneCountry)
    const normalized =
      normalizePhoneInput(composed, phoneCountry) ||
      normalizePhoneInput(phone, phoneCountry)
    if (!normalized) {
      setLoading(false)
      toast.error(t("register.invalidPhone"))
      return
    }
    const result = await register(name, normalized, password, email.trim() || undefined, phoneCountry)
    setLoading(false)
    if (result.success) {
      toast.success(t("register.success"))
      navigate(redirect.startsWith("/") ? redirect : "/dashboard")
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
          <CardTitle>{t("register.title")}</CardTitle>
          <CardDescription>{t("register.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t("register.name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <PhoneInput
              id="phone"
              label={t("register.phone")}
              country={phoneCountry}
              onCountryChange={setPhoneCountry}
              value={phone}
              onChange={setPhone}
              required
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("register.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">{t("register.confirm")}</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t("register.submitting") : t("register.submit")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("register.alreadyRegistered")}{" "}
            <Link to={loginHref} className="text-primary underline-offset-4 hover:underline">
              {t("register.loginLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
