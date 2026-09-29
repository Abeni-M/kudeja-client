# Complete Step-by-Step Timeline
## B2B Retailer-Supplier Marketplace Platform (Ethiopia)

This pulls together every decision made so far into one sequential plan. Realistic total: **~6 weeks** with a focused small team — slightly beyond your original 1-month target, but that extra time is almost entirely the ERP/compliance layer, which isn't optional given Directive 1142/2026.

---

## Week 0 — Decisions & Vendor Outreach (Before Any Code)

Do these in parallel; none require development work yet.

- [ ] **Lock your revenue model**: subscription-only (recommended for speed) vs subscription + commission. This affects your checkout/payment code, so decide before Week 2.
- [ ] **Contact Odoo partners for quotes.** Start with **ETTA Solutions PLC** (Silver-tier, most references, Wholesale/Retail experience) via their Odoo partner profile. Get 1-2 more quotes from other officially listed partners (Top System Solutions and Technology, Cilondis) for comparison.
- [ ] **Ask every ERP vendor directly**: "Are you accredited under Directive 1142/2026 for e-invoicing integration, or do you partner with an accredited provider?" Get this in writing before signing anything.
- [ ] **Book a session with a local accountant or tax lawyer** who's tracking Directive 1142/2026, specifically about the marketplace-operator accreditation requirement (Articles 4 & 7) — this is the one step with real legal/financial risk if skipped.
- [ ] **Confirm your team's stack comfort**: Node.js/React assumed throughout this plan. If your team is Python-heavy instead, the same architecture works with Django in place of NestJS.
- [ ] **Decide build-vs-buy for the ERP layer**: hire the chosen Odoo partner to handle deployment + Ethiopian localization + e-invoicing connector, or have your own team do it self-hosted from scratch. Vendor route is faster but costs more; the timeline below assumes a hybrid — vendor handles Odoo/compliance, your team builds the marketplace layer.

---

## Week 1 — ERP Foundation

**Owner: Odoo partner (or your team if self-hosting)**
- [ ] Deploy Odoo Community via Docker on a VPS
- [ ] Install only: Inventory, Sales, Accounting apps
- [ ] Install Ethiopian fiscal localization module (chart of accounts, VAT structure, withholding tax structure)
- [ ] Configure chart of accounts — accountant reviews and signs off before any real transactions

**Owner: Your dev team, in parallel**
- [ ] Set up your own PostgreSQL database (separate from Odoo's) for auth, subscriptions, notification logs
- [ ] Scaffold backend service (NestJS or Express) with basic project structure
- [ ] Set up GitHub repo, CI/CD pipeline, staging environment
- [ ] Set up Docker for your own services

---

## Week 2 — Backend Core + Odoo Bridge

**Owner: Odoo partner**
- [ ] Build the 5 REST endpoints on Odoo: create product, update stock, create order, get order status, list catalog by supplier
- [ ] Implement token-based authentication for these endpoints (not session cookies)

**Owner: Your dev team**
- [ ] Build authentication + RBAC for 3 roles (supplier, retailer, admin) in your own backend
- [ ] Build the service layer that calls Odoo's REST endpoints and translates responses
- [ ] Implement the atomic stock-check pattern as a safety net on your side too (defense in depth, even though Odoo's own inventory engine should handle reservation)
- [ ] Build subscription tier logic (trial/basic/pro) with order-limit enforcement middleware

---

## Week 3 — Frontend Dashboards

**Owner: Your dev team**
- [ ] Supplier dashboard: add/edit product form, bulk CSV upload, order inbox with confirm/reject actions
- [ ] Retailer dashboard: browse/search/filter products, cart, checkout flow, order history
- [ ] Wire both dashboards to your backend (which talks to Odoo underneath)
- [ ] Admin: decide whether to build a custom admin panel or use Odoo's own backend UI directly for approvals (using Odoo's native UI here saves real time — your internal team can log into Odoo directly even though suppliers/retailers can't)

---

## Week 4 — Payments & Notifications

**Owner: Your dev team**
- [ ] Integrate Chapa for retailer checkout payments
- [ ] Integrate Chapa Billing (or equivalent) for subscription payments
- [ ] Build Telegram bot, account-linking flow, and event-triggered messages (order placed, confirmed, shipped)
- [ ] Build in-app notification system (simplest — no external dependency)
- [ ] Wire notification triggers to the key events: order placed, order confirmed, payment received, low stock

---

## Week 5 — Compliance Finalization

**Owner: Odoo partner + your backend team together**
- [ ] Connect Odoo's invoice creation to the chosen Ministry-of-Revenue-certified e-invoicing provider's API
- [ ] Test end-to-end: sale → invoice generated → transmitted → IRN + QR code returned → stored/displayed
- [ ] Test offline resilience (invoice queuing when connectivity drops)
- [ ] Accountant/tax advisor final review of the full invoicing flow before real transactions run through it

---

## Week 6 — Testing & Beta

- [ ] Load-test the overselling scenario specifically: simulate two simultaneous orders for the last unit of stock, confirm only one succeeds
- [ ] Full order lifecycle test: supplier lists → retailer subscribes → retailer orders → payment → stock decrements → invoice registers → notifications fire on both sides
- [ ] Onboard 3-5 real suppliers and retailers for a closed beta
- [ ] Monitor closely for a week; fix friction points before wider launch

---

## What's Deliberately Deferred (Not in This Timeline)

Keep these off your plate until after a working beta, so scope doesn't creep back into your 6 weeks:
- Supplier-side ERP-to-ERP sync (webhooks from suppliers' own systems)
- Email/SMS notifications (Telegram + in-app is enough to start)
- Reviews/ratings system
- Commission-based revenue / split payments
- Multi-supplier price comparison for the same product
- Multi-warehouse, procurement forecasting, manufacturing modules

---

## Quick Reference — Who to Contact This Week

| Need | Contact |
|---|---|
| Odoo implementation quote | ETTA Solutions PLC — via odoo.com/partners/etta-solutions-plc-5661517 |
| Odoo implementation quote (comparison) | Top System Solutions and Technology, Cilondis — same Odoo partner directory |
| Tax/compliance review | A local accountant or tax lawyer familiar with Directive 1142/2026 (not something to skip) |
| Local payments | Chapa (aggregates Telebirr, CBE Birr, HelloCash) |
