import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { verifyCheckout } from "@/lib/billing-api"
import { useAuthStore } from "@/stores/auth-store"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlanId } from "@/types"

export default function BillingCallbackPage() {
  const { t } = useTranslation("billing")
  const [searchParams] = useSearchParams()
  const reference = searchParams.get("reference") || searchParams.get("transaction_id")
  const { checkAuth } = useAuthStore()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [planId, setPlanId] = useState<PlanId | null>(null)
  const verifiedRef = useRef(false)

  useEffect(() => {
    if (!reference || verifiedRef.current) {
      if (!reference) setStatus("failed")
      return
    }
    verifiedRef.current = true

    verifyCheckout(reference)
      .then(async (result) => {
        if (result.status === "success") {
          setStatus("success")
          setPlanId(result.plan || null)
          if (result.user) {
            useAuthStore.setState({
              user: result.user,
              isAuthenticated: true,
              isAdmin: result.user.role === "ADMIN",
            })
          } else {
            await checkAuth({ silent: true })
          }
          toast.success(t("callback.paymentConfirmed"))
        } else {
          setStatus("failed")
          toast.error(result.message || t("callback.paymentFailed"))
        }
      })
      .catch(() => setStatus("failed"))
  }, [reference, checkAuth, t])

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">{t("callback.verifying")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === "success" ? (
            <CheckCircle2 className="mx-auto size-12 text-green-600" />
          ) : (
            <XCircle className="mx-auto size-12 text-destructive" />
          )}
          <CardTitle>{status === "success" ? t("callback.successTitle") : t("callback.failedTitle")}</CardTitle>
          <CardDescription>
            {status === "success" && planId
              ? t("callback.successDesc", { plan: t(`plans.${planId}.name`) })
              : t("callback.failedDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {status === "success" ? (
            <Link to="/dashboard" className={buttonVariants()}>{t("callback.goDashboard")}</Link>
          ) : (
            <Link to="/pricing" className={buttonVariants()}>{t("callback.backPricing")}</Link>
          )}
          <Link to="/" className={buttonVariants({ variant: "outline" })}>{t("callback.home")}</Link>
        </CardContent>
      </Card>
    </div>
  )
}
