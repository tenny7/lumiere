"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Search, Package } from "lucide-react"
import { formatDate } from "@/lib/utils/format"

export type OrderOption = {
  id: string
  order_number: string
  status: string
  created_at: string
}

/**
 * "New message" button + modal. Support is per-order, so the customer picks
 * which of their orders the message is about, then lands on that order's thread.
 */
export function NewMessageButton({ orders }: { orders: OrderOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const q = query.trim().toLowerCase()
  const filtered = q
    ? orders.filter((o) => o.order_number.toLowerCase().includes(q))
    : orders

  function pick(id: string) {
    setOpen(false)
    router.push(`/account/messages/${id}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        New message
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#111110] border border-[#242320] rounded-xl p-6 relative max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="font-serif text-xl font-light mb-1 text-[#f5f0e8]">
              Message support
            </h2>
            <p className="text-sm text-[#8a8478] mb-4">
              Which order is this about?
            </p>

            {orders.length === 0 ? (
              <div className="text-center py-10">
                <Package
                  className="w-8 h-8 text-[#8a8478]/40 mx-auto mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-[#8a8478] leading-relaxed">
                  You can message support about an order once you&apos;ve placed
                  one.
                </p>
              </div>
            ) : (
              <>
                {orders.length > 5 && (
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8478]" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search order number"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#1a1918] border border-[#242320] text-sm text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 rounded transition-colors"
                    />
                  </div>
                )}
                <div className="overflow-y-auto -mx-1 px-1 space-y-2">
                  {filtered.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pick(o.id)}
                      className="w-full text-left flex items-center justify-between gap-3 border border-white/[0.06] p-3.5 hover:border-amber-500/30 rounded transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block font-serif text-sm text-[#f5f0e8] truncate">
                          {o.order_number}
                        </span>
                        <span className="block text-xs text-[#8a8478] mt-0.5 capitalize">
                          {o.status} &middot; {formatDate(o.created_at)}
                        </span>
                      </span>
                      <Package
                        className="w-4 h-4 text-[#8a8478] shrink-0"
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-[#8a8478] text-center py-6">
                      No orders match &ldquo;{query}&rdquo;.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
