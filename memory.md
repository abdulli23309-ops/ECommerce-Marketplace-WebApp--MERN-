# VendorVerse Project Memory

> Living checkpoint. Update at the end of any meaningful work session so a new session can pick up context quickly. Details live in `prd.md` / `architecture.md` / `design.md`; this file is the pointer.

## Current Project State
**Phase 2 (Priorities 1–5) is complete.** HEAD is now `588fdb5` (tag `v2.1-ui-audit-locked`). The working tree is currently **dirty** with post-Phase-2 work (see §5) and must be reconciled/committed to lock a new baseline. Deferred items remain explicitly deferred (see `prd.md` §8–9, `phases.md`).

## Current Checkpoint
**Phase 2 + Phase 2.5 verification — PASS.**

## Verification (final)
- **Backend automated tests:** **55/55 test files passed; 399/399 tests passed; 0 failures** (Vitest + Supertest + mongodb-memory-server; full suite together). The two extra tests beyond the committed baseline are Phase-2.5 regression tests (`tests/securityRateLimit.test.js` + `tests/orderCancelPaymentStatus.test.js`, the latter added during the Order/payment-status verification pass).
- **Frontend production build:** PASS — Vite build succeeds with 0 errors (chunk-size advisory remains non-blocking).
- **Phase 2 manual regression:** PASS across Auth, Authorization, Customer/Seller/Admin workflows, Cart, Checkout, Multi-seller splitting, COD, EasyPaisa, JazzCash, Coupons, Orders, Shipments, Reviews, Rating moderation, Returns, Refunds, Notifications, Permissions, Theme/UI.

## Security / Configuration State (post-Phase 2 hardening)
- JWT fail-fast (`app/helpers/Jwt.helper.js`): production cannot silently use an insecure fallback — missing `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` cause authentication to fail closed.
- `ALLOW_MOCK_GOOGLE`: ignored when `NODE_ENV=production`, so mock Google auth cannot silently remain enabled in production.
- Stripe: secrets read only from environment variables; no secret is hard-coded or Git-tracked. Local dev `.env` files are gitignored (`.gitignore`) and only `.env.example` placeholders are tracked.
- `/api/v1/test/*` (AuthorizationTest routes): gated to non-production; available to automated tests under `NODE_ENV=test`.
- Rate limiting: per-process in-memory guards added for `POST /auth/login`, `POST /auth/register`, `POST /auth/google`, and OTP `/send` + `/verify` (`app/middleware/RateLimit.middleware.js`). This is a per-instance guard; distributed/Redis-backed rate limiting is a documented follow-up (not introduced to avoid forcing a Redis dependency).
- **Phase 2 manual regression:** PASS (Auth, Authorization, Customer/Seller/Admin workflows, Cart, Checkout, Multi-seller splitting, COD, EasyPaisa, JazzCash, Coupons, Orders, Shipments, Reviews, Rating moderation, Returns, Refunds, Notifications, Permissions, Theme/UI).
- Defects found during regression were fixed and re-verified: COD messaging/status, wallet order processing, currency formatting, missing product images, rating recalculation timing, seller-warning visibility, moderation low-rating state, order-tracking redesign, product-inspection modal overlay, email OTP redirect, customer return-detail rendering/build.

## Architecture
- MERN; two independent npm projects (`Ecommerce-FrontEnd/`, `multi-vendor-mern/`) in one repo.
- Backend: strict Route → Controller → Service → Repository → Model layering; repositories are the only layer querying Mongoose.
- Rotating, SHA-256-hashed refresh tokens with TTL.
- Checkout fans one `ParentOrder` into per-seller `SellerOrder`s; shipments/reviews/returns hang off `SellerOrder`.
- Snapshot fields preserve order history; soft-delete taxonomy; semantic theme tokens; shared status-badge util; backend-owned pagination shape.
- Payment processors via `PaymentFactory` (+ `services/payment/processors/`).
- **Dashboard context is a frontend-only Redux concept — it must NOT change the backend role.**
- Notifications, coupons, audit log, seller analytics (rendered), delivery charges, rating moderation, email OTP, Google OAuth all follow the same layering.

## Protected Working Areas (do not break)
- Auth & Authorization (JWT, roles, permissions, email OTP, Google OAuth)
- Products (seller CRUD, public browsing, admin moderation + stats)
- Cart, Wishlist, Checkout, multi-seller order splitting
- Orders, Payments (Dummy/COD/Stripe/JazzCash/EasyPaisa), Shipments
- Reviews (incl. pagination), Returns & Refunds (state machine)
- Pagination shape + reusable `Pagination` component
- Theme system (tokens) + theme-aware branding
- Notifications, Coupons, Admin audit log, Seller analytics
- Rating moderation, Delivery charges, Email OTP verification
- Dashboard view switching (frontend only)

## Known Remaining Work (future — NOT Phase 2 outstanding items)
- **Seller Suspension & Appeal System** (rating warnings currently cap and do NOT auto-suspend).
- **Product variants** (size/color/SKU/variant inventory).
- **Advanced recommendations** (basic related-products + recently-viewed are separate and Complete).
- **PayPal** (enum/UI value only; no processor).
- **Delivery-charge Admin UI** (backend + checkout only).
- **Production email delivery** (SMTP-gated; dev fallback logs OTP).
- **Bundle-size optimization** (non-blocking Vite chunk-size advisory).
- **Stripe webhook end-to-end verification** via external forwarding (Stripe CLI).

## Open Verification Items (do not silently "fix"; scope them first — `rules.md` Rule 20)
1. `Refund.returnRequest` declares `ref: 'ReturnRequest'`; the registered model is `ReturnRequest` (`Return.model.js`, `models/init.js`). **VERIFIED / ALREADY CORRECT** — not a defect.
2. Avatar upload: consistently configured at 5 MB (Multer limit 5 MB; comment "5 MB avatar limit"; avatar error text "File too large. Maximum size is 5 MB."). **VERIFIED / ALREADY CORRECT.**
3. `CodProcessor.js` — **VERIFIED GONE** in current source; `PaymentFactory` uses `CashOnDeliveryProcessor.js`. (See item 8.)
4. `SellerProfile.status` field — **VERIFIED: exactly ONE declaration** (enum `Pending/Approved/Rejected/Suspended`, default `Pending`); no duplicate. Confirmed directly in `SellerProfile.model.js` lines 35–39.
5. Hardcoded `.hero-banner`/`.hero-subtitle` colors (dashboard-footer and stat-card were tokenized in Phase 2).
6. `OrderStatusPage` missing `import React`.
7. Frontend order history detail shows `Delivered` instead of `Delivered/Received`.
8. `CodProcessor.js` orphaned — **VERIFIED GONE** in current source (file no longer exists; `PaymentFactory` uses `CashOnDeliveryProcessor.js`).

## Testing / Build Commands
- Backend tests: `cd multi-vendor-mern && npm test` (Vitest run). **55 files / 399 tests.**
- Frontend build: `cd Ecommerce-FrontEnd && npm run build` (Vite; PASS).

## Working-Tree Awareness (Phase 2 follow-up state)
The working tree is intentionally non-clean with post-baseline work that must be reconciled/committed before a new baseline lock:
- `app/services/Order.service.js`, `Ecommerce-FrontEnd/src/utils/orderStatus.js`, `Ecommerce-FrontEnd/src/pages/customer/CheckoutPage.jsx`, `Ecommerce-FrontEnd/src/pages/customer/OrderHistoryPage.jsx` — Order/payment-status verification change (verified: internally consistent, no regression).
- `app/app.js`, `app/routes/Auth.routes.js`, `EmailOtp.routes.js`, `GoogleAuth.routes.js` — Phase 2 security gating (`RateLimit.middleware.js` is untracked; production-only route guards).
- `tests/securityRateLimit.test.js` + `tests/orderCancelPaymentStatus.test.js` — Phase 2 / Phase-2.5 regression tests (untracked, added this pass).

## Last Verification Record
- **Checkpoint:** Customer Order Flow, Review/Return Selection, Anonymous Reviews & UI Stability.
- **Tests:** 55/55 files, 399/399 tests, 0 failures.
- **Build:** frontend build PASS (211 modules).
- **Features Completed:**
  - Multi-seller customer order separation with independent seller cards, statuses, line items, and tracking.
  - Multi-product review picker and per-item direct review triggers.
  - Multi-product return picker with quantity selector (1..purchasedQty) and dynamic refund calculations.
  - Anonymous review submission with public and seller privacy sanitization.
  - Single root Google OAuth initialization in `main.jsx`.
  - 3D card elevation and layered depth effects on dashboard metric cards.