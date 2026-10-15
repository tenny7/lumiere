import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { AdminThemeProvider } from "@/components/admin/admin-theme"
import { AdminNotifications } from "@/components/admin/admin-notifications"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The middleware already admits only staff, and only to their own areas;
  // the role here decides which links and alerts each person sees.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null }
  const role = (profile?.role as string | undefined) ?? null

  return (
    <AdminThemeProvider>
      <SidebarProvider>
        <AdminSidebar role={role} />
        <SidebarInset>
          <AdminHeader />
          <AdminNotifications role={role} />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AdminThemeProvider>
  )
}
