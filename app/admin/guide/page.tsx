import Link from "next/link"
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  CircleHelp,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Rocket,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Ticket,
  TriangleAlert,
  Users,
  Activity,
} from "lucide-react"
import { GuideToc, type GuideTocSection } from "@/components/admin/guide/guide-toc"
import {
  Bullets,
  Callout,
  Flow,
  GuideH3,
  GuideSection,
  InfoTable,
  Steps,
  UI,
} from "@/components/admin/guide/guide-parts"

export const metadata = { title: "Admin Guide — Ajabu Lighting" }

const SECTIONS: GuideTocSection[] = [
  { id: "start", title: "Daily routine", keywords: "start overview checklist morning" },
  { id: "access", title: "Who can use the admin", keywords: "roles permissions access admin super eagle maintainer sales agent inventory manager staff" },
  { id: "dashboard", title: "Dashboard", keywords: "revenue today stats cards momo collected" },
  { id: "orders", title: "Orders", keywords: "status ship tracking cancel invoice receipt mark paid badge" },
  { id: "payments", title: "Payments & verifying MoMo", keywords: "momo transfer verify cash on delivery cod ussd paid" },
  { id: "support", title: "Customer support chat", keywords: "messages chat block unblock typing online" },
  { id: "reviews", title: "Reviews", keywords: "approve hide delete moderation" },
  { id: "products", title: "Products", keywords: "sku stock images price sale featured active delete" },
  { id: "categories", title: "Categories", keywords: "category image sort" },
  { id: "customers", title: "Customers", keywords: "users accounts roles online" },
  { id: "coupons", title: "Coupons", keywords: "discount code percentage fixed free shipping" },
  { id: "analytics", title: "Analytics & search", keywords: "charts revenue top products search" },
  { id: "activity", title: "Activity feed", keywords: "log history crm audit" },
  { id: "settings", title: "Settings", keywords: "store delivery fee vat momo number ussd payment methods team social media whatsapp instagram facebook" },
  { id: "notifications", title: "Notifications & sounds", keywords: "bell badge sound volume toast alerts" },
  { id: "emails", title: "Emails the store sends", keywords: "email confirmation shipped notice" },
  { id: "faq", title: "Troubleshooting", keywords: "help problem faq stuck spam" },
  { id: "limits", title: "Known limitations", keywords: "issues gaps not supported" },
]

export default function AdminGuidePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-500 text-black">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Guide</h1>
          <p className="text-sm text-muted-foreground">
            How every part of the Ajabu Lighting admin works: what each screen
            shows, what each button does, and the everyday tasks step by step.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="lg:order-2">
          <GuideToc sections={SECTIONS} />
        </div>

        <article className="min-w-0 max-w-3xl space-y-14 lg:order-1">
          {/* ───────────────────────── Daily routine ───────────────────────── */}
          <GuideSection
            id="start"
            icon={Rocket}
            title="Daily routine"
            summary="The few things to check each day to keep orders moving."
          >
            <Steps
              items={[
                <>
                  Look at the amber number on <UI>Orders</UI> in the sidebar
                  (the bell shows the same number). It counts{" "}
                  <strong>orders waiting for payment</strong>: MoMo transfers to
                  verify and Cash on Delivery orders not yet collected.
                </>,
                <>
                  <strong>Verify MoMo transfers.</strong> For each &ldquo;Verify
                  MoMo transfer&rdquo; email or pop-up, check the money reached
                  your MoMo account, then click <UI>Mark as paid</UI>. See{" "}
                  <a href="#payments" className="text-amber-600 underline">
                    Payments
                  </a>
                  .
                </>,
                <>
                  <strong>Ship paid orders.</strong> Move confirmed orders to{" "}
                  <UI>Processing</UI> while you prepare them, then{" "}
                  <UI>Shipped</UI> with tracking details. The customer is
                  emailed automatically.
                </>,
                <>
                  <strong>Answer support messages.</strong> The number on{" "}
                  <UI>Support</UI> is unread customer messages.
                </>,
                <>
                  <strong>Approve reviews.</strong> The number on{" "}
                  <UI>Reviews</UI> is reviews waiting for approval. Customers
                  only see approved reviews.
                </>,
              ]}
            />
            <Callout tone="tip" title="Keep the admin open in a tab">
              New orders, transfers, reviews and messages pop up in the corner
              with a chime while any admin page is open, so you don&apos;t have
              to refresh.
            </Callout>
          </GuideSection>

          {/* ───────────────────────── Access ───────────────────────── */}
          <GuideSection
            id="access"
            icon={ShieldCheck}
            title="Who can use the admin"
            summary="Roles decide what each account can do."
          >
            <InfoTable
              head={["Role", "Can open the admin?", "What it's for"]}
              rows={[
                ["Customer", "No", "Shops on the site. Every new sign-up starts here."],
                ["Admin", "Yes", "Runs the store: orders, products, customers, settings."],
                ["Eagle admin", "Yes", "The site maintainer (website, code and database). A super admin that nobody can demote, block or delete from the website."],
                ["Super admin", "Yes", "Everything an admin can do, plus granting or removing super admin."],
                ["Sales agent", "Yes, limited", "Orders (incl. changing status and Mark as paid), Support, Reviews, Customers (view only)."],
                ["Inventory manager", "Yes, limited", "Products and Categories, and viewing Orders."],
              ]}
            />
            <p className="text-muted-foreground">
              Limited staff only see the menu items they can use, and
              revenue figures are shown to admins only. If they open a page
              they don&apos;t have access to, they&apos;re taken back to the
              Dashboard.
            </p>
            <Bullets
              items={[
                <>
                  Change roles in <UI>Settings</UI> → <UI>Team</UI> or on the{" "}
                  <UI>Customers</UI> page.
                </>,
                <>
                  <strong>Nobody can change their own role.</strong> This stops
                  you locking yourself out by accident. Another admin has to do
                  it.
                </>,
                <>Only a super admin can make someone a super admin, or remove it.</>,
                <>
                  The <UI>Eagle Admin</UI> account shows a badge instead of a
                  role dropdown. Nobody can change it from the admin, including
                  other super admins. It can only be changed in the database.
                </>,
                <>
                  These rules are enforced by the database, not just the
                  screens, so they can&apos;t be bypassed from a browser.
                </>,
              ]}
            />
          </GuideSection>

          {/* ───────────────────────── Dashboard ───────────────────────── */}
          <GuideSection
            id="dashboard"
            icon={LayoutDashboard}
            title="Dashboard"
            summary="A snapshot of today. “Today” starts at midnight Kigali time."
          >
            <InfoTable
              head={["Card", "What it shows"]}
              rows={[
                ["Today's Revenue", "Money actually received today (all payment methods), leaving out orders later cancelled or refunded. Admins only."],
                ["Orders Today", "Orders placed today. Abandoned checkouts don't count."],
                ["New Customers Today", "Customer accounts created today."],
                ["Awaiting Payment", "Orders placed but not paid yet. Same number as the Orders badge."],
                ["Mobile Money received", "All Mobile Money received: MoMo app checkout plus verified MoMo transfers, with today's amount and an estimate after MTN's 2.36% fee on app payments. Not your live wallet balance. Admins only."],
                ["Recent Orders", "The latest 6 orders. Click one to open it."],
                ["Quick Actions", "Shortcuts to add a product, see orders, products at or below their Low Stock Alert, and analytics. Each person only sees the ones they can use."],
              ]}
            />
            <Callout tone="info" title="“Get your store ready” checklist">
              Shown until you&apos;ve added a product, featured one on the
              homepage and filled in your store phone in Settings. Close it
              with the ✕ to hide it on that browser.
            </Callout>
          </GuideSection>

          {/* ───────────────────────── Orders ───────────────────────── */}
          <GuideSection
            id="orders"
            icon={ShoppingCart}
            title="Orders"
            summary="Every order, its payment, and moving it to the customer."
          >
            <GuideH3>The order journey</GuideH3>
            <Flow
              steps={[
                { label: "Pending", note: "placed, not paid yet" },
                { label: "Confirmed", note: "paid" },
                { label: "Processing", note: "being prepared" },
                { label: "Shipped", note: "on its way" },
                { label: "Delivered" },
              ]}
            />
            <p className="text-muted-foreground">
              An order can also end as <UI>Cancelled</UI> or{" "}
              <UI>Refunded</UI>. A pending Cash on Delivery order shows as
              &ldquo;Order Placed · Cash on Delivery&rdquo; in green.
            </p>

            <GuideH3>The Orders list</GuideH3>
            <p>
              Shows the 50 most recent orders with customer, total, order
              status, payment status and date. Click any row to open the order.
            </p>

            <GuideH3>Inside an order</GuideH3>
            <Bullets
              items={[
                <><strong>Order Items:</strong> products, quantities and the totals (subtotal, discount, delivery, VAT/tax, total).</>,
                <><strong>Payment Information:</strong> how they paid, its status, the amount, and for MoMo transfers the number it was <em>Sent from</em>.</>,
                <><strong>Customer</strong> and <strong>Shipping Address</strong>.</>,
                <><UI>Invoice</UI> opens the printable invoice or receipt in a new tab.</>,
                <><UI>Open support chat</UI> to message the customer about this order.</>,
              ]}
            />

            <GuideH3>Changing the status</GuideH3>
            <Steps
              items={[
                <>In <UI>Update Status</UI>, pick the new status from the dropdown.</>,
                <>
                  For <UI>Shipped</UI>, fill in the carrier, tracking number and
                  (optionally) tracking link. They go into the customer&apos;s
                  shipping email.
                </>,
                <>Click <UI>Update Status</UI>.</>,
              ]}
            />
            <InfoTable
              head={["From", "Can move to"]}
              rows={[
                ["Pending", "Confirmed, Processing, Shipped, Delivered, Cancelled"],
                ["Confirmed", "Processing, Shipped, Delivered, Cancelled, Refunded"],
                ["Processing", "Shipped, Delivered, Cancelled, Refunded"],
                ["Shipped", "Delivered, Refunded"],
                ["Delivered", "Refunded"],
                ["Cancelled", "Pending, Confirmed (to undo a cancellation)"],
                ["Refunded", "Final. No further changes."],
              ]}
            />
            <Callout tone="info" title="What cancelling or refunding does">
              For a paid order, <UI>Cancelled</UI> or <UI>Refunded</UI> puts
              the items back in stock automatically, and restoring the order
              takes them out again. It doesn&apos;t send money back or email
              the customer: refund by MoMo yourself and let them know in
              support chat.
            </Callout>
            <p>
              Setting an order to <UI>Delivered</UI> emails the customer, with
              a link to leave a review.
            </p>

            <GuideH3>Mark as paid</GuideH3>
            <p>
              Use it when money arrived outside the automatic MoMo checkout: a
              verified MoMo transfer, or cash collected on delivery. It:
            </p>
            <Bullets
              items={[
                <>marks the payment Successful and moves a Pending order to Confirmed,</>,
                <>reduces stock for the items,</>,
                <>counts the use of any coupon on the order,</>,
                <>emails the customer &ldquo;Order Confirmed&rdquo; (not for Cash on Delivery, which is already delivered by then),</>,
                <>drops the Orders badge by one.</>,
              ]}
            />
            <Callout tone="warning" title="Only use Mark as paid once the money is really there">
              It can&apos;t be undone from the screen, and it reduces stock.
              It isn&apos;t available on cancelled or refunded orders: set the
              order back to Pending or Confirmed first.
            </Callout>

            <GuideH3>Invoice or receipt?</GuideH3>
            <p>
              The same page becomes a <strong>Receipt</strong> (green
              &ldquo;Paid&rdquo;, with the payment date and method) once the
              order is paid. Before that it&apos;s an <strong>Invoice</strong>{" "}
              marked &ldquo;Payment pending&rdquo; and &ldquo;not proof of
              payment&rdquo;. You can print it, or click{" "}
              <UI>Download Invoice (PDF)</UI> / <UI>Download Receipt (PDF)</UI>.
            </p>

            <GuideH3>Abandoned checkouts are tidied automatically</GuideH3>
            <p>
              An order is created as soon as a customer clicks &ldquo;Continue
              to Payment&rdquo;, even if they never pay. Every morning (05:00
              Kigali), orders still pending after 24 hours that were never paid
              (abandoned checkouts, and MoMo app payments the customer never
              approved) are set to Cancelled. Cash on Delivery orders and MoMo
              transfers waiting for you are <strong>never</strong> cancelled
              this way.
            </p>
          </GuideSection>

          {/* ───────────────────────── Payments ───────────────────────── */}
          <GuideSection
            id="payments"
            icon={CreditCard}
            title="Payments & verifying MoMo"
            summary="The three ways customers pay, and what you do for each."
          >
            <InfoTable
              head={["Method", "How the customer pays", "What you do"]}
              rows={[
                [
                  "MoMo Transfer",
                  "Sends the amount to your MoMo number (or dials your USSD code), then taps “I have paid”.",
                  "Check the money arrived, then Mark as paid.",
                ],
                [
                  "Cash on Delivery",
                  "Pays cash when the order arrives.",
                  "Deliver, collect the cash, then Mark as paid.",
                ],
                [
                  "MoMo app checkout (MTN, if switched on)",
                  "Approves a payment prompt on their phone.",
                  "Nothing. It confirms itself when MTN reports success.",
                ],
              ]}
            />

            <GuideH3>How to verify a MoMo transfer</GuideH3>
            <Steps
              items={[
                <>
                  Open the order (from the &ldquo;Verify MoMo transfer&rdquo;
                  email, the pop-up, or the Orders list). Note the{" "}
                  <strong>Amount</strong>, the <strong>Sent from</strong> number
                  and the time it was placed.
                </>,
                <>
                  On the phone that receives your MoMo, check the MTN SMS, the
                  MoMo app history, or dial <UI>*182#</UI> for your statement.
                </>,
                <>
                  Match it: the amount is <strong>exactly</strong> the order
                  total, the sender matches (or the name and time do), and it
                  arrived after the order was placed.
                </>,
                <>
                  If it matches, click <UI>Mark as paid</UI>. If not, wait a
                  little, or ask the customer in <UI>Open support chat</UI>.
                </>,
              ]}
            />
            <Callout tone="warning" title="Never trust a screenshot">
              Fake &ldquo;payment received&rdquo; screenshots and SMS messages
              are a common scam. Only trust what you see in your own MoMo
              account.
            </Callout>
          </GuideSection>

          {/* ───────────────────────── Support ───────────────────────── */}
          <GuideSection
            id="support"
            icon={MessageSquare}
            title="Customer support chat"
            summary="One conversation per order, by chat and email."
          >
            <Bullets
              items={[
                <>
                  <UI>Support</UI> lists every order that has messages, newest
                  first, with an &ldquo;N new&rdquo; label for unread ones.
                  Search by order number, name, email or message text.
                </>,
                <>
                  To start a conversation, open the order and click{" "}
                  <UI>Open support chat</UI>.
                </>,
                <>
                  Type your reply and press <UI>Enter</UI> (Shift+Enter for a
                  new line). The customer sees it in their account and also gets
                  it by email.
                </>,
                <>
                  You&apos;ll see &ldquo;Customer is typing…&rdquo; while they
                  write, and a <span className="text-emerald-600">green dot</span>{" "}
                  when they&apos;re online (&ldquo;Last seen…&rdquo; otherwise).
                </>,
                <>Opening a conversation marks the customer&apos;s messages as read.</>,
              ]}
            />
            <GuideH3>Stopping abuse</GuideH3>
            <Bullets
              items={[
                <>
                  <UI>Block messaging</UI> stops a customer sending new messages
                  on all their orders. They can still read old ones. Click{" "}
                  <UI>Unblock messaging</UI> to undo. Staff can&apos;t be
                  blocked.
                </>,
                <>
                  Customers are automatically limited to 12 messages a minute.
                </>,
              ]}
            />
            <Callout tone="info" title="What customers see">
              Customers see &ldquo;Support team online now&rdquo; when any of
              the team is active, or &ldquo;Support team away — we&apos;ll reply
              by email&rdquo;. They never see who.
            </Callout>
          </GuideSection>

          {/* ───────────────────────── Reviews ───────────────────────── */}
          <GuideSection
            id="reviews"
            icon={Star}
            title="Reviews"
            summary="Customer reviews stay hidden until you approve them."
          >
            <Bullets
              items={[
                <><strong>Pending approval</strong>: new reviews. <UI>Approve</UI> publishes one on the product page.</>,
                <><strong>Published</strong>: live reviews. <UI>Hide</UI> moves one back to pending.</>,
                <><UI>Delete</UI> removes a review permanently.</>,
              ]}
            />
          </GuideSection>

          {/* ───────────────────────── Products ───────────────────────── */}
          <GuideSection
            id="products"
            icon={Package}
            title="Products"
            summary="Adding, editing and stocking your catalog."
          >
            <GuideH3>Add a product</GuideH3>
            <Steps
              items={[
                <><UI>Products</UI> → <UI>Add Product</UI>.</>,
                <>Fill in <strong>Product Name</strong> and <strong>Base Price (RWF)</strong> (required), plus the descriptions.</>,
                <>Pick a <strong>Category</strong>. The <strong>SKU</strong> fills itself in (e.g. LUM-CHAN-001), or click <UI>Generate</UI>.</>,
                <>Set <strong>Stock Quantity</strong> and tick <UI>Active</UI> to show it on the site, and <UI>Featured</UI> to put it on the homepage.</>,
                <>Click <UI>Create Product</UI>.</>,
                <><strong>Then add photos:</strong> open the product again from the list and use <UI>Upload Image</UI> (JPG, PNG, WEBP or GIF, up to 5 MB).</>,
              ]}
            />
            <InfoTable
              head={["Field", "Meaning"]}
              rows={[
                ["Sale Price", "Leave empty when not on sale. When set, customers see it with the base price crossed out."],
                ["Cost Price", "What it costs you. Never shown to customers."],
                ["Low Stock Alert", "Stock at or below this shows yellow in the list, and “Low Stock — n left” on the site."],
                ["Specifications", "Optional details (wattage, lumens, colour temperature…) shown on the product page."],
                ["Active", "Off = hidden from the site (listed as Draft)."],
              ]}
            />
            <Callout tone="tip" title="Deactivate instead of deleting">
              A product that&apos;s ever been ordered can&apos;t be deleted.
              Untick <UI>Active</UI> to hide it instead.
            </Callout>
          </GuideSection>

          {/* ───────────────────────── Categories ───────────────────────── */}
          <GuideSection
            id="categories"
            icon={FolderTree}
            title="Categories"
            summary="Group products so customers can browse."
          >
            <Bullets
              items={[
                <><UI>Add Category</UI>: give it a <strong>Name</strong> (the web address is filled in from it), a description, and a <strong>Category Image</strong> for the homepage tiles.</>,
                <><strong>Sort Order</strong>: lower numbers appear first.</>,
                <><UI>Active</UI> off hides the category.</>,
                <>Deleting a category keeps its products; they just become uncategorised.</>,
              ]}
            />
          </GuideSection>

          {/* ───────────────────────── Customers ───────────────────────── */}
          <GuideSection
            id="customers"
            icon={Users}
            title="Customers"
            summary="Every account, their orders, and their role."
          >
            <Bullets
              items={[
                <>Shows the newest 100 accounts with phone, orders placed, total spent (paid orders only) and join date.</>,
                <>Filter with <UI>Customers</UI>, <UI>Staff</UI> (sales agents and inventory managers) or <UI>Admins</UI> (including super admins).</>,
                <>The dot beside each name is green when they&apos;re online.</>,
                <>The <UI>Role</UI> dropdown changes someone&apos;s access (see <a href="#access" className="text-amber-600 underline">Who can use the admin</a>).</>,
              ]}
            />
          </GuideSection>

          {/* ───────────────────────── Coupons ───────────────────────── */}
          <GuideSection
            id="coupons"
            icon={Ticket}
            title="Coupons"
            summary="Discount codes customers type at checkout."
          >
            <InfoTable
              head={["Type", "Effect"]}
              rows={[
                ["Percentage", "Takes a % off the items total."],
                ["Fixed Amount", "Takes a set RWF amount off."],
                ["Free Shipping", "Removes the delivery fee."],
              ]}
            />
            <Bullets
              items={[
                <><strong>Code</strong> is saved in capitals; each code must be unique.</>,
                <><strong>Min Order</strong> (optional): the items total needed before discount.</>,
                <><strong>Max Uses</strong>: leave empty for unlimited.</>,
                <>One coupon per order. A use is counted when the order is actually placed (or paid), so abandoned checkouts don&apos;t use it up.</>,
              ]}
            />
            <Callout tone="warning" title="Expiry date tip">
              A coupon stops working at 2 am (Kigali) <strong>on</strong> its{" "}
              <strong>Expires</strong> date, not at the end of that day. To run
              a promotion through 31 December, set Expires to 1 January.
            </Callout>
          </GuideSection>

          {/* ───────────────────────── Analytics ───────────────────────── */}
          <GuideSection
            id="analytics"
            icon={BarChart3}
            title="Analytics & search"
            summary="Trends over the last 30 days, and finding anything fast."
          >
            <Bullets
              items={[
                <><strong>30-Day Revenue</strong>: money actually received in the last 30 days, with the number of paid orders. Also <strong>Total Orders</strong>, <strong>New Customers</strong> and <strong>Customer Growth</strong> (vs last month).</>,
                <><strong>Daily Revenue</strong> (last 14 days, by Kigali day), <strong>Orders by Status</strong>, and <strong>Collections by Method</strong>: money received, split by MoMo app, MoMo Transfer and Cash on Delivery.</>,
                <><strong>Top Selling Products</strong> from paid orders in the last 30 days.</>,
              ]}
            />
            <GuideH3>Search</GuideH3>
            <p>
              Type in the search box at the top of any admin page and press{" "}
              <UI>Enter</UI>. It finds orders (by number), products (by name)
              and customers (by name or email).
            </p>
          </GuideSection>

          {/* ───────────────────────── Activity ───────────────────────── */}
          <GuideSection
            id="activity"
            icon={Activity}
            title="Activity feed"
            summary="A log of changes made across the admin."
          >
            <p>
              <UI>Activity</UI> lists the latest 100 changes: products,
              categories, coupons, settings, new orders, order status changes
              and role changes, with who did it and when. Changes made
              automatically (or by order actions) show as &ldquo;System&rdquo;.
            </p>
          </GuideSection>

          {/* ───────────────────────── Settings ───────────────────────── */}
          <GuideSection
            id="settings"
            icon={Settings}
            title="Settings"
            summary="Store details, prices and payments, and your team."
          >
            <GuideH3>General</GuideH3>
            <p>
              Store name, email, phone and address. These appear at the top of
              every invoice and receipt, so keep them up to date.
            </p>
            <p>
              <strong>Social media</strong>: your WhatsApp number, Instagram
              and Facebook. They show as icons in the site footer and as
              buttons on the Contact page. Type a username or number, or paste
              the link. Under each box you&apos;ll see the exact link
              customers will open, so click it to check it&apos;s yours. Leave
              a box empty to hide that one. The site shows the change the next
              time a page is opened; refresh once if you still see the old one.
            </p>

            <GuideH3>Payments</GuideH3>
            <InfoTable
              head={["Setting", "What it does"]}
              rows={[
                ["Standard Delivery Fee (RWF)", "Added to every order below the free-shipping threshold."],
                ["Free Shipping Threshold (RWF)", "Items total at or above this ships free. 0 = never free."],
                ["VAT Rate (%)", "Added on top of the items total (after discount). 0 = no VAT."],
                ["MoMo Number", "Where MoMo transfers go. Leave blank to hide MoMo Transfer at checkout."],
                ["MoMo Account Name", "Shown under the number so customers know they're paying you."],
                ["MoMo USSD code", "Optional dial code shown at checkout. Type {amount} where the order total goes, e.g. *182*1*1*07XXXXXXXX*{amount}#. Test it yourself first."],
                ["Payment Methods switches", "Turn each method on or off at checkout. Saves instantly; at least one must stay on."],
              ]}
            />
            <Callout tone="info" title="How the checkout total is worked out">
              Items − discount, then + VAT on that, then + delivery (free above
              the threshold or with a free-shipping coupon). Rounded to whole
              francs.
            </Callout>
            <Callout tone="tip" title="Which payment switches to use">
              The switches are <UI>MTN Mobile Money</UI> (automatic MoMo app
              checkout, needs the MTN API set up), <UI>MoMo Transfer</UI> and{" "}
              <UI>Cash on Delivery</UI>. MoMo Transfer and Cash on Delivery
              need nothing beyond your MoMo number.
            </Callout>

            <GuideH3>Team</GuideH3>
            <Steps
              items={[
                <>
                  To add someone, ask them to sign up on the site first, then
                  find them under <UI>Add a team member</UI> (name or email).
                </>,
                <>Choose their role. Granting Admin asks you to confirm.</>,
                <>
                  They appear under <UI>Current team</UI>. To remove access, set
                  them back to <UI>Customer</UI>.
                </>,
              ]}
            />
            <p>
              The <UI>All users</UI> panel on the right lists everyone, online
              people first, with &ldquo;Last seen…&rdquo; for the rest. Filter
              it, or switch to <UI>Online</UI> to see who&apos;s around.
            </p>
          </GuideSection>

          {/* ───────────────────────── Notifications ───────────────────────── */}
          <GuideSection
            id="notifications"
            icon={Bell}
            title="Notifications & sounds"
            summary="How the admin tells you something needs attention."
          >
            <InfoTable
              head={["Where", "What the number means"]}
              rows={[
                ["Orders (sidebar) and the bell", "Orders placed but not paid yet: MoMo transfers to verify and Cash on Delivery to collect."],
                ["Support (sidebar)", "Unread customer messages."],
                ["Reviews (sidebar)", "Reviews waiting for approval (including ones you've hidden)."],
              ]}
            />
            <GuideH3>Pop-ups and the chime</GuideH3>
            <p>
              While an admin page is open, a pop-up with a <UI>View</UI> button
              appears for: a new MoMo transfer to verify, a new Cash on Delivery
              order, an order paid through the MoMo app, a new review, and a new
              support message. Each person only gets alerts for areas they can
              open (inventory managers don&apos;t get support alerts, for
              example).
            </p>
            <p>
              Click the bell to turn <UI>Sound alerts</UI> on or off and set the
              volume. This only controls the chime (pop-ups always show) and is
              saved per device.
            </p>
            <Callout tone="tip" title="No chime?">
              Browsers block sound until you&apos;ve clicked somewhere on the
              page once. Click anywhere in the admin after opening it.
            </Callout>
          </GuideSection>

          {/* ───────────────────────── Emails ───────────────────────── */}
          <GuideSection
            id="emails"
            icon={Mail}
            title="Emails the store sends"
            summary="Sent automatically from info@ajabulighting.com. Replies come back to that inbox."
          >
            <InfoTable
              head={["Email", "Goes to", "When"]}
              rows={[
                ["Order Confirmed", "Customer", "A MoMo app payment succeeds, or you Mark as paid (not Cash on Delivery)."],
                ["Payment notice received", "Customer", "They tap “I have paid” for a MoMo transfer."],
                ["Verify MoMo transfer", "All admins", "Same moment: check the money and mark it paid."],
                ["New order", "All admins", "A Cash on Delivery order is placed, or a MoMo app payment succeeds."],
                ["Your order has shipped", "Customer", "You set an order to Shipped (includes tracking if entered)."],
                ["Your order has been delivered", "Customer", "You set an order to Delivered (asks for a review)."],
                ["Message about your order", "Customer", "You reply in support chat."],
                ["New support message", "All admins", "A customer sends a support message."],
                ["Welcome to Ajabu Lighting", "New customer", "They sign up."],
                ["New contact message", "Store inbox", "Someone uses the Contact page form."],
              ]}
            />
            <p className="text-muted-foreground">
              Sign-up confirmations, sign-in links and password resets are sent
              by the login system (Supabase), using the email templates and
              sender set in your Supabase dashboard.
            </p>
          </GuideSection>

          {/* ───────────────────────── FAQ ───────────────────────── */}
          <GuideSection
            id="faq"
            icon={CircleHelp}
            title="Troubleshooting"
            summary="Common questions and what to do."
          >
            <InfoTable
              head={["Problem", "What to do"]}
              rows={[
                ["Customer says they paid but nothing arrived", "Don't Mark as paid. Ask them for the MoMo transaction ID in support chat and check your MoMo statement."],
                ["Customer didn't get an email", "Ask them to check Spam/Promotions. You can always reach them in support chat."],
                ["An order is stuck in Pending", "It's waiting for payment. Verify the transfer or collect the cash, then Mark as paid."],
                ["The role dropdown is greyed out", "You can't change your own role, and only a super admin can change a super admin."],
                ["Someone shows an Eagle Admin badge instead of a role", "That's the site maintainer's account. It can't be changed or removed from the admin."],
                ["A menu item is missing, or a page sends me back to the Dashboard", "Your role doesn't include that area. Ask an admin to change your role."],
                ["There's no Mark as paid button", "The order is Cancelled or Refunded, or already paid. Set it back to Pending or Confirmed first if the customer really paid."],
                ["“Failed to delete product”", "It has been ordered before. Untick Active to hide it instead."],
                ["Everyone's dot is grey", "Nobody has the site open right now. Dots update every 30 seconds."],
                ["No pop-up for a new order", "Pop-ups only appear while an admin page is open. Check the Orders badge and your email."],
              ]}
            />
          </GuideSection>

          {/* ───────────────────────── Known limitations ───────────────────────── */}
          <GuideSection
            id="limits"
            icon={TriangleAlert}
            title="Known limitations"
            summary="Things the admin can't do yet, and the workaround for each."
          >
            <InfoTable
              head={["Not available yet", "Workaround"]}
              rows={[
                ["Product variants (sizes, colours)", "Create each variant as its own product."],
                ["Choosing the main product photo or re-ordering photos", "Photos show in the order you uploaded them, and the first is the main one. Delete and re-upload to change the order."],
                ["Searching or filtering the Orders list", "Use the search box at the top of the page."],
                ["Sending refunds automatically", "Refund by MoMo yourself; the order's stock is restored when you set it to Refunded."],
                ["Emails for Cancelled or Refunded orders", "Message the customer in support chat."],
              ]}
            />
            <p className="flex items-center gap-2 text-muted-foreground">
              <Boxes className="h-4 w-4" />
              Need something here? Ask your developer, or{" "}
              <Link href="/admin/settings" className="text-amber-600 underline">
                review your settings
              </Link>
              .
            </p>
          </GuideSection>
        </article>
      </div>
    </div>
  )
}
