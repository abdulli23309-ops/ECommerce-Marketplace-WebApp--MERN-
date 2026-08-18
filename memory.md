# VendorVerse Project Memory

> Living checkpoint. Update this file at the end of any meaningful work session so a new AI session (or a human) can pick up context without re-reading the full history. Keep it concise — details belong in `prd.md`/`architecture.md`/`design.md`; this file is the pointer, not the encyclopedia.

## Current Project State

VendorVerse is a functionally complete multi-vendor MERN marketplace (Customer / Seller / Admin roles) covering auth, catalog, cart/wishlist, checkout with multi-seller order splitting, payments (Dummy/COD/Stripe), shipments, reviews, returns/refunds, permission-based authorization, backend pagination, and a light/dark theme system. See `prd.md` §9 for the full feature-status table.

## Current Phase

**Priority 1, Priority 2, and Priority 3 — COMPLETE.**

Confirmed by direct source inspection and verification:
- Priority 1: regression/bug audit, order status timeline, low-stock indicators, related-products fix, reusable Pagination component, automated/API tests.
- Priority 2: recently viewed products, search autocomplete/suggestions, additional seller performance indicators, minor UI/UX improvements.
- Priority 3: light/dark theme system.

Next major phase: **Priority 4 — Medium-Level E-commerce Features** (not started).

## Last Completed Work

| ID | Item | Status |
|---|---|---|
| P1-1 | Regression/bug audit and fixes | ✅ Complete |
| P1-2 | Order Status History/Timeline | ✅ Complete |
| P1-3 | Low-Stock Indicators on Seller Dashboard | ✅ Complete |
| P1-4 | Related Products backend refinement | ✅ Complete |
| P1-5 | Reusable Pagination Component | ✅ Complete |
| P1-6 | Automated/API testing | ✅ Complete |
| P2-1 | Recently Viewed Products | ✅ Complete |
| P2-2 | Search Autocomplete / Suggestions | ✅ Complete |
| P2-3 | Additional Seller Performance Indicators | ✅ Complete |
| P2-4 | Minor UI/UX Improvements | ✅ Complete |
| P3-1 | Light/Dark Theme system | ✅ Complete |
## Important Architectural Decisions

(Full list in `architecture.md` §13 — summary here)

- MERN stack, two independent npm projects (`Ecommerce-FrontEnd/`, `multi-vendor-mern/`) in one repo.
- Backend: strict Route → Controller → Service → Repository → Model layering; repositories are the only layer that queries Mongoose directly.
- Rotating, SHA-256-hashed refresh tokens (never raw) with TTL index.
- Checkout fans a single `ParentOrder` out into per-seller `SellerOrder`s; most downstream domains (shipments, reviews, returns) hang off `SellerOrder`.
- Snapshot fields (`productNameSnapshot`, `unitPriceSnapshot`) preserve historical order data independent of live `Product` edits.
- Soft-deletion (`isDeleted` + partial unique index) for `Category`/`SubCategory`/`Brand`.
- Semantic CSS-variable theming; shared `getStatusBadgeStyle()` status-color utility.
- Backend pagination metadata shape: `{ page, pageSize, total, totalPages, ... }`, consistent across all paginated endpoints.

## Protected Working Areas

Do not modify without explicit task scope covering them (see `rules.md` Rule 7):
Authentication & Authorization · Products (seller/admin/public) · Cart/Wishlist/Checkout/Order-splitting · Orders/Payments/Shipments · Reviews (incl. pagination) · Returns/Refunds state machine · Pagination (backend contract) · Theme system & branding.

## Known Remaining Work

**Priority 1** ✅ Complete
**Priority 2** ✅ Complete
**Priority 3** ✅ Complete
**Priority 4** (🔴 not started): notifications · coupons/discounts · seller analytics · admin audit log.
**Priority 5** (🔴 not started): product variants · advanced recommendations · other optional marketplace features.

Full detail in `phases.md`.


## Known Issues / Verification Items

Only source-confirmed or explicitly flagged items — do not silently "fix" these; scope them as their own task first (see `rules.md` Rule 20):

1. **Avatar upload limit comment mismatch** — source comment says "10MB for testing" but the configured Multer limit is 20MB. Verify intended limit before changing either the code or the comment.
2. **`Refund.returnRequest` ref name** — the `Refund` model's `returnRequest` field is declared with `ref: 'ReturnRequest'`, but the actual registered Mongoose model is `Return`. Populate calls may be silently failing to resolve; verify against a live populate call before changing.
3. **PayPal / JazzCash / EasyPaisa** — present only as `Payment.method` enum values; no confirmed processor/service implementation found. Treat as not implemented, not as a bug.
4. **Hardcoded colors outside the D-02/D-03 scope** — `.dashboard-footer`, `.stat-card`/`.stat-label`/`.stat-card-highlight`, and `.hero-banner`/`.hero-subtitle` still use literal hex/rgba values rather than theme tokens (see `design.md` §3). Not yet scoped as a cleanup task.
5. **No automated test suite** — neither `package.json` defines a test script; no test files found in either project.

## Next Immediate Task

Begin **Priority 4 — Medium-Level E-commerce Features**. The likely first item is the In-App Notification System for orders, shipments, returns, and refunds. Conduct a short readiness audit before implementation, following the same disciplined workflow used for Priority 1 and Priority 2.

## Last Verification

- **Verification status**: Priority 1 automated tests 16/16 passed, frontend production build passed, manual UI/regression checks passed. Priority 2 and Priority 3 features manually verified on the frontend.
- **Build/test status**: frontend `npm run build` succeeds; backend API tests pass.
- **Git state**: see repository history for the most recent commits after `4460ff0`.