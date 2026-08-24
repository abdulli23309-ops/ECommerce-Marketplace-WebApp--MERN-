# VendorVerse Product Requirements Document

> Source of truth: derived from direct inspection of the current VendorVerse codebase (frontend: `Ecommerce-FrontEnd/`, backend: `multi-vendor-mern/`) and the final Phase 2 regression. Where any prior report or older checkpoint conflicted with the current source, source was treated as authoritative.
>
> **Project state (verified at HEAD `5847f7f`):** Phase 2 (Priorities 1–5) is **complete** and committed. Final automated test run: **33 test files / 248 tests / 0 failures**. Frontend production build: **PASS** (194 modules transformed; non-blocking Vite chunk-size advisory only). Phase 2 manual regression: **PASS**. Deferred items remain explicitly flagged below.

## 1. Product Overview

VendorVerse is a **multi-vendor e-commerce marketplace** built on the MERN stack (MongoDB, Express, React, Node.js). It connects three participant types — **Customers**, **Sellers**, and **Admins** — on a single platform where independent sellers run their own stores and list products, customers browse a unified catalog and purchase from multiple sellers in one checkout, and admins govern the marketplace (seller approval, product moderation, disputes, refunds, and platform configuration).

The frontend is a Vite React 19 SPA using Redux Toolkit, React Router, and Axios. The backend is an Express 5 REST API backed by MongoDB via Mongoose, with JWT-based authentication and a role/permission authorization layer.

Beyond the core marketplace, VendorVerse Phase 2 adds: **in-app notifications**, **coupons/discounts**, **admin audit logging**, **seller analytics** (backend-computed and rendered on the seller dashboard), **rating moderation** (product + seller, warning-based), **delivery charges**, **email OTP verification**, **Google OAuth**, **JazzCash/EasyPaisa sandbox payment**, **coupon free-delivery**, **per-seller and per-product free delivery**, and **dashboard-context switching**. See §9 for the final status of each.

## 2. Product Purpose

VendorVerse solves the problem of running a **multi-seller marketplace** rather than a single-store shop:

- Independent sellers need their own storefront, product catalog, order queue, and shipment/returns workflow without seeing other sellers' data.
- Customers need to shop across many sellers as if it were one store — a single cart/checkout can contain items from multiple sellers, which are split into per-seller `SellerOrder`s for fulfillment.
- The platform operator (Admin) needs oversight and governance tools: seller approval, product moderation, dispute resolution (returns/refunds), payment visibility, notification oversight, coupon administration, and audit logging.

## 3. Target Users

Confirmed roles (from `User.model.js`, `enum: ['Customer', 'Seller', 'Admin']`) and the route-guarding logic:

| Role | Description |
|---|---|
| **Customer** | Default role on registration. Shops, checks out, tracks orders, reviews, requests returns. Must have `emailVerified: true` to check out. |
| **Seller** | A Customer who applied and was approved (`SellerProfile.status: Approved`). Operates a `Store`, manages products, fulfills orders/shipments, responds to reviews/returns. Must have `emailVerified: true` to apply. |
| **Admin** | Platform operator. Manages users, seller approvals, product moderation, categories/brands, orders, payments, shipments, returns, refunds, coupons, audit logs, and the permission system. |

No other roles exist in the source. Do not assume additional roles (e.g., "Super Admin") unless added to `User.model.js` and the authorization layer.

## 4. Core User Journeys

### Customer
- Register / Login (`/register`, `/login`) — JWT-based, roles/permissions embedded in the access token. Normal registration sets `emailVerified: false`; Google OAuth sets `emailVerified: true`.
- **Verify email** (`VerifyEmailPage`) — OTP with 3-minute expiry, 3-minute resend cooldown, max 5 attempts; recipient derived from the authenticated user. **Checkout and seller application require `emailVerified: true`.**
- Browse products (public): `HomePage`, `ProductListingPage`, `ProductDetailPage`, `StorePage`.
- Recently-viewed products section on the home page (localStorage-backed, max 10, deduplicated).
- Search with autocomplete/suggestions (debounced dropdowns on Home and Listing).
- Cart (`CartPage`) — one per user, server-persisted; a seller cannot add their own product to their cart.
- Wishlist (`WishlistPage`).
- Checkout (`CheckoutPage`) — creates one `ParentOrder` split into one `SellerOrder` per distinct seller; applies delivery charges, per-product/per-seller free delivery, and coupon discounts (percentage / fixed / free-delivery).
- Payment — Stripe payment intent, Cash-on-Delivery, and JazzCash/EasyPaisa sandbox via `PaymentFactory`. **PayPal remains an enum value only (not implemented).**
- Order history/detail/confirmation (`OrderHistoryPage`, `OrderDetailPage`, `OrderConfirmationPage`); cancellation (`PUT /api/v1/orders/:id/cancel`). Order detail includes a status timeline/tracker.
- Leave a review per purchased seller-order line item (`ReviewPage`; one per customer+product+sellerOrder). Manage and view reviews (`MyReviewsPage`, `ReviewDetailPage`).
- Request and track returns (`RequestReturnPage`, `CustomerReturnsPage`, `CustomerReturnDetail`).
- Profile and address book (`ProfilePage`, `AddressBookPage`) — one default address per user.
- Apply to become a Seller (`SellerRegisterPage` → `POST /api/v1/seller/apply`), then wait on `SellerPendingPage` until Admin approval.

### Seller
- Apply / create Seller profile (`sellerController.applyAsSeller`, `createProfile`) — gated behind Admin approval and `emailVerified: true`.
- Dashboard (`SellerDashboardPage` / `GET /api/v1/seller/dashboard`) — summary metrics, low-stock indicators, seller performance indicators, low-rating warning banner, **top-selling products, and sales trend (rendered)**.
- Product management (`SellerProductsPage`, `ProductGrid`, `ProductForm`, `ProductDetailModal`) — CRUD on own products, image upload (max 5, 10MB each, jpeg/jpg/png/gif/webp), per-product free-delivery flag.
- Store settings (`StoreSettingsPage`).
- Order management (`SellerOrdersPage`) — view the seller's `SellerOrder`s, update fulfillment status.
- Shipment management (`ShipmentManagementPage`, `ShipmentModal`) — one shipment per `SellerOrder`, tracking number/carrier/status.
- Reviews (`SellerReviewsPage`) — view and reply to product reviews.
- Returns (`SellerReturnsPage`) — handle return requests for their store.
- Notifications (`NotificationDropdown`) — order/shipment/return/refund/low-stock/low-rating events.

### Admin
- User management (`AdminUsersPage`), seller approval (`SellerApprovalPage`).
- Product moderation (`ProductModerationPage`, `ProductInspectionModal`) — moderation status, global stats, per-product review inspection, low-stock and low-rating warnings.
- Delivery charges are administered by config; **no dedicated admin management screen exists** (see §11 limitation 5).
- Category/SubCategory/Brand management (`AdminCategoriesPage`, `AdminBrandsPage`) — CRUD with soft-delete.
- Orders/Payments/Shipments overview (`AdminOrdersPage`, `AdminPaymentsPage`, `AdminShipmentsPage`).
- Returns management (`ReturnsManagementPage`) — first-line review before routing to seller.
- Refunds (`RefundManagementPage`) — create/view refunds tied to returns.
- Coupons (`AdminCouponsPage`) — create/manage coupons (percentage/fixed/free-delivery, min-order, usage limit).
- Audit log (`AdminAuditLogPage`) — paginated view of administrative actions.
- Permission administration (`PermissionGroupsPage`, `RolePermissionGroupsPage`).
- Dashboard context switching — an Admin can also browse Customer views and (if the flow permits) Seller views without changing the backend role.

## 5. Roles & Permissions

Authorization is enforced on the backend with `authenticate` (JWT) + `requireRole('Seller'|'Admin')` and/or `requirePermission(<code>)` middleware; the frontend mirrors it with `ProtectedRoute` (`allowedRoles`) and `PermissionGate`.

| Capability | Customer | Seller | Admin |
|---|---|---|---|
| Browse catalog / product detail / store pages | ✅ | ✅ | ✅ |
| Cart / wishlist / addresses / own reviews / returns | ✅ | — | — |
| Checkout / place orders | ✅ | — | — |
| Manage own store & products | — | ✅ (own store only) | — |
| View/manage own `SellerOrder`s | — | ✅ | — |
| Global user management | — | — | ✅ |
| Seller approval | — | — | ✅ |
| Product moderation (status/stats) | — | — | ✅ |
| Category/SubCategory/Brand write | — | — | ✅ |
| Return: initial review | — | — | ✅ |
| Return: fulfillment decision | — | ✅ (own store) | — |
| Refund creation | — | — | ✅ |
| Permission/role administration | — | — | ✅ |
| Coupon management | — | — | ✅ |
| Audit log viewing | — | — | ✅ |
| Rating moderation (warns) | — | — | ✅ |

## 6. Non-Functional Requirements (confirmed from source)

- **Security**: bcrypt password hashing (cost 12), JWT access tokens, rotating refresh tokens stored as SHA-256 hashes with a TTL expiry index, Helmet headers, restricted CORS allow-list, OTPs bcrypt-hashed with recipient derived from the authenticated user.
- **API structure**: versioned REST under `/api/v1/*`; shared `ApiResponse`/`ApiError`; centralized `asyncHandler` and `errorHandler`.
- **Data consistency**: unique/partial-unique Mongoose indexes enforce one-default-address, one-cart, one-wishlist, one-review-per-purchase, one-shipment-per-order, one-payment-per-order.
- **Theme**: light/dark CSS-custom-property theming via `data-theme`, persisted to `localStorage`, with OS-preference fallback.
- **Pagination**: backend-owned metadata shape `{ page, pageSize, total, totalPages }`, rendered with the shared `Pagination` component and `.pagination`/`.page-btn` classes.
- **Responsive UI**: layout components and section-organized CSS; core grids are flex/`auto-fill minmax`. Full mobile-breakpoint coverage is not independently verified against an automated responsive test suite.
- **Error handling**: centralized Express error middleware + custom `ApiError`.
- **Maintainability**: strict Route → Controller → Service → Repository → Model layering.

Do not assume un-evidenced requirements (uptime SLAs, load targets, accessibility conformance level, etc.).

## 7. Feature Status (Final)

Legend: ✅ **Complete** = implemented and verified in current source. 🔴 **Deferred** = explicitly deferred / not implemented. ⚠️ **Known limitation** = implemented with a documented gap. "Committed" = present in a HEAD history commit (all Phase 2 work is now committed).

| Feature | Status |
|---|---|
| Auth (register/login/refresh/logout) | ✅ Complete |
| Role & permission authorization | ✅ Complete |
| Email OTP verification (`User.emailVerified`, OTP bcrypt-hashed, 3-min expiry, cooldown, max 5 attempts, dev SMTP fallback) | ✅ Complete (delivery ⚠️ SMTP-gated) |
| Google OAuth login/registration + account linking | ✅ Complete |
| Seller application & admin approval | ✅ Complete |
| Store management | ✅ Complete |
| Category/SubCategory/Brand management | ✅ Complete |
| Product CRUD (seller) | ✅ Complete |
| Public product browsing/detail/store | ✅ Complete |
| Cart (incl. seller-cannot-add-own-product rule) | ✅ Complete |
| Wishlist | ✅ Complete |
| Address book | ✅ Complete |
| Checkout & multi-seller order splitting | ✅ Complete |
| Payments: Dummy / COD / Stripe | ✅ Complete |
| Payments: JazzCash / EasyPaisa sandbox | ✅ Complete |
| Payments: PayPal | 🔴 Deferred (enum/config value only; no processor) |
| Order history, detail, cancellation | ✅ Complete |
| Order status history / timeline | ✅ Complete |
| Shipment tracking (per `SellerOrder`, tracking history) | ✅ Complete |
| Reviews (create/list/reply; one per purchase) | ✅ Complete |
| Review pagination | ✅ Complete |
| Returns workflow (customer → admin → seller) | ✅ Complete |
| Refunds (admin-created) | ✅ Complete |
| Admin product moderation + global stats + review inspection | ✅ Complete |
| Admin dashboards (users/orders/payments/shipments/returns/refunds) | ✅ Complete |
| Permission group / role administration | ✅ Complete |
| Light/dark theme (token-based, theme-aware branding) | ✅ Complete |
| Backend pagination | ✅ Complete |
| Reusable frontend Pagination component | ✅ Complete |
| Recently viewed products | ✅ Complete |
| Search autocomplete / suggestions | ✅ Complete |
| Seller performance indicators | ✅ Complete |
| Order status timeline step tracker | ✅ Complete |
| Low-stock indicators | ✅ Complete |
| Related products (backend refinement) | ✅ Complete |
| In-app notifications + dropdowns | ✅ Complete |
| Coupons (percentage / fixed / free-delivery, min-order, usage limit, checkout validation) | ✅ Complete |
| Admin audit log (paginated) | ✅ Complete |
| Seller analytics (top-selling products + sales trend, **rendered on seller dashboard**) | ✅ Complete |
| Rating moderation — product & seller (warnings, history, recovery, cap; **no auto-suspension**) | ✅ Implemented (auto-suspend deliberately NOT implemented) |
| Delivery charges (per-seller config, calculations, threshold free delivery, checkout display) | ✅ Backend + checkout Complete; ⚠️ **Admin UI not implemented** |
| Seller free delivery (product-level) | ✅ Complete |
| Coupon free delivery | ✅ Complete |
| Dashboard context switching (Customer/Seller/Admin) | ✅ Complete (frontend context only; backend role unchanged) |
| Product variants (size/color/SKU/variant inventory) | 🔴 **Deferred** |
| Advanced / ML recommendations | 🔴 **Deferred** (basic related-products & recently-viewed are separate and Complete) |

## 8. Roadmap (Completed Phase 2 / After Phase 2)

### Phase 2 — All Priorities Complete
- **Priority 1** — ✅ Complete: regression/bug fixes; order status history/timeline; low-stock indicators; related-products backend refinement; reusable Pagination component; automated/API test suite.
- **Priority 2** — ✅ Complete: recently viewed products; search autocomplete/suggestions; seller performance indicators; customer/seller/admin UI/UX improvements.
- **Priority 3** — ✅ Complete: full light/dark theme across cards, forms, tables, navigation, modals, text/borders/components; theme-aware branding.
- **Priority 4** — ✅ Complete: notifications; coupons (incl. free-delivery type); admin audit log; seller analytics (**including seller-dashboard rendering**).
- **Priority 5** — ✅ Complete/Implemented: seller & product rating moderation (warning-based, no auto-suspension); EasyPaisa & JazzCash sandbox; email OTP verification; Google OAuth; delivery charges; seller free delivery; coupon free delivery; dashboard-context switching.
- **Final Phase 2 Regression** — ✅ PASS (see §10).

### After Phase 2 (Deferred / Future)
- **Product variants** (size/color/SKU/variant-level inventory) — 🔴 Deferred.
- **Advanced recommendations / ML recommendations** — 🔴 Deferred.
- **PayPal as a payment processor** — 🔴 Deferred (enum value present only).
- **Seller Suspension & Appeal System** — future work (rating warnings currently cap at the defined maximum and do **not** auto-suspend).
- **Delivery-charge Admin management UI** — future work (backend + checkout exist; no admin screen).
- **Production email delivery** — future work (currently SMTP-gated with a development fallback).
- **Frontend build bundle optimization** — address the non-blocking Vite chunk-size advisory (>500 kB).
- **Stripe webhook end-to-end verification** via external forwarding (e.g., Stripe CLI) — to be performed when real forwarding credentials/setup are available.

## 9. Known Limitations & Verification Items (Do not silently "fix")

These are documented as-is against the current source. They are flagged for verification/scope, not pre-approved for silent changes (see `rules.md` Rule 20 / `memory.md`).

1. **PayPal** — enum/UI value only; no completed payment processor. **Not implemented / deferred.**
2. **Product variants** (size/color/SKU) — deferred; single-SKU product model.
3. **Advanced recommendations** — deferred; only basic related-products + recently-viewed are implemented.
4. **Rating moderation & auto-suspension** — warnings cap at the configured maximum and do **not** automatically create a seller/product suspension. Auto-suspension is a future business decision.
5. **Delivery-charge Admin UI** — backend + checkout integration implemented; **no admin-facing management screen**.
6. **Email delivery** — `Email.service.js` uses Nodemailer SMTP when `EMAIL_PROVIDER=smtp`, otherwise the development fallback logs the OTP to the console. Production SMTP delivery is not claimed.
7. **Stripe webhook** — signature verification is implemented (`stripe.webhooks.constructEvent`) and covered by a local unit test; a full end-to-end Stripe→local forwarding loop was **not** manually verified in this environment.
8. **Flagged source items** (unchanged, still present in current source):
   - `Refund.returnRequest` declares `ref: 'ReturnRequest'` while the registered model is `Return`.
   - Avatar upload: Multer limit is 20 MB while the comment reads "10 MB for testing" (and the avatar error text says "2 MB").
   - `CodProcessor.js` is unused/orphaned; `PaymentFactory` uses `CashOnDeliveryProcessor.js`.
   - `SellerProfile.model.js` contains a **duplicate `status` field** (two separate declarations).
   - Hardcoded CSS colors remain in `.hero-banner`/`.hero-subtitle` (`.dashboard-footer` and `.stat-card` were migrated to theme tokens during Phase 2).

## 10. Final Verified Build & Test State

- **Backend automated tests**: **33 test files / 33 passed**, **248 tests / 248 passed**, **0 failures** (Vitest + Supertest + mongodb-memory-server). The full suite passed together.
- **Frontend production build**: **PASS** — 194 modules transformed, built successfully. A **non-blocking Vite chunk-size advisory** (>500 kB bundle) is present; it does not fail the build.
- **Phase 2 manual regression**: **PASS** — documented coverage across Authentication, Authorization, Customer/Seller/Admin workflows, Cart, Checkout, Multi-seller order splitting, COD, EasyPaisa, JazzCash, Coupons, Orders, Shipments, Reviews, Rating moderation, Returns, Refunds, Notifications, Permissions, Theme/UI.
- Defects found during regression were fixed and re-verified, including: COD payment messaging/status; successful wallet order processing; currency formatting; missing product images; product rating recalculation timing; seller-warning data visibility; product-moderation low-rating state; customer order-tracking redesign; product inspection modal overlay; email OTP redirect; customer return-detail rendering/build.