import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { Skeleton } from "@/components/ui/skeleton"

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="size-12 rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
