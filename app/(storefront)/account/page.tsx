import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, Heart, Settings, LogOut, Sparkles, ArrowRight } from "lucide-react"
import { RoleBadge } from "@/components/role-badge"

export const dynamic = "force-dynamic"

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
          Welcome back
          {profile?.username
            ? `, ${profile.username}`
            : profile?.full_name && !profile.full_name.includes("@")
              ? `, ${profile.full_name.split(" ")[0]}`
              : ""}
        </h1>
        <div className="flex items-center gap-2.5 mb-10">
          <p className="text-sm text-[#8a8478]">{user.email}</p>
          <RoleBadge role={profile?.role} />
        </div>

        {/* First-time onboarding for new customers */}
        {(orderCount || 0) === 0 && (
          <div className="mb-10 border border-amber-500/20 bg-amber-500/[0.04] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Sparkles
                className="w-5 h-5 text-amber-400 shrink-0 mt-1"
                strokeWidth={1.5}
              />
              <div className="flex-1">
                <h2 className="font-serif text-xl mb-1.5">
                  New here? Let&apos;s find your light.
                </h2>
                <p className="text-sm text-[#8a8478] mb-5 leading-relaxed max-w-md">
                  Browse the collection, save favourites to your wishlist, and
                  check out in minutes. Your orders and tracking will live here.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors"
                  >
                    Explore the collection
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/categories/chandeliers"
                    className="inline-flex items-center px-5 py-2.5 border border-white/10 text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:border-amber-500/50 transition-colors"
                  >
                    Shop Chandeliers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

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
