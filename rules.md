# VendorVerse Development Rules

> Binding constraints for any AI agent or human developer making changes to VendorVerse. Derived from the confirmed architecture (`architecture.md`) and product scope (`prd.md`). They exist to prevent regressions in a codebase stabilized through Phase 1, Phase 14A, and the full Phase 2 (Priorities 1–5) effort.

## Rule 1 — Source Code Is Authoritative
The current contents of `Ecommerce-FrontEnd/` and `multi-vendor-mern/` always win over historical reports, prior chat summaries, or this documentation set if a conflict is found. Fix the documentation (or flag it in `memory.md`) rather than trusting the old report.

## Rule 2 — Preserve Existing Functionality
Do not modify working behavior unless the task explicitly requires it. A bug fix touches only the code path responsible for the bug.

## Rule 3 — Minimal Changes
Modify only the files necessary for the requested feature/fix.

## Rule 4 — No Unnecessary Refactoring
Do not refactor unrelated code, rename variables, or restructure components unless refactoring was the explicit task.

## Rule 5 — No Unauthorized Architecture Changes
Do not change the following without explicit justification and approval:
- The Route → Controller → Service → Repository → Model layering (backend).
- Authentication (JWT issuance, rotating hashed refresh tokens, email OTP verification, Google OAuth).
- Authorization (`requireRole`/`requirePermission`, `Role`/`Permission`/`PermissionGroup` shape).
- Database schema/relationships for existing models.
- Existing API request/response contracts.

## Rule 6 — Inspect Before Modifying
Trace the full path before changing any behavior: `Frontend Page/Component → services/<domain>Service.js → Axios → Route → Controller → Service → Repository → Model`. Do not guess a layer's behavior — open and read the file.

## Rule 7 — Preserve Tested/Stabilized Work
Protected areas (see `memory.md` "Protected Working Areas"): auth & authorization, products, cart/wishlist/checkout/multi-seller splitting, orders/payments/shipments, reviews, returns/refunds, pagination, theme, notifications/coupons/audit-log/seller-analytics, rating moderation/delivery charges/email OTP.

## Rule 8 — Do Not Duplicate Existing Logic
Reuse Axios service modules; `utils/statusBadge.js` (`getStatusBadgeStyle()`); `utils/imageHelper.js`; `utils/warningThresholds.js`; `utils/orderStatus.js`; Redux slices (`authSlice`, `cartSlice`, `wishlistSlice`, `permissionsSlice`, `themeSlice`, `recentlyViewedSlice`, `dashboardContextSlice`); backend `ApiError`/`ApiResponse`/`AsyncHandler`.

## Rule 9 — Theme Rules
Do not introduce hardcoded hex/rgb colors or inline color styles in new/edited components; use the CSS custom properties in `index.css`. New code must not copy the remaining `.hero-*` literals; migrating `.hero-banner`/`.hero-subtitle` is a separate, explicitly scoped cleanup.

## Rule 10 — Status Helper
Any status pill/badge must use `getStatusBadgeStyle()` from `utils/statusBadge.js`; new statuses go into `STATUS_STYLES`.

## Rule 11 — Pagination
Use backend pagination metadata (`page`/`pageSize`/`total`/`totalPages`) when present; reuse the shared `Pagination` component (`components/common/Pagination.jsx`) and `.pagination`/`.page-btn`. New paginated endpoints follow the repository-layer pattern.

## Rule 12 — API Contracts
Do not silently change existing request/response shapes. If a contract change is unavoidable, update both sides and record it in `memory.md`.

## Rule 13 — Security
Do not weaken: bcrypt cost 12; JWT expiry / rotating hashed refresh tokens; `requireRole`/`requirePermission`; Helmet/CORS allow-list; Multer upload limits; email OTP (hashed, authed-user recipient, 3-min expiry, 3-min cooldown, max 5 attempts); Google OAuth (emailVerified, role safety).

## Rule 14 — Testing (current framework)
- **Framework:** Vitest + Supertest + mongodb-memory-server in `multi-vendor-mern/` (`npm test` → `vitest run`).
- **Final verified baseline: 33 test files / 248 tests / 0 failures** (the full suite passes together). Do not regress this.
- Do not claim a result other than what was executed in the current environment; if a run cannot complete (environmental limitation), document it accurately instead of asserting pass.
- Every meaningful backend change should be verified end-to-end through the full layer stack.
- Every meaningful frontend change should be verified with `npm run build` and a manual walkthrough.

## Rule 15 — Frontend Build Gate
Frontend changes must keep the production Vite build passing. The current build **PASSes** (194 modules). A **non-blocking chunk-size advisory** (bundle >500 kB) is present — treat bundle optimization as future work, not as a build failure.

## Rule 16 — Complete Files
When asked to provide a modified source file for copy/paste, provide the complete file rather than a diff/fragment.

## Rule 17 — No Guessing
If required behavior is unclear from source, say so and inspect further rather than inventing endpoints, models, fields, or components that do not exist.

## Rule 18 — Regression Protection
Every change must preserve all functionality marked as Complete in `prd.md` §7 / `phases.md`. Call out any risk to those items before proceeding.

## Rule 19 — Two-Project Boundary
`Ecommerce-FrontEnd/` and `multi-vendor-mern/` are separate npm projects with separate `package.json`/`node_modules`. No cross-project imports; install deps only in the project that needs them.

## Rule 20 — Documentation Maintenance
When a change materially affects product scope, architecture, business rules, or the checkpoint, update the relevant docs (`prd.md`, `architecture.md`, `design.md`, `rules.md`, `phases.md`, `memory.md`). `memory.md` must be updated at the end of any meaningful session.

## Rule 21 — Known Verification Items Are Not License to "Fix" Silently
Flagged items (see `memory.md`) are for verification, not pre-approved silent fixes. Scope them explicitly before changing.

## Rule 22 — Email Verification Rules
- Normal registration sets `User.emailVerified: false`; Google OAuth sets `true`.
- Checkout and seller application require `emailVerified: true` (backend + frontend).
- OTP: 3-min expiry, 3-min resend cooldown, max 5 attempts, bcrypt-hashed, recipient from the authenticated user.
- `Email.service.js` uses Nodemailer SMTP when `EMAIL_PROVIDER=smtp`; dev fallback logs OTP. Do not claim production SMTP delivery unless configured and verified.

## Rule 23 — Protect the Stabilized Phase-2 Domains (all committed)
The following were added/committed during Phase 2 and must be preserved/refactored only with explicit task scope: email OTP, Google OAuth, delivery charges, rating moderation, JazzCash/EasyPaisa processors, seller-own-product cart rule, notifications, coupons, audit log, seller-analytics rendering, and dashboard-context switching. Phase 2 work is fully committed at HEAD `5847f7f`.

## Rule 24 — Dashboard Context Is a Frontend View Concern
`dashboardContext` (`activeDashboard`/`actualRole`) selects which **view** the client renders. It must **never** change the backend-real role or the JWT. Preserve: seller cannot add own product to cart; seller can purchase other sellers' products; backend authorization untouched.

## Rule 25 — Known Open Verification Items (not pre-approved fixes)
1. `Refund.returnRequest` `ref: 'ReturnRequest'` vs registered `Return` model.
2. Avatar upload comment (10MB) vs 20MB Multer limit (avatar error text says 2MB).
3. `CodProcessor.js` orphaned (factory uses `CashOnDeliveryProcessor.js`).
4. Duplicate `status` field in `SellerProfile.model.js`.
5. Hardcoded `.hero-banner`/`.hero-subtitle` colors.
Scope each as its own task before changing. Deferred scope (not now): PayPal processor, product variants, advanced recommendations, seller auto-suspension, delivery-charge admin UI, production email, Stripe webhook end-to-end.