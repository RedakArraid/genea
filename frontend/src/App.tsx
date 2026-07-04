import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
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
import TimelinePage from "@/pages/timeline-page"
import MatchesPage from "@/pages/matches-page"
import NotFoundPage from "@/pages/not-found-page"
import { Skeleton } from "@/components/ui/skeleton"

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Skeleton className="size-12 rounded-full" /></div>
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
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

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
