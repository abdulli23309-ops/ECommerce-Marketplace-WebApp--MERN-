# VendorVerse Project Memory

> Living checkpoint. Update this file at the end of any meaningful work session so a new AI session (or a human) can pick up context without re-reading the full history. Keep it concise — details belong in `prd.md`/`architecture.md`/`design.md`; this file is the pointer, not the encyclopedia.

## What VendorVerse Is

VendorVerse is a multi-vendor MERN marketplace (Customer / Seller / Admin roles) covering auth, catalog, cart/wishlist, checkout with multi-seller order splitting, payments (Dummy/COD/Stripe/JazzCash/EasyPaisa), shipments, reviews, returns/refunds, permission-based authorization, backend pagination, a light/dark theme system, in-app notifications, coupons, admin audit log, seller analytics, rating moderation, delivery charges, email OTP verification, and Google OAuth. See `prd.md` §9 for the full feature-status table.

## Architecture

- MERN stack, two independent npm projects (`Ecommerce-FrontEnd/`, `multi-vendor-mern/`) in one repo.
- Backend: strict Route → Controller → Service → Repository → Model layering; repositories are the only layer that queries Mongoose directly.
- Rotating, SHA-256-hashed refresh tokens (never raw) with TTL index.
- Checkout fans a single `ParentOrder` out into per-seller `SellerOrder`s; most downstream domains (shipments, reviews, returns) hang off `SellerOrder`.
- Snapshot fields (`productNameSnapshot`, `unitPriceSnapshot`) preserve historical order data independent of live `Product` edits.
- Soft-deletion (`isDeleted` + partial unique index) for `Category`/`SubCategory`/`Brand`.
- Semantic CSS-variable theming; shared `getStatusBadgeStyle()` status-color utility.
- Backend pagination metadata shape: `{ page, pageSize, total, totalPages, ... }`, consistent across all paginated endpoints.
- Payment processors isolated via `PaymentFactory` + `services/payment/processors/`.
- Email OTP verification: bcrypt-hashed OTPs, recipient derived from authenticated user, 3-min expiry, 3-min cooldown, max 5 attempts.
- Google OAuth sets `emailVerified: true`.

Full detail in `architecture.md`.

## Current Git State

- **HEAD**: `3b07eec` — "Implement Priority 4 features and backend tests"
- **Working tree**: **dirty**
- 76 tracked files modified (frontend + backend + `memory.md` + `prd.md`)
- Many Priority 5 files are **untracked**
- **Priority 1–4 are committed**
- **Priority 5 is uncommitted**

## Completed Work (Committed)

- **Priority 1**: regression/bug audit, order status timeline, low-stock indicators, related-products fix, reusable Pagination component, automated/API tests.
- **Priority 2**: recently viewed products, search autocomplete/suggestions, additional seller performance indicators, minor UI/UX improvements.
- **Priority 3**: light/dark theme system.
- **Priority 4** (committed in `3b07eec`): in-app notifications, coupons/discounts, admin audit log, seller analytics (backend-only).

## Uncommitted Work (Priority 5)

All Priority 5 work is **uncommitted** (working tree only):

- **Rating moderation** — product low threshold 3.0, seller low threshold 2.5, max warnings 3; warnings do not auto-suspend.
- **Delivery charges** — backend model/service/controller/routes; checkout integrated; no admin frontend.
- **Email OTP verification upgrade** — `User.emailVerified`; normal registration sets `emailVerified: false`; checkout and seller application require `emailVerified: true`; Google OAuth sets `emailVerified: true`; OTP expiry 3 min, resend cooldown 3 min, max 5 attempts; OTP bcrypt-hashed; recipient email derived from authenticated user; `Email.service.js` uses Nodemailer SMTP when `EMAIL_PROVIDER=smtp`; dev fallback logs OTP; `VerifyEmailPage.jsx` (read-only email, countdown, expiry message); `authSlice.setEmailVerified`.
- **Google OAuth** — `GoogleAuth` controller/service/routes; `GoogleAuthButton.jsx`.
- **JazzCash/EasyPaisa sandbox processors** — `services/payment/processors/`; `PaymentFactory.js` updated.
- **Seller cannot add own product to cart** — `Cart.service.js` rule.

## Known Issues / Verification Items

Do not silently "fix" these; scope them as their own task first (see `rules.md` Rule 20):

1. **Avatar upload limit comment mismatch** — comment says "10MB for testing" but configured Multer limit is 20MB.
2. **`Refund.returnRequest` ref name** — declared `ref: 'ReturnRequest'` but the registered model is `Return`.
3. **PayPal unimplemented** — enum-only, no processor.
4. **Hardcoded colors in older CSS selectors** — `.dashboard-footer`, `.stat-card`/`.stat-label`/`.stat-card-highlight`, `.hero-banner`/`.hero-subtitle`.
5. **Duplicate status field in `SellerProfile.model.js`**.
6. **Rating warnings never auto-suspend** — pending business-rule decision.
7. **`CodProcessor.js` orphaned**.
8. **Seller analytics backend-only** — `topSellingProducts` and `salesTrend` not rendered frontend.
9. **Delivery charges backend-only** — no admin UI.
10. **Email delivery is SMTP-gated** — dev fallback logs OTP to console.
11. **`easypaisaJazzcash.test.js` fails** — tests omit `mobileAccount`.
12. **`ratingModeration.test.js` has warningCount assertion mismatch**.
13. **Full test pass/fail not fully re-verified**.

## Test Status

- Vitest + Supertest + mongodb-memory-server configured in `multi-vendor-mern/` (`npm test` → `vitest run`).
- Test files exist under `multi-vendor-mern/tests/` (including `priority4/` and `priority5/` subdirectories).
- **Email OTP tests passed 4/4 in the last actual run.**
- `checkout.test.js` and `deliveryCharges.test.js` were fixed with `emailVerified: true` but were **not re-run** in this audit.
- **Do not claim full tests pass unless actually executed.**

## Important Business Rules

- A `SellerProfile` must have `status: 'Approved'` before a seller can operate.
- Checkout produces one `ParentOrder` + one `SellerOrder` per distinct seller.
- One review per (customer, product, sellerOrder); one return per (customer, product, sellerOrder).
- Return workflow: `PENDING_ADMIN_REVIEW → REJECTED_BY_ADMIN | PENDING_SELLER_REVIEW → APPROVED_PENDING_SHIPMENT | REJECTED_BY_SELLER → ITEM_IN_TRANSIT → SELLER_RECEIVED → INSPECTED_AND_REFUNDED`.
- One shipment per `SellerOrder`; one payment per `ParentOrder`.
- Email verification: normal registration sets `emailVerified: false`; Google OAuth sets `emailVerified: true`; checkout and seller application require `emailVerified: true`.
- OTP: 3-min expiry, 3-min resend cooldown, max 5 attempts, bcrypt-hashed, recipient from authenticated user.
- Rating moderation: product low threshold 3.0, seller low threshold 2.5, max warnings 3; warnings do not auto-suspend.

## Important Technical Decisions

- Strict Route → Controller → Service → Repository → Model layering.
- Rotating, hashed refresh tokens.
- Cart-to-multi-seller-order splitting at checkout.
- Snapshot fields on order items.
- Soft-deletion for taxonomy.
- Semantic CSS-variable theming; shared status-badge utility.
- Backend-owned pagination metadata shape.
- Payment processors via `PaymentFactory`.
- Email OTP verification with bcrypt-hashed OTPs.

## What Must Not Be Broken

- Authentication & Authorization (JWT, roles, permissions, email OTP, Google OAuth)
- Products (seller CRUD, public browsing, admin moderation + global stats)
- Cart, Wishlist, Checkout, Multi-seller order splitting
- Orders, Payments (Dummy/COD/Stripe/JazzCash/EasyPaisa), Shipments
- Reviews (including admin/product review pagination)
- Returns & Refunds (multi-stage state machine)
- Pagination (backend-driven, `page`/`pageSize`/`total`/`totalPages` shape)
- Theme system (light/dark tokens) and theme-aware branding
- Notifications, Coupons, Admin audit log, Seller analytics
- Rating moderation, Delivery charges, Email OTP verification

## Recommended Next Steps

1. **Commit/review the uncommitted Priority 5 work** — review the working tree changes and commit them as a coherent unit.
2. **Decide the rating-moderation suspension rule** — warnings currently never auto-suspend; decide whether to add auto-suspension.
3. **Run targeted tests** — run the Priority 5 tests (email OTP, delivery charges, rating moderation, easypaisa/jazzcash) and fix the known assertion mismatches.
4. **Build the delivery-charges admin UI** — delivery charges are backend-only; add an admin frontend.
5. **Render seller analytics** — `topSellingProducts` and `salesTrend` are computed backend-only; add frontend rendering.

## Last Verification

- **Verification status**: Priority 1 automated tests 16/16 passed historically; frontend production build passed; manual UI/regression checks passed. Priority 2 and Priority 3 features manually verified on the frontend. Email OTP tests passed 4/4 in the last actual run.
- **Build/test status**: frontend `npm run build` succeeds; backend API tests configured. Full test pass/fail not fully re-verified in this audit.
- **Git state**: HEAD `3b07eec`, working tree dirty with uncommitted Priority 5 work.