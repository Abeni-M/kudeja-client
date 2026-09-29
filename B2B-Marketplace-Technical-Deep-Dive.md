# Technical Deep-Dive: Answers to Your 10 Questions

---

## Reality check first: "one month, everything, one team"

Be honest with yourself here. A 1-month build for supplier dashboard + retailer dashboard + admin + working ERP + 3 local payment integrations + multi-channel notifications (including Telegram) + subscription tiers is **not realistic as a fully polished system**, even with a small team of 3-5 developers.

What **is** realistic in one month: a working MVP where the core loop functions end-to-end (supplier lists product → retailer orders → stock updates → payment via Chapa → notification fires) with the other pieces (reviews, advanced ERP, multi-tier subscription enforcement) stubbed simply or deferred. I'll mark what's realistically "Month 1" vs "after" throughout below. Trying to gold-plate every feature in 4 weeks is how these projects ship nothing.

---

## 1. ERP Integration — Yours First, Suppliers' Later

**Your own ERP (Month 1):** This isn't a separate system — it's just your `products` and `stock_movements` tables with proper transaction handling. Don't think of "ERP" as a separate module to bolt on; it's the inventory logic baked into the supplier/order flow from day one.

**Future: integrating supplier's own ERP (SAP, Odoo, etc.) — Phase 2+, not Month 1:**
Build this as an **adapter/integration layer**, not a direct dependency:
- Create an internal `StockSyncService` interface with one method: `updateStock(sku, quantity, source)`.
- For suppliers without their own system: they use your dashboard directly → calls this service.
- For suppliers with their own ERP: they push updates via a **webhook you expose** (`POST /api/v1/suppliers/{id}/stock-update`) or you pull via **their API** on a schedule (cron every 15 min, for example).
- Use an **idempotency key** on every stock update so re-sent webhooks don't double-count.
- Queue these updates (Redis/RabbitMQ) rather than processing synchronously — supplier ERPs can be slow or flaky, and you don't want that blocking your checkout flow.

Don't try to build generic connectors for every possible ERP upfront. Build the webhook contract first; add specific connectors (Odoo, Zoho) only when a real supplier asks for it.

---

## 2. Local Payments — Chapa, Telebirr, CBE Birr

Good news: you likely don't need to integrate Telebirr and CBE Birr separately. **Chapa** is a payment aggregator that already supports Telebirr, CBE Birr, HelloCash, and card payments under one API — integrate Chapa once and you get most local rails through it.

**Recommended flow (Month 1):**
- Retailer checkout → create Chapa payment session → redirect/collect → Chapa webhook confirms payment → your system marks order as `paid` → triggers stock decrement + notification.
- **Never mark an order paid based on the frontend redirect alone** — always confirm via Chapa's server-to-server webhook. Frontend confirmation can be spoofed or interrupted.
- Store `payment_reference` on the order for reconciliation.

**Supplier payout (Phase 2):** Initially, keep it simple — you collect payment, and reconcile/payout to suppliers manually (bank transfer) on a schedule (weekly). Automating split payments (platform commission vs supplier payout) via Chapa's payout API is a real feature but adds complexity — don't build it in month one unless commission collection is core to your revenue from day one.

---

## 3. Notifications — Multi-Channel Including Telegram

Build one internal **NotificationService** that abstracts the channel, so your business logic just says `notify(user, event_type, data)` and the service figures out where to send it.

**Channels, in order of effort:**
- **Telegram** (easiest, and very relevant for Ethiopia) — build a Telegram bot, let users link their account by sending `/start` with a linking code from their dashboard. Sending messages via Telegram Bot API is simple and free.
- **Email** — SendGrid/Resend/Postmark. Cheap, easy, good for order confirmations/invoices.
- **SMS** — use a local gateway (e.g., AfroMessage, GeezSMS) — necessary because not every retailer/supplier will use Telegram or check email regularly.
- **In-app** — simplest, just a notifications table + unread count, build this first since it requires no external service.

**Month 1 scope:** In-app + Telegram (high impact, low effort, culturally relevant) is a good realistic combo. Add email + SMS in Phase 2 if budget/time allows.

**Trigger events to cover from day one:** order placed, order confirmed by supplier, order shipped, payment received, low stock (supplier side).

---

## 4. Reducing the Four Key Risks — Concrete Implementation

**1. Overselling:**
- Add a `version` integer column to `products` (optimistic locking), or use `SELECT ... FOR UPDATE` inside a DB transaction when decrementing stock at checkout.
- Simplest reliable pattern: `UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >= 1` — check the affected row count; if 0, the order fails with "out of stock," atomically, no race condition possible.
- This is a Month 1 must-have — it's a few lines of SQL, not a big feature, so there's no excuse to skip it.

**2. Trust between strangers:**
- Month 1: manual supplier verification (business registration/license upload, admin approval before they go live). This alone solves 80% of the trust problem cheaply.
- Phase 2: retailer reviews/ratings on suppliers, visible on product listings.
- Phase 2: dispute flow (retailer flags an order → admin dashboard queue → resolution log).

**3. ERP scope creep:**
- Write down explicitly what's OUT of scope for Month 1: no accounting, no multi-warehouse, no procurement forecasting, no supplier-ERP auto-sync. Just: product + stock quantity + atomic decrement + manual adjustment. Post this list somewhere your team can see it — scope creep kills 1-month timelines faster than anything else.

**4. Subscription vs commission conflict:**
- Decide this **before writing checkout code**, because it changes your data model. My recommendation for a fast MVP: **subscription-only** at first (simpler — flat fee unlocks pricing visibility and ordering, no per-transaction commission logic, no split-payment complexity). Add commission-based revenue later once you have transaction volume to justify the added payment complexity.

---

## 5. How Supplier Stock Should Be Stored

**Don't create separate storage per supplier.** That's the redundancy trap you're sensing, and it also blocks you from ever doing cross-supplier search or reporting cleanly.

**Correct model:** one `products` table, one `stock_movements` table, both with a `supplier_id` foreign key. Data isolation between suppliers is enforced at the **application/query level** (every query is automatically scoped by `WHERE supplier_id = current_supplier_id`), not by physically separate databases or tables per supplier.

Physically separating data per supplier only becomes justified at real enterprise scale (thousands of suppliers, compliance requirements demanding physical isolation) — not at MVP stage. Don't over-engineer this now.

---

## 6. Handling Different Prices from Different Suppliers

Two possible models — pick based on whether the same product can be sold by multiple suppliers:

**Model A — Simple (recommended for Month 1):** Each supplier's product listing is its own row, own price, own stock. If two suppliers sell "the same" item, they're just two separate listings a retailer can browse independently. No merging logic needed. This is the fastest to build.

**Model B — Marketplace-style (Phase 2+):** A canonical `product` (e.g. "Coca-Cola 500ml") has multiple `offers`, one per supplier, each with its own price/stock — like Amazon's "other sellers" view. This lets retailers compare prices for the same item across suppliers, but requires product deduplication/matching logic, which is genuinely complex (barcode matching, fuzzy name matching, admin review of merges).

**Start with Model A.** Move to Model B only once you have enough suppliers that price comparison becomes a real user need.

---

## 7. Free Trial → Basic/Pro Subscription Tiers

Structure:
- `retailers` table: `subscription_tier` (`trial` | `basic` | `pro`), `trial_ends_at`, `subscription_status`.
- **Trial:** time-boxed (e.g. 14 days) or discounted-price flag — either works, time-boxed is simpler to reason about.
- **Basic:** enforce order limits via a middleware check at checkout — e.g. `COUNT(orders WHERE retailer_id = ? AND created_at > start_of_month) < tier_limit`. If exceeded, block checkout with an upgrade prompt.
- **Pro:** no limit check, just bypass the count check.

This is a lightweight feature — a tier field, a limit check, and a Stripe/Chapa recurring billing hook. Very doable in Month 1.

---

## 8. Does ERP Need to Come Before Suppliers?

No — and it can't really be separated anyway. **Basic inventory tracking IS part of the supplier onboarding flow**, not a prerequisite system you build first. When a supplier adds a product, they're already entering stock quantity — that's your "ERP" starting to exist.

Build order: **Supplier product+stock entry → Retailer browsing/ordering → Atomic stock decrement on order.** These three are really one continuous flow, not sequential systems. Trying to build a "complete ERP" before touching suppliers/retailers is exactly the scope-creep trap from risk #3 — avoid it.

---

## 9. How Admin Handles Both Supplier and Retailer Sides

**One unified admin system, with role-scoped views** — not two separate systems. Structure it as:
- A single admin dashboard with distinct sections/tabs: "Suppliers" (approvals, product moderation, performance) and "Retailers" (subscription status, order history, disputes).
- Both sections read from the same underlying database, just filtered by role.
- Shared components: user management, audit log viewer, order dispute queue (since disputes involve both a supplier and retailer, this view naturally needs both sides visible together anyway).

Building two separate admin systems would duplicate auth, duplicate audit logging, and make cross-referencing a dispute (which always involves both a retailer and a supplier) unnecessarily painful.

---

## 10. Implementing the Non-Functional Requirements Concretely

| Requirement | Concrete Implementation |
|---|---|
| **Transactional consistency** | Wrap order creation + stock decrement in a single DB transaction. Use Postgres's `SERIALIZABLE` or `SELECT FOR UPDATE` for the stock row. Never do "check stock, then separately update stock" as two queries. |
| **Multi-tenancy / data isolation** | Every query scoped by `supplier_id`/`retailer_id` in application middleware. Optionally, Postgres Row-Level Security (RLS) as a second layer of defense — cheap to set up, prevents "forgot the WHERE clause" bugs from leaking data. |
| **Scalability** | Index `products.supplier_id`, `orders.retailer_id`, `orders.status`, `orders.created_at` from day one. Design pagination into every list endpoint now — retrofitting pagination later on a large table is painful. |
| **Security (RBAC)** | Middleware that checks `role` + resource ownership on every request. Don't rely on frontend hiding buttons — always enforce on the backend. |
| **Auditability** | A single `audit_logs` table (`actor_id, action, entity_type, entity_id, old_value, new_value, timestamp`). Write to it via a DB trigger or an application-layer hook on every price change, stock change, and order status transition. Cheap to build now, very expensive to retrofit after a real dispute happens and you have no log. |

None of this requires exotic infrastructure — it's disciplined use of transactions, indexes, and middleware. The "strong system" you're picturing comes from getting these fundamentals right early, not from adding more services.

---

## Realistic Month-1 Scope (Given Your Timeline)

To actually ship in a month with a team, I'd freeze scope to:

**Build:**
- Supplier: add/edit product (with stock qty), simple order inbox
- Retailer: browse, cart, checkout, order history
- Atomic stock decrement (the SQL pattern in section 4)
- Chapa payment integration
- Telegram + in-app notifications for order events
- Basic subscription tiers (trial/basic/pro) with order-limit enforcement
- Admin: approve suppliers/retailers, view all orders

**Explicitly defer:**
- Supplier-side ERP integrations (webhooks) — no real external suppliers need this yet
- Email/SMS notifications
- Reviews/ratings
- Commission-based revenue / payment splitting
- Model B (multi-supplier price comparison)
- Multi-warehouse, procurement, accounting

This scoped version is genuinely buildable by a small team in 4 weeks if everyone's focused and you don't add features mid-sprint.
