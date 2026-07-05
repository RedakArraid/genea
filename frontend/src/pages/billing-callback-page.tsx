import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { verifyCheckout } from "@/lib/billing-api"
import { useAuthStore } from "@/stores/auth-store"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPlanById } from "@/lib/plans"
import type { PlanId } from "@/types"

export default function BillingCallbackPage() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get("reference") || searchParams.get("transaction_id")
  const { checkAuth } = useAuthStore()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [planId, setPlanId] = useState<PlanId | null>(null)

  useEffect(() => {
    if (!reference) {
      setStatus("failed")
      return
    }
    verifyCheckout(reference)
      .then(async (result) => {
        if (result.status === "success") {
          setStatus("success")
          setPlanId(result.plan || null)
          await checkAuth()
          toast.success("Paiement confirmé")
        } else {
          setStatus("failed")
          toast.error(result.message || "Paiement non confirmé")
        }
      })
      .catch(() => setStatus("failed"))
  }, [reference, checkAuth])

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Vérification du paiement…</p>
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
          <CardTitle>{status === "success" ? "Paiement réussi" : "Paiement échoué"}</CardTitle>
          <CardDescription>
            {status === "success" && planId
              ? `Forfait ${getPlanById(planId).name} activé.`
              : "Le paiement n'a pas pu être confirmé. Réessayez depuis la page Tarifs."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {status === "success" ? (
            <Link to="/dashboard" className={buttonVariants()}>Accéder au tableau de bord</Link>
          ) : (
            <Link to="/pricing" className={buttonVariants()}>Retour aux tarifs</Link>
          )}
          <Link to="/" className={buttonVariants({ variant: "outline" })}>Accueil</Link>
        </CardContent>
      </Card>
    </div>
  )
}
