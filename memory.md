# VendorVerse Project Memory

> Living checkpoint. Update at the end of any meaningful work session so a new session can pick up context quickly. Details live in `prd.md` / `architecture.md` / `design.md`; this file is the pointer.

## Current Project State
**VendorVerse Phase 2 is complete.** Priorities 1–5 are implemented and committed (HEAD `5847f7f`; 17 commits; working tree clean). Deferred items remain explicitly deferred (see `prd.md` §8–9, `phases.md`).

## Current Checkpoint
**Final Phase 2 regression — PASS.**

## Verification (final)
- **Backend automated tests:** 33/33 test files passed; **248/248 tests passed; 0 failures** (Vitest + Supertest + mongodb-memory-server; full suite together).
- **Frontend build:** PASS — 194 modules transformed, built successfully. Non-blocking Vite chunk-size advisory (>500 kB) present.
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
1. `Refund.returnRequest` declares `ref: 'ReturnRequest'`; registered model is `Return`.
2. Avatar upload: Multer limit 20 MB vs comment "10 MB for testing" (and avatar error text says "2 MB").
3. `CodProcessor.js` unused/orphaned; `PaymentFactory` uses `CashOnDeliveryProcessor.js`.
4. Duplicate `status` field in `SellerProfile.model.js`.
5. Hardcoded `.hero-banner`/`.hero-subtitle` colors (dashboard-footer and stat-card were tokenized in Phase 2).

## Testing / Build Commands
- Backend tests: `cd multi-vendor-mern && npm test` (Vitest run). 33 files / 248 tests.
- Frontend build: `cd Ecommerce-FrontEnd && npm run build` (Vite; PASS with chunk-size advisory).

## Last Verification Record
- **Checkpoint:** Final Phase 2 regression PASS.
- **Tests:** 33/33 files, 248/248 tests, 0 failures.
- **Build:** frontend build PASS (194 modules).
- **Manual regression:** PASS.
- **Git:** HEAD `5847f7f`, working tree clean.