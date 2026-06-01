"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState("")

  // Profile
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")

  // Addresses
  const [addresses, setAddresses] = useState<
    Array<{
      id: string
      label: string | null
      line_1: string
      line_2: string | null
      city: string
      region: string | null
      is_default: boolean
    }>
  >([])
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newLine1, setNewLine1] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newRegion, setNewRegion] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [addingAddress, setAddingAddress] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login?redirect=/account/settings")
        return
      }

      setEmail(user.email || "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || "")
        setUsername(profile.username || "")
        setPhone(profile.phone || "")
      }

      const { data: addrs } = await supabase
        .from("addresses")
        .select("id, label, line_1, line_2, city, region, is_default")
        .eq("profile_id", user.id)
        .order("is_default", { ascending: false })

      if (addrs) setAddresses(addrs)

      setLoading(false)
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Session expired. Please log in again.")
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username: username.trim() || null,
        phone,
      })
      .eq("id", user.id)

    if (error) {
      toast.error(
        error.code === "23505"
          ? "That username is already taken"
          : "Failed to update profile",
      )
    } else {
      toast.success("Profile updated")
    }
    setSaving(false)
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault()
    setAddingAddress(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Session expired")
      setAddingAddress(false)
      return
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert({
        profile_id: user.id,
        label: newLabel || "home",
        line_1: newLine1,
        city: newCity,
        region: newRegion || null,
        is_default: addresses.length === 0,
      })
      .select("id, label, line_1, line_2, city, region, is_default")
      .single()

    if (error) {
      toast.error("Failed to add address")
    } else if (data) {
      setAddresses([...addresses, data])
      setNewLine1("")
      setNewCity("")
      setNewRegion("")
      setNewLabel("")
      setShowAddAddress(false)
      toast.success("Address added")
    }
    setAddingAddress(false)
  }

  async function handleDeleteAddress(id: string) {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Failed to delete address")
    } else {
      setAddresses(addresses.filter((a) => a.id !== id))
      toast.success("Address removed")
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword.length < 12) {
      toast.error("New password must be at least 12 characters")
      return
    }

    setChangingPassword(true)

    // Verify current password by re-signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (signInError) {
      toast.error("Current password is incorrect")
      setChangingPassword(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      toast.error(error.message || "Failed to update password")
    } else {
      toast.success("Password updated")
      setCurrentPassword("")
      setNewPassword("")
    }
    setChangingPassword(false)
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-[#8a8478] hover:text-[#f5f0e8] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          My Account
        </Link>

        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Account Settings
        </p>
        <h1 className="font-serif text-4xl font-light mb-10">
          Settings
        </h1>

        {/* ═══ Profile ═══ */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-light mb-6">Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#8a8478] outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="A short display name (optional)"
                className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-[#8a8478] mt-1.5">
                Shown around the store instead of your email.
              </p>
            </div>
            <div>
              <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

        <div className="border-t border-white/[0.06] mb-12" />

        {/* ═══ Addresses ═══ */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-light">Addresses</h2>
            {!showAddAddress && (
              <button
                onClick={() => setShowAddAddress(true)}
                className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add address
              </button>
            )}
          </div>

          {addresses.length > 0 ? (
            <div className="space-y-3 mb-6">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="flex items-start justify-between border border-white/[0.06] p-4"
                >
                  <div className="text-sm">
                    {addr.label && (
                      <span className="text-[0.6rem] font-medium tracking-[0.1em] uppercase text-amber-400 mb-1 block">
                        {addr.label}
                      </span>
                    )}
                    <p>{addr.line_1}</p>
                    {addr.line_2 && <p className="text-[#8a8478]">{addr.line_2}</p>}
                    <p className="text-[#8a8478]">
                      {addr.city}
                      {addr.region && `, ${addr.region}`}
                    </p>
                    {addr.is_default && (
                      <span className="text-[0.6rem] font-medium tracking-[0.1em] uppercase text-green-400 mt-1 inline-block">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-[#8a8478] hover:text-rose-400 transition-colors p-1"
                    title="Remove address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8a8478] mb-6">No addresses saved</p>
          )}

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="border border-white/[0.06] p-5 space-y-4">
              <h3 className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-2">
                New Address
              </h3>
              <div>
                <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                  Label (optional)
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Home, Office"
                  className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                  Address
                </label>
                <input
                  type="text"
                  value={newLine1}
                  onChange={(e) => setNewLine1(e.target.value)}
                  required
                  placeholder="Street address"
                  className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                    City
                  </label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                    Region
                  </label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={addingAddress}
                  className="px-6 py-3 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {addingAddress ? "Adding..." : "Add Address"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-6 py-3 border border-white/10 text-[0.7rem] font-light tracking-[0.15em] uppercase hover:border-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <div className="border-t border-white/[0.06] mb-12" />

        {/* ═══ Password ═══ */}
        <section>
          <h2 className="font-serif text-2xl font-light mb-6">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={12}
                className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-[#8a8478] mt-1.5">Minimum 12 characters</p>
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="px-8 py-3 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
