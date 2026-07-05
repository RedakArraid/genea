import { Outlet, useLocation } from "react-router-dom"
import { MarketingHeader } from "@/components/layout/marketing-header"

export function PublicLayout() {
  const { pathname } = useLocation()
  const isPublicView = pathname === "/demo" || pathname.startsWith("/tree/")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader variant={isPublicView ? "minimal" : "default"} />
      <Outlet />
    </div>
  )
}
