import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, Heart, Settings, LogOut } from "lucide-react"
import { RoleBadge } from "@/components/role-badge"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/account")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", user.id)

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          My Account
        </p>
        <h1 className="font-serif text-4xl font-light mb-2">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <div className="flex items-center gap-2.5 mb-10">
          <p className="text-sm text-[#8a8478]">{user.email}</p>
          <RoleBadge role={profile?.role} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/account/orders"
            className="group border border-white/[0.06] p-6 hover:border-amber-500/30 transition-colors"
          >
            <Package className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-lg mb-1">Orders</h3>
            <p className="text-sm text-[#8a8478]">
              {orderCount || 0} order{orderCount !== 1 ? "s" : ""}
            </p>
          </Link>

          <Link
            href="/account/wishlist"
            className="group border border-white/[0.06] p-6 hover:border-amber-500/30 transition-colors"
          >
            <Heart className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-lg mb-1">Wishlist</h3>
            <p className="text-sm text-[#8a8478]">Your saved items</p>
          </Link>

          <Link
            href="/account/settings"
            className="group border border-white/[0.06] p-6 hover:border-amber-500/30 transition-colors"
          >
            <Settings className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-lg mb-1">Settings</h3>
            <p className="text-sm text-[#8a8478]">Profile & addresses</p>
          </Link>

          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-left group border border-white/[0.06] p-6 hover:border-rose-500/30 transition-colors"
            >
              <LogOut className="w-5 h-5 text-rose-400 mb-3" strokeWidth={1.5} />
              <h3 className="font-serif text-lg mb-1">Sign Out</h3>
              <p className="text-sm text-[#8a8478]">Log out of your account</p>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
