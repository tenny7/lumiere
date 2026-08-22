# Draft note to MTN — integration scope (Collection only)

> Short message to send MTN alongside the completed UAT form. Fill `[…]`.

---

Subject: Ajabu Lighting — API integration scope (Collections only) + UAT results

Dear [MTN contact name],

Thank you for the onboarding requirements. Please find our completed **UAT form**
attached, along with our business description and customer user-journey document.

**Scope of our integration:** Ajabu Lighting is an e-commerce storefront that
**collects** payments from customers for their own orders. We therefore integrate
the **Collection API (Request-to-Pay)** only. We do **not** disburse or remit
funds, so the **Disbursement** and **Remittance** sections of the UAT are **not
applicable** and are marked *Not Tested*.

**Collection UAT status:** the core Collection flow is fully tested and passing in
sandbox — Create API User, Create API Key, Token, Request-to-Pay, and
Request-to-Pay Status (success, failure reasons, and pending states all verified),
including an end-to-end payment on our live deployment.

**Two Collection endpoints we do not use** — *Account Status Check* and *Account
Balance Check* — are not part of our checkout flow (we collect via Request-to-Pay).
When we probed them in sandbox they returned `NOT_ALLOWED_TARGET_ENVIRONMENT` and
`RESOURCE_NOT_FOUND` respectively for our subscription. Could you confirm whether
these are required for a Collections-only integration, and if so, whether they need
to be enabled on our sandbox subscription?

**On commercials:** your note referenced a Disbursement fee (120 RWF). As we only
collect, please confirm we can proceed on **Collections** commercials alone
(2.36% VAT inclusive) and drop Disbursement from our agreement — unless you advise
otherwise.

We're also compiling the remaining documents (RDB certificate, NCSA data-protection
registration). Please let us know the next step to progress to production.

Kind regards,
[Your name]
Ajabu Lighting · [phone] · [email]
