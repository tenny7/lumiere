// Every piece of storefront text that admins can edit (Admin → Content).
//
// Each section is one editor page in the admin and one row in store_settings
// (key `content.<section>`, value = the section's JSON). The defaults below
// are what the site shows until a section is edited, so a missing or broken
// row never empties a page. The admin editor and the storefront both read
// this file: the editor renders `fields`, the storefront reads the data.
//
// Text can include placeholders that are filled from Admin → Settings when
// the page is shown (see CONTENT_TOKENS), so prices and contact details stay
// in step with checkout and invoices.

export const ICON_NAMES = [
  "shield",
  "truck",
  "rotate",
  "headphones",
  "lightbulb",
  "sparkles",
  "leaf",
  "wrench",
  "clock",
  "award",
  "heart",
  "map-pin",
  "phone",
  "credit-card",
  "gift",
  "star",
  "home",
  "zap",
] as const
export type IconName = (typeof ICON_NAMES)[number]

export const CONTENT_TOKENS = [
  { token: "{store_name}", label: "Store name (Settings → General)" },
  { token: "{store_email}", label: "Store email (Settings → General)" },
  { token: "{store_phone}", label: "Store phone (Settings → General)" },
  { token: "{store_address}", label: "Store address (Settings → General)" },
  {
    token: "{free_delivery_threshold}",
    label: "Free shipping threshold (Settings → Payments)",
  },
  { token: "{delivery_fee}", label: "Standard delivery fee (Settings → Payments)" },
] as const

export type SubField =
  | { type: "text"; key: string; label: string; placeholder?: string; max?: number }
  | { type: "textarea"; key: string; label: string; rows?: number; max?: number; help?: string }
  | { type: "lines"; key: string; label: string; help?: string }
  | { type: "icon"; key: string; label: string }

export type Field =
  | { type: "heading"; label: string; help?: string }
  | { type: "text"; key: string; label: string; help?: string; placeholder?: string; max?: number }
  | { type: "textarea"; key: string; label: string; help?: string; rows?: number; max?: number }
  | { type: "lines"; key: string; label: string; help?: string; maxItems?: number }
  | { type: "url"; key: string; label: string; help?: string; placeholder?: string }
  | { type: "toggle"; key: string; label: string; help?: string }
  | { type: "number"; key: string; label: string; help?: string; min: number; max: number }
  | {
      type: "items"
      key: string
      label: string
      help?: string
      itemName: string
      titleKey: string
      fields: SubField[]
      maxItems: number
    }

const PARAGRAPHS_HELP = "Leave an empty line between paragraphs."
const LINES_HELP = "One per line."

// ── Defaults: the text the site showed before it became editable ──────────

const DEFAULTS = {
  home: {
    eyebrow: "Spring Collection 2026",
    titleLine1: "Light That",
    titleHighlight: "Lives",
    subtitle:
      "Handpicked fixtures that transform your space from simply lit to truly luminous.",
    primaryButton: "Explore Collection",
    secondaryButton: "Our Story",
    marquee: [
      "Free Shipping Over {free_delivery_threshold}",
      "Handcrafted Artisan Fixtures",
      "Smart Home Compatible",
      "5-Year Warranty",
      "Expert Lighting Consultation",
      "Carbon-Neutral Delivery",
    ],
    categoriesEyebrow: "Shop by Category",
    categoriesTitle: "Find Your Light",
    categoriesLink: "All Categories",
    featuredEyebrow: "Editor's Picks",
    featuredTitle: "Curated for You",
    featuredLink: "View All",
  },
  promises: {
    items: [
      { icon: "shield", title: "5-Year Warranty", text: "Every fixture protected against defects" },
      { icon: "truck", title: "Free Delivery", text: "On all orders over {free_delivery_threshold}" },
      { icon: "rotate", title: "Easy Returns", text: "90 days to decide, free return shipping" },
      { icon: "headphones", title: "Expert Support", text: "Real designers, available 7 days a week" },
    ],
  },
  testimonials: {
    show: true,
    heading: "From Our Customers",
    count: 3,
    minRating: 4,
    showNames: false,
  },
  newsletter: {
    title: "Stay in the Light",
    subtitle:
      "New arrivals, design inspiration, and exclusive offers — delivered weekly.",
    buttonLabel: "Subscribe",
    successMessage: "You're subscribed — welcome to {store_name}.",
    welcomeSubject: "Welcome to {store_name}",
    welcomeBody:
      "Thanks for subscribing. You'll be the first to hear about new arrivals, design inspiration and exclusive offers.",
  },
  about: {
    eyebrow: "Our Story",
    title: "Illuminating Spaces, Inspiring Lives",
    body: [
      "Ajabu Lighting was born from a simple belief: the right light transforms everything. A room, a mood, a moment. We curate exceptional lighting from artisan makers and renowned designers to bring that transformation to your space.",
      "From the warm glow of handcrafted chandeliers to the precision of modern smart lighting, every piece in our collection is chosen for its quality, beauty, and ability to create atmosphere.",
      "Based in Kigali, we serve customers across Rwanda and beyond, bringing world-class lighting design to East Africa and making it accessible through seamless mobile money payments.",
    ].join("\n\n"),
  },
  contact: {
    eyebrow: "Get In Touch",
    title: "Contact Us",
    intro: "",
    email: "{store_email}",
    phone: "{store_phone}",
    showroomLabel: "Showroom",
    showroomAddress: "{store_address}",
    openingHours: [] as string[],
    mapUrl: "",
    socialHeading: "Chat or follow us",
  },
  shipping: {
    eyebrow: "Delivery Info",
    title: "Shipping & Returns",
    sections: [
      {
        heading: "Shipping",
        points: [
          "Free delivery on orders over {free_delivery_threshold} within Kigali",
          "Standard delivery: 2-5 business days ({delivery_fee})",
          "Express delivery: 1-2 business days (RWF 10,000)",
          "Nationwide delivery available across Rwanda",
        ],
      },
      {
        heading: "Returns",
        points: [
          "30-day return window for unused items in original packaging",
          "Damaged items reported within 48 hours qualify for free replacement",
          "Contact {store_email} to initiate a return",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "Help Center",
    title: "Frequently Asked Questions",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept MoMo Transfer (send the order total to our MoMo number, then tap “I have paid”) and Cash on Delivery. The options available are shown at checkout.",
      },
      {
        question: "Do you offer installation services?",
        answer:
          "Yes! We partner with certified electricians across Kigali. Installation can be added during checkout or scheduled after delivery.",
      },
      {
        question: "How long does delivery take?",
        answer:
          "Standard delivery within Kigali takes 2-5 business days. Express delivery is available for 1-2 day turnaround. Nationwide shipping is available across Rwanda.",
      },
      {
        question: "Can I return an item?",
        answer:
          "We offer a 30-day return window for unused items in their original packaging. Damaged items can be reported within 48 hours for a free replacement.",
      },
      {
        question: "Do your smart lights work with Google Home / Alexa?",
        answer:
          "Yes, most of our smart lighting products are compatible with major platforms. Check the product specifications for detailed compatibility info.",
      },
      {
        question: "Do you ship outside Rwanda?",
        answer:
          "Currently we deliver nationwide within Rwanda. International shipping is coming soon — sign up for our newsletter to be notified.",
      },
    ],
  },
  installation: {
    eyebrow: "Expert Help",
    title: "Installation Guide",
    intro:
      "Many of our light fixtures can be installed with basic tools and electrical knowledge. For complex installations like chandeliers, recessed lighting, or outdoor fixtures, we recommend professional installation.",
    sections: [
      {
        heading: "Professional Installation",
        body: "We partner with certified electricians across Kigali. Installation starts at RWF 15,000 per fixture and can be booked during checkout or by contacting our support team.",
      },
      {
        heading: "Smart Light Setup",
        body: "All smart lights come with step-by-step setup guides in the box. Our support team is available via WhatsApp to walk you through connecting to your home Wi-Fi and preferred smart home platform.",
      },
    ],
  },
  designers: {
    eyebrow: "Collaborations",
    title: "Our Designers",
    intro:
      "We partner with talented lighting designers and artisan studios from across the globe. Each collaboration brings a unique perspective to our collection, blending traditional craftsmanship with contemporary design.",
    items: [
      {
        name: "Atelier Lumen",
        location: "Paris, France",
        discipline: "Crystal & Brass Chandeliers",
        bio: "A third-generation atelier hand-cutting crystal for grand interiors. Their cascading prism designs anchor our flagship collection.",
      },
      {
        name: "Studio Kintaro",
        location: "Kyoto, Japan",
        discipline: "Paper & Minimal Pendants",
        bio: "Quiet, sculptural pieces inspired by washi paper and shoji screens — diffused light that softens any room.",
      },
      {
        name: "Mara & Sons",
        location: "Kigali, Rwanda",
        discipline: "Woven & Sustainable Fixtures",
        bio: "Local artisans weaving sisal and reclaimed brass into warm, contemporary shades made entirely by hand.",
      },
      {
        name: "Nordlys Works",
        location: "Copenhagen, Denmark",
        discipline: "Smart & Architectural Lighting",
        bio: "Scandinavian engineers blending warm minimalism with app-controlled, energy-efficient LED systems.",
      },
    ],
  },
  sustainability: {
    eyebrow: "Our Commitment",
    title: "Sustainability",
    body: [
      "At Ajabu Lighting, we believe beautiful lighting and environmental responsibility go hand in hand. We prioritize energy-efficient LED technology, sustainably sourced materials, and minimal-waste packaging across our entire collection.",
      "Every smart light we sell helps reduce energy consumption. Our packaging uses recycled materials, and we offer a fixture recycling program for old lights when you purchase a replacement.",
    ].join("\n\n"),
  },
  careers: {
    eyebrow: "Join Us",
    title: "Careers at Ajabu Lighting",
    body: "We're always looking for passionate people to join our growing team in Kigali. If you love design, technology, and creating exceptional customer experiences, we'd love to hear from you.",
    note: "No open positions at the moment. Send your CV to {store_email} and we'll keep it on file.",
  },
  privacy: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    lastUpdated: "Last updated: April 2026",
    sections: [
      {
        heading: "Information We Collect",
        body: "We collect information you provide when creating an account, placing an order, or contacting us — including name, email, phone number, delivery address, and payment details processed through MTN MoMo.",
      },
      {
        heading: "How We Use Your Data",
        body: "Your data is used to process orders, communicate delivery updates, improve our services, and send promotional offers (with your consent). We never sell your personal information to third parties.",
      },
      {
        heading: "Contact",
        body: "For privacy inquiries, contact us at {store_email}.",
      },
    ],
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms of Service",
    lastUpdated: "Last updated: April 2026",
    sections: [
      {
        heading: "General",
        body: "By using ajabulighting.com you agree to these terms. We reserve the right to update them at any time. Continued use of the site constitutes acceptance of any changes.",
      },
      {
        heading: "Orders & Payments",
        body: "All prices are listed in Rwandan Francs (RWF). Payment is processed via MTN Mobile Money. Orders are confirmed once payment is successfully received.",
      },
      {
        heading: "Returns",
        body: "Items may be returned within 30 days in their original condition and packaging. See our Shipping & Returns page for full details.",
      },
    ],
  },
  footer: {
    blurb:
      "Curated lighting for spaces that deserve to shine. Handpicked fixtures from artisan makers.",
  },
}

export type ContentMap = typeof DEFAULTS
export type SectionKey = keyof ContentMap

export type ContentSection = {
  key: SectionKey
  /** Admin menu label and editor title. */
  title: string
  /** One line for the admin overview. */
  description: string
  /** Where it shows on the site. */
  path: string
  group: "Home page" | "Pages" | "Legal" | "Every page"
  fields: Field[]
}

const pageHeader = (titleHelp?: string): Field[] => [
  { type: "text", key: "eyebrow", label: "Small heading above the title", max: 80 },
  { type: "text", key: "title", label: "Page title", help: titleHelp, max: 120 },
]

const policySections = (help: string): Field => ({
  type: "items",
  key: "sections",
  label: "Sections",
  help,
  itemName: "section",
  titleKey: "heading",
  maxItems: 20,
  fields: [
    { type: "text", key: "heading", label: "Heading", max: 120 },
    { type: "textarea", key: "body", label: "Text", rows: 4, max: 4000, help: PARAGRAPHS_HELP },
  ],
})

export const CONTENT_SECTIONS: ContentSection[] = [
  {
    key: "home",
    title: "Home page",
    description: "Main heading and subheading, buttons, scrolling banner, section titles.",
    path: "/",
    group: "Home page",
    fields: [
      { type: "heading", label: "Top of the page" },
      { type: "text", key: "eyebrow", label: "Small heading above the title", max: 80 },
      { type: "text", key: "titleLine1", label: "Main heading", help: "For example “Light That”.", max: 60 },
      {
        type: "text",
        key: "titleHighlight",
        label: "Main heading, highlighted word",
        help: "Shown on the next line in gold italics, for example “Lives”.",
        max: 40,
      },
      { type: "textarea", key: "subtitle", label: "Subheading", rows: 2, max: 300 },
      { type: "text", key: "primaryButton", label: "Gold button (opens the shop)", max: 40 },
      { type: "text", key: "secondaryButton", label: "Outline button (opens Our Story)", max: 40 },
      { type: "heading", label: "Scrolling banner" },
      {
        type: "lines",
        key: "marquee",
        label: "Banner messages",
        help: `${LINES_HELP} They scroll across the page under the heading.`,
        maxItems: 12,
      },
      { type: "heading", label: "Section titles" },
      { type: "text", key: "categoriesEyebrow", label: "Categories: small heading", max: 60 },
      { type: "text", key: "categoriesTitle", label: "Categories: title", max: 80 },
      { type: "text", key: "categoriesLink", label: "Categories: link text", max: 40 },
      { type: "text", key: "featuredEyebrow", label: "Featured products: small heading", max: 60 },
      { type: "text", key: "featuredTitle", label: "Featured products: title", max: 80 },
      { type: "text", key: "featuredLink", label: "Featured products: link text", max: 40 },
    ],
  },
  {
    key: "promises",
    title: "Store promises",
    description: "The warranty, delivery, returns and support boxes on the home page.",
    path: "/",
    group: "Home page",
    fields: [
      {
        type: "items",
        key: "items",
        label: "Promises",
        help: "Shown side by side near the bottom of the home page. Four fit best.",
        itemName: "promise",
        titleKey: "title",
        maxItems: 8,
        fields: [
          { type: "icon", key: "icon", label: "Icon" },
          { type: "text", key: "title", label: "Title", max: 60 },
          { type: "text", key: "text", label: "Short description", max: 140 },
        ],
      },
    ],
  },
  {
    key: "testimonials",
    title: "Testimonials",
    description: "Customer quotes on the home page, taken from approved reviews.",
    path: "/",
    group: "Home page",
    fields: [
      { type: "toggle", key: "show", label: "Show testimonials on the home page" },
      { type: "text", key: "heading", label: "Heading", max: 80 },
      { type: "number", key: "count", label: "How many to show", min: 1, max: 6 },
      {
        type: "number",
        key: "minRating",
        label: "Only reviews with at least this many stars",
        min: 1,
        max: 5,
      },
      {
        type: "toggle",
        key: "showNames",
        label: "Show the reviewer's first name",
        help: "Off: shown as “Verified customer”. Reviews don't show names on product pages, so ask before turning this on.",
      },
    ],
  },
  {
    key: "newsletter",
    title: "Newsletter",
    description: "Sign-up box text, welcome email, subscribers, and sending a newsletter.",
    path: "/",
    group: "Home page",
    fields: [
      { type: "heading", label: "Sign-up box (home page)" },
      { type: "text", key: "title", label: "Title", max: 80 },
      { type: "textarea", key: "subtitle", label: "Text under the title", rows: 2, max: 300 },
      { type: "text", key: "buttonLabel", label: "Button", max: 30 },
      { type: "text", key: "successMessage", label: "Message after signing up", max: 160 },
      {
        type: "heading",
        label: "Welcome email",
        help: "Sent once to each new subscriber, with a link to unsubscribe.",
      },
      { type: "text", key: "welcomeSubject", label: "Subject", max: 120 },
      { type: "textarea", key: "welcomeBody", label: "Message", rows: 4, max: 3000, help: PARAGRAPHS_HELP },
    ],
  },
  {
    key: "about",
    title: "Our Story",
    description: "The About page.",
    path: "/about",
    group: "Pages",
    fields: [
      ...pageHeader(),
      { type: "textarea", key: "body", label: "Story", rows: 10, max: 8000, help: PARAGRAPHS_HELP },
    ],
  },
  {
    key: "contact",
    title: "Contact & Showroom",
    description: "Email, phone, showroom address, opening hours and map link.",
    path: "/contact",
    group: "Pages",
    fields: [
      ...pageHeader(),
      { type: "textarea", key: "intro", label: "Intro text (optional)", rows: 3, max: 1000 },
      { type: "heading", label: "Contact details" },
      {
        type: "text",
        key: "email",
        label: "Email",
        help: "{store_email} uses the email from Settings → General.",
        max: 120,
      },
      {
        type: "text",
        key: "phone",
        label: "Phone",
        help: "{store_phone} uses the phone from Settings → General.",
        max: 60,
      },
      { type: "heading", label: "Showroom" },
      { type: "text", key: "showroomLabel", label: "Box title", max: 60 },
      {
        type: "textarea",
        key: "showroomAddress",
        label: "Address",
        rows: 3,
        max: 400,
        help: "{store_address} uses the address from Settings → General.",
      },
      { type: "lines", key: "openingHours", label: "Opening hours (optional)", help: `${LINES_HELP} For example “Mon–Sat: 9:00–18:00”.`, maxItems: 10 },
      {
        type: "url",
        key: "mapUrl",
        label: "Map link (optional)",
        help: "Paste a Google Maps link to show a “Get directions” button.",
        placeholder: "https://maps.app.goo.gl/…",
      },
      { type: "heading", label: "Social media" },
      {
        type: "text",
        key: "socialHeading",
        label: "Heading above the WhatsApp, Instagram and Facebook buttons",
        help: "The links themselves are set in Settings → General → Social media.",
        max: 80,
      },
    ],
  },
  {
    key: "shipping",
    title: "Shipping & Returns",
    description: "Delivery times and fees, and the returns policy.",
    path: "/shipping",
    group: "Pages",
    fields: [
      ...pageHeader(),
      {
        type: "items",
        key: "sections",
        label: "Sections",
        itemName: "section",
        titleKey: "heading",
        maxItems: 10,
        fields: [
          { type: "text", key: "heading", label: "Heading", max: 80 },
          { type: "lines", key: "points", label: "Points", help: `${LINES_HELP} Shown as a bulleted list.` },
        ],
      },
    ],
  },
  {
    key: "faq",
    title: "FAQ",
    description: "Questions and answers.",
    path: "/faq",
    group: "Pages",
    fields: [
      ...pageHeader(),
      {
        type: "items",
        key: "items",
        label: "Questions",
        itemName: "question",
        titleKey: "question",
        maxItems: 40,
        fields: [
          { type: "text", key: "question", label: "Question", max: 200 },
          { type: "textarea", key: "answer", label: "Answer", rows: 3, max: 2000, help: PARAGRAPHS_HELP },
        ],
      },
    ],
  },
  {
    key: "installation",
    title: "Installation Guide",
    description: "Installation advice and services.",
    path: "/installation",
    group: "Pages",
    fields: [
      ...pageHeader(),
      { type: "textarea", key: "intro", label: "Intro", rows: 4, max: 3000, help: PARAGRAPHS_HELP },
      {
        type: "items",
        key: "sections",
        label: "Sections",
        itemName: "section",
        titleKey: "heading",
        maxItems: 12,
        fields: [
          { type: "text", key: "heading", label: "Heading", max: 120 },
          { type: "textarea", key: "body", label: "Text", rows: 4, max: 3000, help: PARAGRAPHS_HELP },
        ],
      },
    ],
  },
  {
    key: "designers",
    title: "Designers",
    description: "The designers and studios you work with.",
    path: "/designers",
    group: "Pages",
    fields: [
      ...pageHeader(),
      { type: "textarea", key: "intro", label: "Intro", rows: 3, max: 2000 },
      {
        type: "items",
        key: "items",
        label: "Designers",
        itemName: "designer",
        titleKey: "name",
        maxItems: 24,
        fields: [
          { type: "text", key: "name", label: "Name", max: 100 },
          { type: "text", key: "location", label: "Location", max: 100 },
          { type: "text", key: "discipline", label: "Speciality", max: 100 },
          { type: "textarea", key: "bio", label: "Short bio", rows: 3, max: 600 },
        ],
      },
    ],
  },
  {
    key: "sustainability",
    title: "Sustainability",
    description: "Your environmental commitments.",
    path: "/sustainability",
    group: "Pages",
    fields: [
      ...pageHeader(),
      { type: "textarea", key: "body", label: "Text", rows: 8, max: 6000, help: PARAGRAPHS_HELP },
    ],
  },
  {
    key: "careers",
    title: "Careers",
    description: "Working at the store, and how to apply.",
    path: "/careers",
    group: "Pages",
    fields: [
      ...pageHeader(),
      { type: "textarea", key: "body", label: "Text", rows: 5, max: 4000, help: PARAGRAPHS_HELP },
      { type: "textarea", key: "note", label: "Note at the bottom (e.g. open positions)", rows: 2, max: 1000 },
    ],
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    description: "How customer data is handled.",
    path: "/privacy",
    group: "Legal",
    fields: [
      ...pageHeader(),
      { type: "text", key: "lastUpdated", label: "“Last updated” line", max: 80 },
      policySections("Update the “Last updated” line when you change the policy."),
    ],
  },
  {
    key: "terms",
    title: "Terms of Service",
    description: "The terms customers agree to.",
    path: "/terms",
    group: "Legal",
    fields: [
      ...pageHeader(),
      { type: "text", key: "lastUpdated", label: "“Last updated” line", max: 80 },
      policySections("Update the “Last updated” line when you change the terms."),
    ],
  },
  {
    key: "footer",
    title: "Footer",
    description: "The short description under the logo at the bottom of every page.",
    path: "/",
    group: "Every page",
    fields: [
      { type: "textarea", key: "blurb", label: "Description under the logo", rows: 3, max: 400 },
    ],
  },
]

export const CONTENT_GROUPS = ["Home page", "Pages", "Legal", "Every page"] as const

export function contentDefaults<K extends SectionKey>(key: K): ContentMap[K] {
  return structuredClone(DEFAULTS[key])
}

export function getSection(key: string): ContentSection | undefined {
  return CONTENT_SECTIONS.find((s) => s.key === key)
}

/** store_settings key for a section. */
export const contentSettingKey = (key: SectionKey) => `content.${key}`
