import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { getPlanById } from "@/lib/plans"
import { LanguageSelect } from "@/components/language-switcher"
import { PhoneInput } from "@/components/phone-input"
import { formatShortDate } from "@/lib/format"
import { composePhone, formatPhoneDisplay, DEFAULT_COUNTRY } from "@/lib/phone"
import type { CountryCode } from "libphonenumber-js"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { t } = useTranslation(["dashboard", "billing", "common"])
  const { user, updateProfile } = useAuthStore()
  const [name, setName] = useState(user?.name || "")
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY)
  const [phone, setPhone] = useState(formatPhoneDisplay(user?.phone))
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const currentPlan = getPlanById(user?.plan || "SOLO")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload: Record<string, string> = {
      name,
      phone: composePhone(phone, phoneCountry),
      phoneCountry,
      email,
    }
    if (newPassword) {
      payload.currentPassword = currentPassword
      payload.newPassword = newPassword
    }
    const result = await updateProfile(payload)
    setLoading(false)
    if (result.success) {
      toast.success(result.message || t("profile.updated"))
      setCurrentPassword("")
      setNewPassword("")
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t("profile.name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <PhoneInput
              id="phone"
              label={t("profile.phone")}
              country={phoneCountry}
              onCountryChange={setPhoneCountry}
              value={phone}
              onChange={setPhone}
              required
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("profile.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("profile.emailHint")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("profile.language")}</Label>
              <LanguageSelect />
            </div>
            {user?.createdAt && (
              <p className="text-sm text-muted-foreground">
                {t("profile.memberSince", { date: formatShortDate(user.createdAt) })}
              </p>
            )}
            <Separator />
            <p className="text-sm font-medium">{t("profile.changePassword")}</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="current">{t("profile.currentPassword")}</Label>
              <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new">{t("profile.newPassword")}</Label>
              <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? t("common:actions.saving") : t("common:actions.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.subscription")}</CardTitle>
          <CardDescription>{t("profile.currentPlan")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{t(`billing:plans.${currentPlan.id}.name`)}</span>
            <Badge variant="secondary">{t(`billing:plans.${currentPlan.id}.priceLabel`)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("profile.comparePlans")}
          </p>
          <Link to="/pricing" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            {t("profile.managePlan")}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
