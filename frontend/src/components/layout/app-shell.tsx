import { useEffect } from "react"
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  GitBranch,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Timer,
  Shield,
  TreePine,
  User,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/stores/auth-store"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
import { isOrganizationTree } from "@/lib/tree-type"

const mainNavItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
] as const

const treeNavItems = [
  { key: "matches", href: "matches", icon: Sparkles },
  { key: "timeline", href: "timeline", icon: Timer },
] as const

export function AppShell() {
  const { t } = useTranslation(["common", "dashboard"])
  const location = useLocation()
  const navigate = useNavigate()
  const { id: treeId } = useParams()
  const { user, logout, isAdmin } = useAuthStore()
  const { trees, sharedTrees, currentTree, fetchTrees } = useFamilyTreeStore()
  const allTrees = [...trees, ...sharedTrees]
  const activeTree = allTrees.find((t) => t.id === treeId) ?? currentTree
  const onTreeRoute = Boolean(treeId && location.pathname.startsWith("/family-tree/"))
  const hideMatches = isOrganizationTree(activeTree)

  useEffect(() => {
    fetchTrees()
  }, [fetchTrees])

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.phone?.slice(-2) || user?.email?.[0]?.toUpperCase() || "G"

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <TreePine className="size-5" />
            <span>geneamap</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("dashboard:sidebar.navigation")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      render={<Link to={item.href} />}
                      isActive={location.pathname === item.href}
                    >
                      <item.icon />
                      <span>{t(`nav.${item.key}`)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {onTreeRoute && treeId && (
            <SidebarGroup>
              <SidebarGroupLabel>{t("dashboard:sidebar.currentTree")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {treeNavItems.map((item) => {
                    if (item.key === "matches" && hideMatches) return null
                    const href = `/family-tree/${treeId}/${item.href}`
                    const active = location.pathname.includes(`/${item.href}`)
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton render={<Link to={href} />} isActive={active}>
                          <item.icon />
                          <span>{t(`nav.${item.key}`)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel>{t("dashboard:sidebar.myTrees")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {allTrees.map((tree) => (
                  <SidebarMenuItem key={tree.id}>
                    <SidebarMenuButton
                      render={<Link to={`/family-tree/${tree.id}`} />}
                      isActive={treeId === tree.id && location.pathname.includes("/family-tree/")}
                    >
                      <GitBranch />
                      <span className="truncate">{tree.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {allTrees.length === 0 && (
                  <p className="px-2 text-xs text-muted-foreground">{t("dashboard:sidebar.noTree")}</p>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link to="/admin" />}>
                  <Shield />
                  <span>{t("nav.admin")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link to="/profile" />}>
                <User />
                <span>{t("dashboard:sidebar.myProfile")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span>{t("actions.logout")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="h-svh max-h-svh min-h-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex flex-1 items-center justify-between gap-2">
            <div className="truncate text-sm text-muted-foreground">
              {currentTree?.name || "geneamap"}
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={handleLogout}>
                <LogOut className="mr-1.5 size-4" />
                {t("actions.logout")}
              </Button>
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main className={cn(
          "flex min-h-0 flex-1 flex-col",
          location.pathname.includes("/family-tree/") && !location.pathname.includes("/timeline") && !location.pathname.includes("/matches")
            ? "overflow-hidden"
            : "p-4 sm:p-6"
        )}>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
