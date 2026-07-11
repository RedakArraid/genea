import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { fetchAdminPlans } from "@/lib/admin-api"
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
  maxCollaborators?: number
  maxMediaAssets?: number
  features?: string[]
}

const PLAN_ORDER: PlanId[] = ["SOLO", "FAMILY", "PATRIMONY"]

export default function AdminPlansPage() {
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
      .catch(() => toast.error("Impossible de charger les forfaits"))
      .finally(() => setLoading(false))
  }, [])

  const orderedPlans = PLAN_ORDER.map((id) => {
    const fromApi = plans.find((p) => p.id === id)
    const fallback = getPlanById(id)
    return fromApi ?? fallback
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Forfaits</h1>
        <p className="text-muted-foreground">
          Limites définies en code — {usersTotal} utilisateur{usersTotal > 1 ? "s" : ""} au total
        </p>
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
                  <Badge variant="secondary">{count} users ({pct}%)</Badge>
                </div>
                <CardDescription>{plan.priceLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>Arbres : {plan.maxTrees == null || plan.maxTrees === Infinity ? "∞" : plan.maxTrees}</li>
                      <li>Personnes / arbre : {plan.maxPersonsPerTree == null || plan.maxPersonsPerTree === Infinity ? "∞" : plan.maxPersonsPerTree}</li>
                      <li>Photos & docs : {plan.maxMediaAssets == null || plan.maxMediaAssets === Infinity ? "∞" : plan.maxMediaAssets ?? "—"}</li>
                      <li>Collaborateurs : {plan.maxCollaborators == null || plan.maxCollaborators === Infinity ? "∞" : plan.maxCollaborators}</li>
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
