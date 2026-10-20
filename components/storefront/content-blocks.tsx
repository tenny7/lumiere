import { toParagraphs } from "@/lib/content/normalize"

// Shared pieces for pages whose text comes from Admin → Content.
// Text is plain: React escapes it, so admin input can't inject markup.

export function PageHeading({
  eyebrow,
  title,
  size = "lg",
  className = "mb-8",
}: {
  eyebrow: string
  title: string
  size?: "lg" | "md"
  className?: string
}) {
  return (
    <>
      {eyebrow && (
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          {eyebrow}
        </p>
      )}
      <h1
        className={`font-serif ${size === "lg" ? "text-4xl lg:text-5xl" : "text-4xl"} font-light ${className}`}
      >
        {title}
      </h1>
    </>
  )
}

/** Paragraphs split on blank lines; single line breaks are kept. */
export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {toParagraphs(text).map((p, i) => (
        <p key={i} className={`whitespace-pre-line ${className}`}>
          {p}
        </p>
      ))}
    </>
  )
}
