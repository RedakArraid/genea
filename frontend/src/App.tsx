import { useEffect, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { ProtectedRoute } from "@/components/protected-route"
import { PublicLayout } from "@/components/layout/public-layout"
import { AppShell } from "@/components/layout/app-shell"
import HomePage from "@/pages/home-page"
import LoginPage from "@/pages/login-page"
import RegisterPage from "@/pages/register-page"
import PricingPage from "@/pages/pricing-page"
import DashboardPage from "@/pages/dashboard-page"
import ProfilePage from "@/pages/profile-page"
import FamilyTreePage from "@/pages/family-tree-page"
import DemoPage from "@/pages/demo-page"
import InvitePage from "@/pages/invite-page"
import BillingCallbackPage from "@/pages/billing-callback-page"
import TimelinePage from "@/pages/timeline-page"
import MatchesPage from "@/pages/matches-page"
import { AdminRoute } from "@/components/admin/admin-route"
import { AdminShell } from "@/components/layout/admin-shell"
import AdminDashboardPage from "@/pages/admin/admin-dashboard-page"
import AdminUsersPage from "@/pages/admin/admin-users-page"
import AdminUserDetailPage from "@/pages/admin/admin-user-detail-page"
import AdminTreesPage from "@/pages/admin/admin-trees-page"
import AdminStoragePage from "@/pages/admin/admin-storage-page"
import AdminDemoPage from "@/pages/admin/admin-demo-page"
import AdminPlansPage from "@/pages/admin/admin-plans-page"
import AdminPromoPage from "@/pages/admin/admin-promo-page"
import AdminSmtpPage from "@/pages/admin/admin-smtp-page"
import NotFoundPage from "@/pages/not-found-page"
import { Skeleton } from "@/components/ui/skeleton"

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Skeleton className="size-12 rounded-full" /></div>
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { t, i18n } = useTranslation()
  const { checkAuth } = useAuthStore()
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    checkAuth().finally(() => setBootstrapped(true))
  }, [checkAuth])

  useEffect(() => {
    document.title = t("metaTitle")
  }, [t, i18n.language])

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="size-12 rounded-full" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/billing/callback" element={<BillingCallbackPage />} />
          <Route path="/tree/:id" element={<FamilyTreePage />} />
          <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
          <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/family-tree/:id" element={<FamilyTreePage />} />
            <Route path="/family-tree/:id/timeline" element={<TimelinePage />} />
            <Route path="/family-tree/:id/matches" element={<MatchesPage />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/trees" element={<AdminTreesPage />} />
            <Route path="/admin/storage" element={<AdminStoragePage />} />
            <Route path="/admin/demo" element={<AdminDemoPage />} />
            <Route path="/admin/plans" element={<AdminPlansPage />} />
            <Route path="/admin/promo" element={<AdminPromoPage />} />
            <Route path="/admin/smtp" element={<AdminSmtpPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
