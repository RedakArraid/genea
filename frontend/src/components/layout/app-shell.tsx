import { useEffect } from "react"
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  GitBranch,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Timer,
  TreePine,
  User,
} from "lucide-react"
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
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { title: "Correspondances", href: "matches", icon: Sparkles, treeScoped: true },
  { title: "Chronologie", href: "timeline", icon: Timer, treeScoped: true },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id: treeId } = useParams()
  const { user, logout } = useAuthStore()
  const { trees, sharedTrees, currentTree, fetchTrees } = useFamilyTreeStore()
  const activeTreeId = treeId ?? trees[0]?.id ?? sharedTrees[0]?.id
  const allTrees = [...trees, ...sharedTrees]

  useEffect(() => {
    fetchTrees()
  }, [fetchTrees])

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "G"

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
            <span>GeneaIA</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const href = item.treeScoped && activeTreeId
                    ? `/family-tree/${activeTreeId}/${item.href}`
                    : item.href
                  const active = item.treeScoped
                    ? location.pathname.includes(`/${item.href}`)
                    : location.pathname === item.href

                  if (item.treeScoped && !activeTreeId) return null

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton render={<Link to={href} />} isActive={active}>
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Mes arbres</SidebarGroupLabel>
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
                  <p className="px-2 text-xs text-muted-foreground">Aucun arbre</p>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link to="/profile" />}>
                <User />
                <span>Mon profil</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span>Déconnexion</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex flex-1 items-center justify-between gap-2">
            <div className="truncate text-sm text-muted-foreground">
              {currentTree?.name || "GeneaIA"}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={handleLogout}>
                <LogOut className="mr-1.5 size-4" />
                Déconnexion
              </Button>
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main className={cn("flex-1", location.pathname.includes("/family-tree/") && !location.pathname.includes("/timeline") && !location.pathname.includes("/matches") ? "overflow-hidden" : "p-6")}>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
