import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { UnsubscribeButton } from "./unsubscribe-button"

export const metadata = { title: "Unsubscribe", robots: { index: false } }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// "jean.paul@gmail.com" → "je•••@gmail.com": enough to recognise, not to read.
function maskEmail(email: string) {
  const [user, domain] = email.split("@")
  return `${user.slice(0, 2)}•••@${domain ?? ""}`
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const row =
    id && UUID.test(id)
      ? (
          await createAdminClient()
            .from("newsletter_subscribers")
            .select("email, is_subscribed")
            .eq("id", id)
            .maybeSingle()
        ).data
      : null

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-md mx-auto px-4 text-center">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Newsletter
        </p>
        {!row ? (
          <>
            <h1 className="font-serif text-3xl font-light mb-4">Link not recognised</h1>
            <p className="text-sm text-[#8a8478]">
              This unsubscribe link isn&apos;t valid. Use the link in your most
              recent email, or reply to it and we&apos;ll remove you.
            </p>
          </>
        ) : !row.is_subscribed ? (
          <>
            <h1 className="font-serif text-3xl font-light mb-4">You&apos;re unsubscribed</h1>
            <p className="text-sm text-[#8a8478]">
              {maskEmail(row.email)} won&apos;t receive our newsletter.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl font-light mb-4">Unsubscribe?</h1>
            <p className="text-sm text-[#8a8478] mb-8">
              {maskEmail(row.email)} will stop receiving our newsletter.
            </p>
            <UnsubscribeButton id={id!} />
          </>
        )}
        <Link
          href="/"
          className="mt-10 inline-block text-[0.7rem] tracking-[0.15em] uppercase text-[#8a8478] hover:text-amber-400"
        >
          Back to the shop
        </Link>
      </div>
    </div>
  )
}
