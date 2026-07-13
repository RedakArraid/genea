import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  CreditCard,
  Database,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  Shield,
  Sparkles,
  Tag,
  Users,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
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
  { titleKey: "shell.nav.dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { titleKey: "shell.nav.users", href: "/admin/users", icon: Users },
  { titleKey: "shell.nav.trees", href: "/admin/trees", icon: GitBranch },
  { titleKey: "shell.nav.storage", href: "/admin/storage", icon: Database },
  { titleKey: "shell.nav.smtp", href: "/admin/smtp", icon: Mail },
  { titleKey: "shell.nav.openwa", href: "/admin/openwa", icon: MessageCircle },
  { titleKey: "shell.nav.demo", href: "/admin/demo", icon: Sparkles },
  { titleKey: "shell.nav.plans", href: "/admin/plans", icon: CreditCard },
  { titleKey: "shell.nav.promo", href: "/admin/promo", icon: Tag },
] as const

export function AdminShell() {
  const { t } = useTranslation("admin")
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
            <span>{t("shell.brand")}</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("shell.backOffice")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => {
                  const title = t(item.titleKey)
                  const active = "exact" in item && item.exact
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
                            aria-label={t("shell.navAria", { title })}
                          />
                        }
                        isActive={active}
                      >
                        <item.icon />
                        <span>{title}</span>
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
                <span>{t("shell.backToApp")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span>{t("shell.logout")}</span>
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
            <span className="truncate text-sm text-muted-foreground">{t("shell.header")}</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
