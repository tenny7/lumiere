import { MessageCircle } from "lucide-react"
import type { SocialLinks } from "@/lib/utils/socials"

// lucide-react 1.x has no brand icons, so these two are drawn here in the
// same 24px stroke style.
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

const NETWORKS = [
  { key: "whatsapp", name: "WhatsApp", action: "Chat with us on", Icon: MessageCircle },
  { key: "instagram", name: "Instagram", action: "Follow us on", Icon: InstagramIcon },
  { key: "facebook", name: "Facebook", action: "Follow us on", Icon: FacebookIcon },
] as const

export function hasSocialLinks(links: SocialLinks) {
  return NETWORKS.some((n) => links[n.key])
}

/**
 * The store's social links from Admin → Settings. "icons" is the round icon
 * row in the footer; "buttons" shows the handle or number too (Contact page).
 * Networks without a saved handle are left out.
 */
export function SocialLinkList({
  links,
  variant = "icons",
  className = "",
}: {
  links: SocialLinks
  variant?: "icons" | "buttons"
  className?: string
}) {
  const items = NETWORKS.flatMap((n) => {
    const link = links[n.key]
    return link ? [{ ...n, link }] : []
  })
  if (items.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {items.map(({ key, name, action, Icon, link }) => (
        <li key={key}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${action} ${name} (${link.label})`}
            title={`${name}: ${link.label}`}
            className={
              variant === "icons"
                ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-amber-500/50 hover:text-warm-white"
                : "inline-flex items-center gap-2.5 border border-white/[0.08] px-4 py-2.5 text-sm text-[#f5f0e8] transition-colors hover:border-amber-500/50"
            }
          >
            <Icon
              className={
                variant === "icons" ? "h-4 w-4" : "h-4 w-4 text-amber-400"
              }
              strokeWidth={1.5}
            />
            {variant === "buttons" && (
              <span>
                {name}
                <span className="text-[#8a8478]"> · {link.label}</span>
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
