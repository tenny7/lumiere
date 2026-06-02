"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"
type Ctx = { theme: Theme; toggle: () => void }

const AdminThemeContext = createContext<Ctx>({ theme: "light", toggle: () => {} })
export const useAdminTheme = () => useContext(AdminThemeContext)

const STORAGE_KEY = "ajabu_admin_theme"

/**
 * Admin-only light/dark theme. Applies the `.dark` class to a wrapper around the
 * admin UI (not <html>), so shadcn tokens go dark inside admin while the
 * storefront — which uses hard-coded dark colours — is never affected.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "dark" || saved === "light") setTheme(saved)
  }, [])

  function toggle() {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light"
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div
        className={
          theme === "dark"
            ? "dark bg-background text-foreground"
            : "bg-background text-foreground"
        }
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
