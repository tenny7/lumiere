# Cover email to MTN — API integration submission

> Fill the `[…]` placeholders before sending.

---

**To:** [MTN contact name / email]
**Subject:** Ajabu Lighting — API integration documents (Collections)

Dear [MTN contact name],

Thank you for the onboarding requirements. We have completed the sandbox testing
and are submitting the documents below to progress our **Collection API**
integration.

**Scope:** Ajabu Lighting is an e-commerce storefront that **collects** payments
from customers for their orders. We integrate the **Collection API
(Request-to-Pay)** only — we do not disburse or remit funds. Accordingly, the
Disbursement and Remittance sections of the UAT are marked *Not Tested (N/A)*.

**Attached now**
1. **Completed UAT form** — Collection API sandbox tests (Create API User/Key,
   Token, Request-to-Pay, and Status all passing; success, failure and pending
   scenarios verified).
2. **Business description & customer user journey** document.

**To follow shortly** (in progress)
3. **NCSA Data Protection license** — application in progress via https://dpo.gov.rw/.
4. **RDB certificate.**

**Two points to confirm, please**
- **Commercials:** as we only collect, please confirm we can proceed on the
  **Collections** rate (2.36%, VAT inclusive) and that the **120 RWF Disbursement**
  fee does not apply to us.
- **UAT rows 6–7 (Account Status Check / Account Balance Check):** these are not
  used by our checkout flow (we collect via Request-to-Pay) and returned
  `NOT_ALLOWED_TARGET_ENVIRONMENT` / `RESOURCE_NOT_FOUND` on our sandbox
  subscription. Please confirm they are not required for a Collections-only
  integration.

Kindly let us know the next step once the remaining documents are provided.

Kind regards,
[Your name]
Ajabu Lighting
[phone] · [email] · https://ajabulighting.com
