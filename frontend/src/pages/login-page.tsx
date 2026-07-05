import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { TreePine } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function formatPhoneDisplay(phone: string) {
  if (phone.startsWith("+225")) return `0${phone.slice(4)}`
  return phone
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const { login, requestOtp, verifyOtp } = useAuthStore()

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const [otpPhone, setOtpPhone] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpEnabled, setOtpEnabled] = useState(false)

  useEffect(() => {
    api.get("/auth/otp/status").then(({ data }) => setOtpEnabled(data.enabled)).catch(() => setOtpEnabled(false))
  }, [])

  const goAfterLogin = () => {
    navigate(redirect.startsWith("/") ? redirect : "/dashboard")
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(loginId, password)
    setLoading(false)
    if (result.success) {
      toast.success("Connexion réussie")
      goAfterLogin()
    } else {
      toast.error(result.message)
    }
  }

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpLoading(true)
    const result = await requestOtp(otpPhone)
    setOtpLoading(false)
    if (result.success) {
      setOtpSent(true)
      toast.success(result.message || "Code envoyé")
    } else {
      toast.error(result.message)
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpLoading(true)
    const result = await verifyOtp(otpPhone, otpCode)
    setOtpLoading(false)
    if (result.success) {
      toast.success("Connexion réussie")
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
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Accédez à vos arbres généalogiques</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="password">Mot de passe</TabsTrigger>
              <TabsTrigger value="otp" disabled={!otpEnabled}>
                Code SMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="login">Téléphone ou email</Label>
                  <Input
                    id="login"
                    type="text"
                    inputMode="tel"
                    autoComplete="username"
                    placeholder="07XXXXXXXX"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              {!otpSent ? (
                <form onSubmit={handleOtpRequest} className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Recevez un code à 6 chiffres (par email si renseigné sur votre compte).
                  </p>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="otp-phone">Téléphone</Label>
                    <Input
                      id="otp-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="07XXXXXXXX"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={otpLoading} className="w-full">
                    {otpLoading ? "Envoi..." : "Recevoir un code"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Un code a été envoyé pour le <strong>{formatPhoneDisplay(otpPhone)}</strong>.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="otp-code">Code à 6 chiffres</Label>
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
                    {otpLoading ? "Vérification..." : "Valider le code"}
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
                    Changer de numéro
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Pas de compte ?{" "}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              S'inscrire
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
