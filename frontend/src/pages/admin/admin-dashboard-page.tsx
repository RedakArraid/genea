import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FileText, GitBranch, Sparkles, Users } from "lucide-react"
import { formatRelativeDate } from "@/lib/format"
import { fetchAdminStats, type AdminStats } from "@/lib/admin-api"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getPlanById } from "@/lib/plans"
import type { PlanId } from "@/types"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme GeneaIA</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Utilisateurs" value={stats?.usersTotal ?? 0} icon={Users} loading={loading} description={`+${stats?.newUsersWeek ?? 0} cette semaine`} />
        <AdminStatCard title="Arbres" value={stats?.treesTotal ?? 0} icon={GitBranch} loading={loading} description={`${stats?.demoTrees ?? 0} démo · ${stats?.publicTrees ?? 0} publics`} />
        <AdminStatCard title="Personnes" value={stats?.personsTotal ?? 0} loading={loading} />
        <AdminStatCard title="Documents" value={stats?.documentsTotal ?? 0} icon={FileText} loading={loading} description={`${stats?.photosTotal ?? 0} photos`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition forfaits</CardTitle>
            <CardDescription>Utilisateurs par plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.planDistribution ?? []).map(({ plan, count }) => {
              const planInfo = getPlanById(plan as PlanId)
              const pct = stats?.usersTotal ? Math.round((count / stats.usersTotal) * 100) : 0
              return (
                <div key={plan} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{planInfo.name}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {!loading && !stats?.planDistribution?.length && (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibilité arbres</CardTitle>
            <CardDescription>Public vs privé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Publics</span>
              <Badge variant="secondary">{stats?.publicTrees ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Privés</span>
              <Badge variant="outline">{stats?.privateTrees ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Arbres démo</span>
              <Badge>{stats?.demoTrees ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dernières inscriptions</CardTitle>
            <CardDescription>5 comptes les plus récents</CardDescription>
          </div>
          <Link
            to="/admin/users"
            data-testid="admin-dashboard-recent-users"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {(stats?.recentUsers ?? []).map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{u.name || u.email}</p>
                  <p className="text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role ?? "USER"}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeDate(u.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link to="/admin/users" data-testid="admin-dashboard-manage-users" className={buttonVariants()}>
          <Users className="mr-2 size-4" />
          Gérer les comptes
        </Link>
        <Link to="/admin/demo" data-testid="admin-dashboard-reset-demo" className={buttonVariants({ variant: "outline" })}>
          <Sparkles className="mr-2 size-4" />
          Réinitialiser démo
        </Link>
      </div>
    </div>
  )
}
