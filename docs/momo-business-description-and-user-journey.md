# Ajabu Lighting — Business Description & Customer User Journey
_For MTN MoMo Collection API integration (Regulatory & Compliance submission)_

> Fill the bracketed placeholders `[…]` with your registered details before sending.

## 1. Brief business description

**Ajabu Lighting** is an online lighting retailer serving customers in **Rwanda**.
We sell curated lighting fixtures — chandeliers, pendant lights, table and floor
lamps, wall sconces, ceiling lights, smart lighting, outdoor lighting, LED strips,
and decorative bulbs — through our e-commerce website, **https://ajabulighting.com**.

- **Legal/registered name:** [Registered company name]
- **RDB registration no.:** [RDB certificate number]
- **Business address:** [Address, Kigali, Rwanda]
- **Contact:** [Name] · [email] · [phone]
- **Currency:** Rwandan Franc (RWF)
- **Payment methods offered:** MTN Mobile Money (online collection) and Cash on
  Delivery.
- **Fulfilment:** Goods are delivered to the customer's address in Rwanda; delivery
  is free above a set order value.

**How we use the MoMo Collection API:** solely to **collect** payment from a
customer for their own order at checkout, using **Request-to-Pay**. The customer
approves the debit on their own phone with their MoMo PIN. We do **not** disburse
or remit funds; there is no payout flow.

## 2. Customer user journey

1. **Browse** — the customer visits ajabulighting.com and browses products by
   category or search.
2. **Product & cart** — they open a product, review details/price (in RWF), and
   add it to their cart.
3. **Account** — they sign in or create an account (required to check out, so we
   can attach the order and provide order history/support).
4. **Checkout — shipping** — they enter/confirm their delivery name, phone, and
   address.
5. **Checkout — payment method** — they choose **MTN Mobile Money** or **Cash on
   Delivery**.
6. **MoMo payment (Collection / Request-to-Pay):**
   a. The customer enters the MoMo phone number to be charged.
   b. Our server calls **Request-to-Pay** for the exact order amount.
   c. MTN sends a prompt to the customer's phone; they **approve with their PIN**.
   d. Our server **polls the Request-to-Pay status** until it resolves.
   e. On **SUCCESSFUL**, the order is confirmed, stock is updated, and a
      confirmation email is sent. On **FAILED/timeout**, the customer is told and
      can retry; no goods are released.
7. **Cash on Delivery (alternative)** — the order is placed as unpaid; the customer
   pays cash to the courier on delivery, and staff mark it paid.
8. **Confirmation** — the customer sees an order-confirmed screen and receives an
   email with the order number and summary.
9. **Order tracking** — from **My Account → Orders**, the customer views status
   (pending → confirmed → processing → shipped → delivered) and any tracking info.
10. **Support** — each order has a two-way message thread. The customer can
    message the store (and vice-versa) about payment or delivery issues; messages
    appear in the customer's inbox and by email. For payment disputes, staff can
    see the exact MoMo response (transaction ID / failure reason) to advise the
    customer, and refer genuine MoMo-side issues back to MTN.

## 3. Data protection

Personal data collected is limited to what is needed to fulfil the order: name,
phone number, delivery address, email, and the MoMo number used for payment.
Payment authorisation and the customer's MoMo PIN are handled entirely by MTN on
the customer's device — we never see or store the PIN. [Reference the NCSA Data
Protection registration once obtained: registration no. [ ].]
