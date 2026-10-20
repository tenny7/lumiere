import { notFound } from "next/navigation"
import { ContentEditor } from "@/components/admin/content/content-editor"
import { getSection } from "@/lib/content/sections"
import { getEditorContent } from "@/lib/content/server"

export const dynamic = "force-dynamic"

// One editor page per content section (lib/content/sections.ts).
// Testimonials and Newsletter have their own pages next to this one.
export default async function ContentSectionPage({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  const { key } = await params
  const section = getSection(key)
  if (!section) notFound()

  const { initial, defaults, updatedAt, tokens } = await getEditorContent(section.key)

  return (
    <ContentEditor
      sectionKey={section.key}
      initial={initial as Record<string, unknown>}
      defaults={defaults as Record<string, unknown>}
      updatedAt={updatedAt}
      tokens={tokens}
    />
  )
}
