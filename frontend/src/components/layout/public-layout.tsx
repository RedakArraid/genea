import { Outlet, useLocation } from "react-router-dom"
import { MarketingHeader } from "@/components/layout/marketing-header"
import { cn } from "@/lib/utils"

export function PublicLayout() {
  const { pathname } = useLocation()
  const isCanvasView = pathname === "/demo" || pathname.startsWith("/tree/")

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        isCanvasView ? "h-svh max-h-svh overflow-hidden" : "min-h-screen"
      )}
    >
      <MarketingHeader variant={isCanvasView ? "minimal" : "default"} />
      <main className={cn(isCanvasView && "flex min-h-0 flex-1 flex-col")}>
        <Outlet />
      </main>
    </div>
  )
}
