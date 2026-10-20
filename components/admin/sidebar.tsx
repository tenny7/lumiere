"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Ticket,
  BarChart3,
  Settings,
  Activity,
  Lightbulb,
  MessageSquare,
  Star,
  BookOpen,
  FileText,
  ChevronRight,
} from "lucide-react"
import { useAdminUnreadMessages } from "@/hooks/use-unread-messages"
import { usePendingReviews } from "@/hooks/use-pending-reviews"
import { useOrdersNeedingAttention } from "@/hooks/use-orders-needing-attention"
import { can, type StaffArea } from "@/lib/permissions"
import { CONTENT_GROUPS, CONTENT_SECTIONS } from "@/lib/content/sections"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  href: string
  icon: typeof LayoutDashboard
  area: StaffArea
}

const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, area: "dashboard" },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart, area: "orders" },
  { title: "Support", href: "/admin/support", icon: MessageSquare, area: "support" },
  { title: "Reviews", href: "/admin/reviews", icon: Star, area: "reviews" },
  { title: "Products", href: "/admin/products", icon: Package, area: "catalog" },
  { title: "Categories", href: "/admin/categories", icon: FolderTree, area: "catalog" },
  { title: "Customers", href: "/admin/customers", icon: Users, area: "customers" },
  { title: "Coupons", href: "/admin/coupons", icon: Ticket, area: "coupons" },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3, area: "analytics" },
]

const crmNav: NavItem[] = [
  { title: "Activity", href: "/admin/crm/activity", icon: Activity, area: "activity" },
]

const settingsNav: NavItem[] = [
  { title: "Settings", href: "/admin/settings", icon: Settings, area: "settings" },
  { title: "Admin Guide", href: "/admin/guide", icon: BookOpen, area: "guide" },
]

export function AdminSidebar({ role }: { role: string | null }) {
  const pathname = usePathname()
  // Only show what this role can open (lib/permissions.ts).
  const allowed = (items: NavItem[]) => items.filter((i) => can(role, i.area))
  const main = allowed(mainNav)
  const crm = allowed(crmNav)
  const bottom = allowed(settingsNav)
  const supportUnread = useAdminUnreadMessages()
  const pendingReviews = usePendingReviews()
  const ordersNeedingAttention = useOrdersNeedingAttention()
  const { setOpenMobile } = useSidebar()
  // Content sub-links: open on content pages, or when toggled.
  const onContent = pathname.startsWith("/admin/content")
  const [contentToggled, setContentToggled] = useState<boolean | null>(null)
  const contentOpen = contentToggled ?? onContent

  // Close the mobile sidebar after navigating to a new page.
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link
          href="/"
          title="View store"
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-wide">Ajabu Lighting</span>
            <span className="text-[0.6rem] text-muted-foreground block -mt-0.5">
              Admin Panel
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Store</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href)
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    {item.href === "/admin/orders" && ordersNeedingAttention > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[0.6rem] font-semibold text-black">
                        {ordersNeedingAttention > 99 ? "99+" : ordersNeedingAttention}
                      </span>
                    )}
                    {item.href === "/admin/support" && supportUnread > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[0.6rem] font-semibold text-black">
                        {supportUnread > 99 ? "99+" : supportUnread}
                      </span>
                    )}
                    {item.href === "/admin/reviews" && pendingReviews > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[0.6rem] font-semibold text-black">
                        {pendingReviews > 99 ? "99+" : pendingReviews}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {can(role, "content") && (
          <>
            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Website</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/admin/content" />}
                      isActive={pathname === "/admin/content"}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Content</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={() => setContentToggled(!contentOpen)}
                      aria-expanded={contentOpen}
                      aria-label={contentOpen ? "Hide content pages" : "Show content pages"}
                    >
                      <ChevronRight
                        className={`transition-transform ${contentOpen ? "rotate-90" : ""}`}
                      />
                    </SidebarMenuAction>
                    {contentOpen && (
                      <SidebarMenuSub>
                        {CONTENT_GROUPS.map((group) => (
                          <li key={group} className="contents">
                            <span className="px-2 pt-2 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground first:pt-0.5">
                              {group}
                            </span>
                            <ul className="flex flex-col gap-1">
                              {CONTENT_SECTIONS.filter((c) => c.group === group).map((c) => (
                                <SidebarMenuSubItem key={c.key}>
                                  <SidebarMenuSubButton
                                    render={<Link href={`/admin/content/${c.key}`} />}
                                    isActive={pathname === `/admin/content/${c.key}`}
                                  >
                                    <span>{c.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {crm.length > 0 && (
          <>
            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>CRM</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {crm.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={pathname.startsWith(item.href)}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottom.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to Store
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
