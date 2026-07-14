import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { fetchAdminPlans } from "@/lib/admin-api"
import { FEATURES } from "@/lib/features"
import { getPlanById } from "@/lib/plans"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { PlanId } from "@/types"

interface PlanData {
  id: string
  name: string
  priceLabel?: string
  maxTrees?: number
  maxPersonsPerTree?: number
  maxFichesTotal?: number | null
  maxPhotosTotal?: number | null
  maxCollaborators?: number
  features?: string[]
}

const PLAN_ORDER: PlanId[] = ["SOLO", "FAMILY", "PATRIMONY"]

function formatLimit(value: number | null | undefined) {
  if (value == null || value === Infinity) return "∞"
  return String(value)
}

export default function AdminPlansPage() {
  const { t } = useTranslation("admin")
  const [plans, setPlans] = useState<PlanData[]>([])
  const [userCountByPlan, setUserCountByPlan] = useState<Record<string, number>>({})
  const [usersTotal, setUsersTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminPlans()
      .then((data) => {
        setPlans(data.plans as unknown as PlanData[])
        setUserCountByPlan(data.userCountByPlan)
        setUsersTotal(data.usersTotal)
      })
      .catch(() => toast.error(t("plans.toasts.loadFailed")))
      .finally(() => setLoading(false))
  }, [t])

  const orderedPlans = PLAN_ORDER.map((id) => {
    const fromApi = plans.find((p) => p.id === id)
    const fallback = getPlanById(id)
    return fromApi ?? fallback
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("plans.title")}</h1>
        <p className="text-muted-foreground">{t("plans.subtitle", { count: usersTotal })}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {orderedPlans.map((plan) => {
          const count = userCountByPlan[plan.id] ?? 0
          const pct = usersTotal ? Math.round((count / usersTotal) * 100) : 0
          return (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge variant="secondary">{t("plans.usersCount", { count, pct })}</Badge>
                </div>
                <CardDescription>{plan.priceLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>{t("plans.limits.trees", { value: formatLimit(plan.maxTrees) })}</li>
                      <li>{t("plans.limits.personsPerTree", { value: formatLimit(plan.maxPersonsPerTree) })}</li>
                      {FEATURES.documentsEnabled && (
                        <li>{t("plans.limits.fichesTotal", { value: formatLimit(plan.maxFichesTotal) ?? t("common.dash") })}</li>
                      )}
                      <li>{t("plans.limits.photosTotal", { value: formatLimit(plan.maxPhotosTotal) ?? t("common.dash") })}</li>
                      <li>{t("plans.limits.collaborators", { value: formatLimit(plan.maxCollaborators) })}</li>
                    </ul>
                    <ul className="space-y-2">
                      {(plan.features ?? []).map((f) => (
                        <li key={f} className="flex gap-2 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
