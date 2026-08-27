# Ajabu Lighting — Supabase auth email templates

Branded (dark theme + amber) HTML for the transactional auth emails Supabase
sends. These are **dashboard config**, not app code — paste them into Supabase.

## How to apply

1. Supabase Dashboard → **Authentication → Email Templates**.
2. Pick a template (dropdown at the top), open the corresponding file below,
   copy its **entire contents**, and paste into the **Message body (HTML)** field.
3. Save. Repeat for each.

| Supabase template | File | Link type / lands on |
| --- | --- | --- |
| Confirm signup | [confirm-signup.html](confirm-signup.html) | `type=signup` → home, signed in |
| Magic Link | [magic-link.html](magic-link.html) | `type=magiclink` → home, signed in |
| Reset Password | [reset-password.html](reset-password.html) | `type=recovery` → `/reset-password` |

## Prerequisites (one time)

Under **Authentication → URL Configuration**:

- **Site URL:** `https://ajabulighting.com` — the templates use `{{ .SiteURL }}`,
  so this is what makes the link domain correct (not `localhost`).
- **Redirect URLs** allow-list: `https://ajabulighting.com/**` and
  `http://localhost:3000/**`.

## Why these use `/auth/confirm`

The links hit [`app/auth/confirm/route.ts`](../../app/auth/confirm/route.ts),
which verifies the `token_hash` **server-side** (`verifyOtp`). Nothing is stored
in the requesting browser, so the email works when opened on **any device** —
unlike the PKCE `code` flow at `app/auth/callback/route.ts` (kept as a fallback),
which must be opened in the same browser that started the flow.

**Note:** `{{ .TokenHash }}` and `{{ .SiteURL }}` are Supabase template variables —
leave them exactly as written; Supabase fills them in when it sends the email.
