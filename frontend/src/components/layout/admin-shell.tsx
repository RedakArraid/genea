import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  CreditCard,
  Database,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Shield,
  Sparkles,
  Tag,
  Users,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
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

const adminNav = [
  { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Utilisateurs", href: "/admin/users", icon: Users },
  { title: "Arbres", href: "/admin/trees", icon: GitBranch },
  { title: "Stockage", href: "/admin/storage", icon: Database },
  { title: "Démo", href: "/admin/demo", icon: Sparkles },
  { title: "Forfaits", href: "/admin/plans", icon: CreditCard },
  { title: "Codes promo", href: "/admin/promo", icon: Tag },
]

export function AdminShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <Shield className="size-5 text-primary" />
            <span>Admin GeneaIA</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Back-office</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => {
                  const active = item.exact
                    ? location.pathname === item.href
                    : location.pathname.startsWith(item.href)
                  const navId = item.href === "/admin" ? "dashboard" : item.href.split("/").pop()!
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={
                          <Link
                            to={item.href}
                            data-testid={`admin-nav-${navId}`}
                            aria-label={`Admin — ${item.title}`}
                          />
                        }
                        isActive={active}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link to="/dashboard" />}>
                <ArrowLeft />
                <span>Retour app</span>
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
            <span className="truncate text-sm text-muted-foreground">Administration plateforme</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
