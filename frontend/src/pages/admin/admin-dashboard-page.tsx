import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation("admin")
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
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title={t("dashboard.stats.users")}
          value={stats?.usersTotal ?? 0}
          icon={Users}
          loading={loading}
          description={t("dashboard.stats.usersWeek", { count: stats?.newUsersWeek ?? 0 })}
        />
        <AdminStatCard
          title={t("dashboard.stats.trees")}
          value={stats?.treesTotal ?? 0}
          icon={GitBranch}
          loading={loading}
          description={t("dashboard.stats.treesDesc", {
            demo: stats?.demoTrees ?? 0,
            public: stats?.publicTrees ?? 0,
          })}
        />
        <AdminStatCard title={t("dashboard.stats.persons")} value={stats?.personsTotal ?? 0} loading={loading} />
        <AdminStatCard
          title={t("dashboard.stats.documents")}
          value={stats?.documentsTotal ?? 0}
          icon={FileText}
          loading={loading}
          description={t("dashboard.stats.photos", { count: stats?.photosTotal ?? 0 })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.planDistribution.title")}</CardTitle>
            <CardDescription>{t("dashboard.planDistribution.description")}</CardDescription>
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
              <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.treeVisibility.title")}</CardTitle>
            <CardDescription>{t("dashboard.treeVisibility.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("dashboard.treeVisibility.public")}</span>
              <Badge variant="secondary">{stats?.publicTrees ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("dashboard.treeVisibility.private")}</span>
              <Badge variant="outline">{stats?.privateTrees ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t("dashboard.treeVisibility.demo")}</span>
              <Badge>{stats?.demoTrees ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("dashboard.recentUsers.title")}</CardTitle>
            <CardDescription>{t("dashboard.recentUsers.description")}</CardDescription>
          </div>
          <Link
            to="/admin/users"
            data-testid="admin-dashboard-recent-users"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("dashboard.recentUsers.seeAll")}
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
          {t("dashboard.actions.manageUsers")}
        </Link>
        <Link to="/admin/demo" data-testid="admin-dashboard-reset-demo" className={buttonVariants({ variant: "outline" })}>
          <Sparkles className="mr-2 size-4" />
          {t("dashboard.actions.resetDemo")}
        </Link>
      </div>
    </div>
  )
}
