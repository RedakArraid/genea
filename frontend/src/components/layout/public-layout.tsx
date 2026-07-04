import { Outlet, useLocation } from "react-router-dom"
import { MarketingHeader } from "@/components/layout/marketing-header"

export function PublicLayout() {
  const { pathname } = useLocation()
  const isDemo = pathname === "/demo"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader variant={isDemo ? "minimal" : "default"} />
      <Outlet />
    </div>
  )
}
