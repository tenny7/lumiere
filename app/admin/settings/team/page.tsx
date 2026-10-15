import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils/format"
import { SettingsNav } from "@/components/admin/settings-nav"
import { RoleSelect } from "@/components/admin/role-select"
import { OnlineDot } from "@/components/online-dot"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function TeamSettingsPage() {
  const supabase = await createClient()

  // The viewer can't change their own role; only a super admin manages super
  // admins (enforced in the database by migration 00016).
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()
  const { data: viewerProfile } = viewer
    ? await supabase.from("profiles").select("role").eq("id", viewer.id).single()
    : { data: null }
  const viewerIsSuperAdmin = viewerProfile?.role === "super_admin"

  // Staff first (any non-customer role), then everyone else.
  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .neq("role", "customer")
    .order("created_at", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage staff roles and access
        </p>
      </div>

      <SettingsNav />

      <p className="text-sm text-muted-foreground">
        Assign roles to control access. Promote a customer to a staff role from
        the Customers page, or adjust existing staff here.
      </p>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff?.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    <OnlineDot userId={member.id} />
                    {member.full_name}
                    {member.id === viewer?.id && (
                      <span className="text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {member.email}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(member.created_at)}
                </TableCell>
                <TableCell>
                  <RoleSelect
                    userId={member.id}
                    currentRole={member.role}
                    isSelf={member.id === viewer?.id}
                    viewerIsSuperAdmin={viewerIsSuperAdmin}
                  />
                </TableCell>
              </TableRow>
            ))}
            {(!staff || staff.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-muted-foreground"
                >
                  No staff members yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
