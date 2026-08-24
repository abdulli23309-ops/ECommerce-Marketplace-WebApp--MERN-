# VendorVerse Architecture

> Derived from direct inspection of the current source tree. File paths are relative to the two project roots: `Ecommerce-FrontEnd/` (frontend) and `multi-vendor-mern/` (backend).
>
> **Project state (verified at HEAD `5847f7f`):** Phase 2 (Priorities 1–5) is complete and committed. Backend test suite: **33 files / 248 tests / 0 failures**. Frontend build: **PASS** (194 modules, non-blocking chunk-size advisory). Phase 2 manual regression: **PASS**.

## 1. System Overview

VendorVerse is a classic three-tier MERN application split into two independently deployable projects sharing one Git repository root:

```
Project4 (MernStack)/
├── Ecommerce-FrontEnd/     # React + Vite SPA
└── multi-vendor-mern/      # Express + MongoDB REST API
```

The frontend communicates with the backend exclusively over HTTP via Axios under `/api/v1/*`. There is no server-side rendering and no GraphQL layer.

## 2. Technology Stack

**Frontend** (`Ecommerce-FrontEnd/package.json`):
- React 19, React DOM 19; Vite (build/dev); Redux Toolkit 2 + React-Redux 9; React Router DOM 7; Axios; React Hook Form + Yup (+ resolvers); Stripe JS (`@stripe/react-stripe-js`, `@stripe/stripe-js`); `@react-oauth/google`; react-toastify, react-icons, react-spinners; jwt-decode; ESLint.

**Backend** (`multi-vendor-mern/package.json`):
- Node.js, Express 5, Mongoose 9, jsonwebtoken, bcrypt + bcryptjs, multer, express-validator, helmet, cors, morgan, cookie-parser, ioredis (Redis client at startup), stripe, nodemailer, dotenv, nodemon (dev).
- **Dev/test:** Vitest 4, Supertest, mongodb-memory-server (`npm test` → `vitest run`).

**Database**: MongoDB via Mongoose ODM, schema-per-domain (see §9). No raw SQL.

## 3. Repository Structure

### Frontend — `Ecommerce-FrontEnd/src/`
```
assets/branding/      Theme-aware logo assets (light/dark) + index.js export map
components/common/    BrandLogo, Logo, Footer, ThemeToggle, PermissionGate, Pagination,
                      NotificationDropdown, DashboardSwitcher, MetricCard, FreeDeliveryBadge
components/admin|seller|customer/  (dirs present; most role UI lives in pages/<role>/)
hooks/                useTheme, useIdleLogout
layouts/              AuthLayout, CustomerLayout, SellerLayout, AdminLayout
pages/auth/           LoginPage, RegisterPage, GoogleAuthButton
pages/customer/       Home, About, ProductListing, ProductDetail, Cart, Checkout, Orders,
                      OrderDetail, OrderConfirmation, Reviews, MyReviews, ReviewDetail,
                      Returns, CustomerReturns, CustomerReturnDetail, Wishlist, AddressBook,
                      Profile, Store, VerifyEmailPage
pages/seller/         ProductGrid, ProductForm, ProductDetailModal, Dashboard, Orders, StoreSettings,
                      Shipments, Reviews, Returns, Pending, Register
pages/admin/          Dashboard, Users, Sellers, Categories, Brands, ProductModeration,
                      ProductInspectionModal, Orders, Payments, Shipments, Returns, Refunds,
                      PermissionGroups, RolePermissionGroups, Coupons, AuditLog
routes/               ProtectedRoute (role-gated guard)
services/             One Axios module per domain (see §4)
store/                store.js + slices (auth, cart, wishlist, permissions, theme,
                      recentlyViewed, dashboardContext)
utils/                imageHelper, statusBadge (status→color), warningThresholds, orderStatus
index.css + styles/   theme tokens (index.css) + returns-luxury.css (tracking/timeline)
App.jsx               Route table (React Router v7) + dashboard-context bootstrap
```

### Backend (`multi-vendor-mern/app/`)
```
config/       env/config loading
controllers/  thin HTTP handlers, delegate to services
services/     business logic; services/payment/ + services/payment/processors/
repositories/ Mongoose query layer (only layer that queries models)
models/       Mongoose schemas (see §9)
middleware/   App.middleware, Auth.middleware (authenticate/requireRole/requirePermission),
              ErrorHandler.middleware, Validation.middleware
routes/       Express routers, mounted in app.js (GoogleAuth, webhook, Notification, Coupon,
              AdminAuditLog, DeliveryCharge, RatingModeration ...)
validations/  express-validator rule sets
helpers/      FileUpload.helper (Multer), Jwt.helper (token issuance/verification/hash)
utils/        ApiError, ApiResponse, AsyncHandler
app.js        Express app assembly + route mounting
router-stripe trick: Stripe webhook mounted BEFORE global body parsers (express.raw)
```

## 4. Frontend Architecture

- **Component structure**: page-level components under `pages/<role>/` hold most UI + data-fetching logic; shared cross-role UI (branding, theme toggle, permission gating, pagination, notification dropdown, dashboard switcher, metric cards, free-delivery badge) lives in `components/common/`.
- **Layouts**: `AuthLayout`, `CustomerLayout`, `SellerLayout`, `AdminLayout` wrap role routes via nested `<Route element={<XLayout/>}>` in `App.jsx`.
- **State**: Redux store with slices for `auth`, `cart`, `wishlist`, `permissions`, `theme`, `recentlyViewed`, `dashboardContext`. `fetchPermissions()` thunk populates the permission codes.
- **Services**: one Axios module per backend domain on a shared `axiosInstance`.
- **Routing/guards**: `react-router-dom` v7 route tree in `App.jsx`; `ProtectedRoute` (role-gated) + `PermissionGate` (permission-code gating).
- **Theme**: `useTheme` hook applies `theme.mode` to `document.documentElement`; `ThemeToggle` dispatches theme actions.

## 5. Layered Backend Architecture

**Route → Controller → Service → Repository → Model → MongoDB** (single searchable file). Repository is the **only** layer that queries Mongoose directly; services orchestrate and enforce business rules; controllers are thin HTTP wrappers using `ApiResponse`/`ApiError` and `asyncHandler`.

- **Routes** declare verbs/paths + `authenticate`/`requireRole`/`requirePermission` + validation chains → delegate to controller.
- **Controllers** wrap in `asyncHandler`, call services, respond via `ApiResponse`.
- **Services** hold business logic; `services/payment/` + `services/payment/processors/` isolate payment-processor logic.
- **Repositories** encapsulate queries/pagination/population.
- **Models** validate, index, and (for `User`) hash passwords on save.

## 6. Authentication & Email Verification

- JWT access tokens; rotating refresh tokens stored as SHA-256 hashes (never raw) with a TTL index.
- OAuth flows: normal register/login/refresh/logout, and **Google OAuth** (`GoogleAuth.controller/service/routes`, `GoogleAuthButton.jsx`). Google OAuth handles new registration and existing-account linking, sets `emailVerified: true`, and preserves role safety (a Google sign-in cannot escalate a role beyond the caller's real role).
- **Email OTP** (`EmailOtp.model`, `EmailOtp.service/controller/routes`, `Email.service.js`): OTP bcrypt-hashed; recipient derived from the authenticated user; 3-minute expiry; 3-minute resend cooldown; max 5 attempts; `User.emailVerified` gates checkout and seller application. `Email.service.js` uses Nodemailer SMTP when `EMAIL_PROVIDER=smtp`, else a development fallback logs the OTP to the console.
- Frontend: `VerifyEmailPage.jsx`, `emailOtpService.js`, `authSlice.setEmailVerified`.

## 7. Notifications Architecture

- `Notification.model.js` (`user → User`), `Notification.service.js` (creation + read-state + pagination), `Notification.controller.js`, `Notification.routes.js`.
- Backend emits notifications for order/shipment/return/refund events and seller-driven flows (seller application decisions, low-stock, low-rating warnings).
- Frontend: `NotificationDropdown.jsx` (`components/common/`) renders in-app notifications; `notificationService.js` talks to the API.

## 8. Coupon Architecture

- `Coupon` (code, `discountType` enum **`percentage | fixed | free_delivery`**, `discountValue`, `minOrderAmount`, `maxDiscountAmount`, `usageLimit`, `usageCount`, `isActive`, soft-delete partial-unique index) + `CouponUsage` (`coupon`, `user`).
- `Coupon.service.js` validates at checkout (active, unexpired, min-order met, usage limit not exceeded) and applies percentage caps / fixed amounts / free-delivery discount.
- Checkout (`Order.service.js`) totals as: `subtotal − discount + deliveryCharges − freeDeliveryDiscount = total`.
- Frontend: `AdminCouponsPage.jsx` (CRUD) + `adminCouponService.js`; checkout applies a coupon; confirmation/checkout display the discount.

## 9. Delivery Charges & Free Delivery

- `DeliveryCharge` model + service/controller/routes; **checkout integrates** per-store delivery via `calculateSellerDelivery`, applies threshold-based free delivery, and records `freeDeliveryDiscount` on the order.
- **Per-product seller free delivery** (`Product.freeDelivery`) surfaced via `FreeDeliveryBadge` on Listing / Store / Detail and accounted at checkout.
- **Coupon free delivery** (`discountType: free_delivery`) zeroes delivery charges for eligible carts.
- **Known gap:** no admin frontend management screen for delivery charges (backend + checkout implemented only).

## 10. Rating Moderation State

- `RatingModeration.service.js` + `RatingModeration.repository.js` manage product and seller warning state.
- State lives on `Product` and `SellerProfile`: `averageRating`, `lowRatingStatus`, `warningCount`, `warningHistory[]` (warnedBy/reason/warnedAt). Product low threshold 3.0; seller low threshold 2.5; max warnings 3.
- Warnings fire low-rating notifications; reaching the cap causes `RatingModeration.service.js` to **reject further warnings** (`Warning limit reached for this product`). There is **no automatic suspension**. Recovery re-reads the live average rating.
- Frontend thresholds centralized in `utils/warningThresholds.js`; admin UI in `ProductModerationPage`/`ProductInspectionModal`; seller low-rating warning banner on `SellerDashboardPage`.

## 11. Seller Analytics / Admin Analytics

- `Seller.dashboard.service.js` computes summary metrics, seller performance indicators, `topSellingProducts`, `salesTrend`, return/low-stock data.
- `SellerDashboardPage.jsx` **renders** top-selling products and the sales-trend view plus the low-rating warning banner. (Analytics were historically backend-only; frontend rendering was completed in Phase 2 and re-verified.)
- `Admin.dashboard.service.js` computes platform-wide stats for `AdminDashboardPage`.

## 12. Admin Audit Log

- `AdminAuditLog` model (`admin → User`, action, entity type/id, metadata, timestamp) + `AdminAuditLog.service/controller/routes`.
- Relevant administrative events (product, seller, catalog, refund, permission, and moderation actions) are recorded.
- Frontend `AdminAuditLogPage.jsx` lists entries with backend pagination via `adminAuditLogService.js`.

## 13. Payment Processors

- `PaymentFactory.createPaymentProcessor(method)` returns `StripeProcessor` | `CashOnDeliveryProcessor` | `EasyPaisaProcessor` | `JazzCashProcessor`; `Dummy`/test payment handled inline.
- **PayPal** remains only an enum/UI value (`Payment.method` includes `'PayPal'`) with **no** processor or factory branch — **Not implemented / deferred**.
- Provider-specific logic isolated under `services/payment/processors/`; `PaymentTransaction` enforces Stripe webhook idempotency (unique `stripeEventId`).
- Stripe webhook is mounted at `/api/v1/payments/webhook` **before** the global body parsers using `express.raw()`; `verifyWebhookSignature` uses `stripe.webhooks.constructEvent`. Locally unit-tested (invalid/missing signature → 400). A full Stripe→local end-to-end forwarding loop was **not** manually verified without external forwarding (e.g., Stripe CLI).

## 14. Dashboard Context Switching

- **Frontend-only, Redux-driven.** `dashboardContextSlice` holds `{ actualRole, activeDashboard }`. `App.jsx` derives `actualRole` from the user's real roles and sets the initial `activeDashboard`; `DashboardSwitcher.jsx` lets a user browse the Customer/Seller/Admin views appropriate to their context **without changing the backend-real role**. The JWT role stays unchanged; only the client's active view changes.
- `ProtectedRoute` and the layouts read `dashboardContext` to decide which view to present. This never mutates the backend role.

## 15. Automated Test Architecture

- Vitest + Supertest + mongodb-memory-server in `multi-vendor-mern/` (`npm test` → `vitest run`).
- **33 test files** organized as root-level domain tests + `tests/priority4/` (notifications, coupons, seller analytics, admin audit log, order-cancellation notification) + `tests/priority5/` (delivery charges, easypaisa/jazzcash, email OTP, Google auth, rating moderation, seller-own-product cart).
- Helpers: `tests/helpers/testDb.js` (in-memory DB), `tests/helpers/auth.js` (token generation).
- **Final verified result: 33 files / 33 passed, 248 tests / 248 passed, 0 failures.**

## 16. Data Model Summary (notable)

| Model | Key references | Notables |
|---|---|---|
| `User` | — | unique email; role enum `Customer/Seller/Admin`; hashed password; `emailVerified` |
| `RefreshToken` | `user → User` | unique tokenHash; TTL index |
| `Role` / `Permission` / `PermissionGroup` | `permissions[]`, `permissionGroups[]` | unique names, permission codes |
| `SellerProfile` | `user → User` | `status` (Pending/Approved/Rejected)**; rating-moderation fields (`averageRating`, `lowRatingStatus`, `warningCount`, `warningHistory[]`) |
| `Store` | `sellerProfile → SellerProfile` | — |
| `Product` | `store`, `category/subCategory/brand` | `averageRating`, `lowRatingStatus`, `warningCount`, `warningHistory[]`, `freeDelivery` |
| `Category`/`SubCategory`/`Brand` | — | soft-delete (`isDeleted` + partial unique index) |
| `Address` | `user → User` | one default per user |
| `Cart` / `CartItem` | `user → User` | one cart per user |
| `ParentOrder` | `customer → User` | `subtotal`, `discountAmount`, `deliveryCharges`, `freeDeliveryDiscount`, `totalAmount` |
| `SellerOrder` | `parentOrder → ParentOrder`, `store → Store` | item snapshot fields (`productNameSnapshot`, `unitPriceSnapshot`) |
| `Payment` | `parentOrder → ParentOrder` (1:1) | `method` enum incl. PayPal (unused); Stripe fields |
| `PaymentTransaction` | `payment → Payment` | unique `stripeEventId` (webhook idempotency) |
| `Shipment` | `sellerOrder → SellerOrder` (1:1) | embedded trackingHistory[] |
| `Review` | `customer/product/sellerOrder` | unique `(customer, product, sellerOrder)` |
| `Return` | `customer/product/sellerOrder/seller` | multi-stage status; unique returnNumber |
| `Refund` | `returnRequest → ReturnRequest` (**ref-name mismatch, see limits**), `payment → Payment` | unique returnRequest |
| `Notification` | `user → User` | — |
| `Coupon` / `CouponUsage` | `coupon`, `user` | `discountType` incl. `free_delivery`, usage limits |
| `AdminAuditLog` | `admin → User` | — |
| `DeliveryCharge` | — | — |
| `EmailOtp` | `user → User` | hashed OTP, expiry/attempts |

** Note: `SellerProfile.model.js` currently declares two `status` fields (duplicate definition). Both are present in source; flagged, not silently changed.

## 17. Key API Shape

- Backend pagination metadata shape: `{ page, pageSize, total, totalPages, ... }` across all paginated endpoints.
- New/major endpoints added in Phase 2: `/api/v1/notifications`, `/api/v1/coupons`, `/api/v1/admin/audit-logs`, `/api/v1/delivery-charges`, `/api/v1/rating-moderation`, `/api/v1/email-otp` (and Google auth under `/api/v1/google`), plus `/api/v1/payments/webhook` (mounted pre-body-parser).

## 18. Important Architectural Decisions (preserve)

1. Strict Route → Controller → Service → Repository → Model layering everywhere; repository-only Mongoose access.
2. Rotating, SHA-256-hashed refresh tokens with TTL.
3. Cart → multi-seller order splitting at checkout (one `ParentOrder`, N `SellerOrder`s; shipments/reviews/returns hang off `SellerOrder`).
4. Order-item snapshot fields preserve history independent of live `Product` edits.
5. Soft-deletion for taxonomy entities.
6. Semantic CSS-variable theming + shared `getStatusBadgeStyle()`; theme-aware branding (`BrandLogo`).
7. Backend-owned pagination shape; shared `Pagination` component + `.pagination`/`.page-btn`.
8. Payment processors isolated via `PaymentFactory` + `services/payment/processors/`.
9. Email OTP (bcrypt-hash, authed-user recipient) + Google OAuth (emailVerified).
10. **Dashboard context is a frontend view concern only — it must not change the backend role.**
11. Notifications, coupons, audit-log, seller analytics, delivery-charges, and rating-moderation follow the same service/repository layering.

## 19. Known Architectural Gaps
- **Delivery charges** — admin management UI not implemented (backend + checkout only).
- **Rating auto-suspension** — not implemented; warnings cap without suspending.
- **PayPal** — enum-only (no processor).
- **Product variants / advanced recommendations** — deferred.
- **Email delivery** — SMTP-gated; dev fallback logs OTP.
- **Stripe webhook** — signature verified locally; no verified end-to-end forward in this environment.