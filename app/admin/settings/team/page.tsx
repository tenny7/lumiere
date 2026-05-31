import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils/format"
import { SettingsNav } from "@/components/admin/settings-nav"
import { RoleSelect } from "@/components/admin/role-select"
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
                  {member.full_name}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {member.email}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(member.created_at)}
                </TableCell>
                <TableCell>
                  <RoleSelect userId={member.id} currentRole={member.role} />
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
