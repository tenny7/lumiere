"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, X, ArrowRight, Rocket } from "lucide-react"

export type OnboardingStep = {
  key: string
  label: string
  description: string
  href: string
  cta: string
  done: boolean
}

const STORAGE_KEY = "ajabu_admin_onboarding_dismissed"

/**
 * First-run checklist for a new store. Auto-hides once every step is complete
 * or the admin dismisses it. Rendered client-side so it can be dismissed and
 * so it never flashes for set-up stores.
 */
export function GettingStarted({ steps }: { steps: OnboardingStep[] }) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "1")
  }, [])

  const doneCount = steps.filter((s) => s.done).length
  if (hidden || doneCount === steps.length) return null

  return (
    <section className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
            <Rocket className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Get your store ready
            </h2>
            <p className="text-sm text-neutral-500">
              A few steps to launch Ajabu Lighting.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1")
            setHidden(true)
          }}
          aria-label="Dismiss getting started"
          className="text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-[width] duration-500"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-neutral-500">
          {doneCount}/{steps.length}
        </span>
      </div>

      {/* Steps */}
      <ol className="mt-2 divide-y divide-amber-100/70">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center gap-3 py-3">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                step.done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-neutral-300 text-transparent"
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  step.done
                    ? "text-neutral-400 line-through"
                    : "text-neutral-900"
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-neutral-500">{step.description}</p>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
              >
                {step.cta}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
