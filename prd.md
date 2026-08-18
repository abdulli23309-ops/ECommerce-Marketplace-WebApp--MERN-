# VendorVerse Product Requirements Document

> Source of truth: this document is derived from direct inspection of the VendorVerse codebase (frontend: `Ecommerce-FrontEnd/`, backend: `multi-vendor-mern/`). Where prior reports conflicted with source code, source code was treated as authoritative.

## 1. Product Overview

VendorVerse is a **multi-vendor e-commerce marketplace** built on the MERN stack (MongoDB, Express, React, Node.js). It connects three types of participants — **Customers**, **Sellers**, and **Admins** — inside a single platform where independent sellers run their own stores, list products, and fulfill orders, while customers browse a unified catalog, purchase from multiple sellers in one checkout, and admins govern the marketplace (approvals, moderation, disputes, and platform configuration).

The frontend is a Vite-powered React 19 single-page application using Redux Toolkit for state, React Router for navigation, and Axios for API communication. The backend is an Express 5 REST API backed by MongoDB via Mongoose, with JWT-based authentication and a role/permission authorization layer.

## 2. Product Purpose

VendorVerse solves the problem of running a **multi-seller marketplace** rather than a single-store shop:

- Independent sellers need their own storefront, product catalog, order queue, and shipment/returns workflow without seeing other sellers' data.
- Customers need to shop across many sellers as if it were one store — a single cart and checkout can contain items from multiple sellers, which are then split into per-seller orders for fulfillment.
- The platform operator (Admin) needs oversight tools: seller approval, product moderation, dispute resolution (returns/refunds), payment visibility, and fine-grained permission control, without being a seller or customer themselves.

## 3. Target Users

Confirmed user roles (from `User.model.js`, `enum: ['Customer', 'Seller', 'Admin']` and the route-guarding logic across the backend/frontend):

| Role | Description |
|---|---|
| **Customer** | Default role on registration. Shops, checks out, tracks orders, leaves reviews, requests returns. |
| **Seller** | A Customer who has applied and been approved (`SellerProfile.status: Approved`). Operates a `Store`, manages products, fulfills orders/shipments, responds to reviews and returns. |
| **Admin** | Platform operator. Manages users, seller approvals, product moderation, categories/brands, orders, payments, shipments, returns, refunds, and the permission system. |

No other roles exist in the source. Do not assume additional roles (e.g., "Super Admin", "Support Agent") unless added to `User.model.js` and the authorization layer.

## 4. Core User Journeys

### Customer
- Register / Login (`/register`, `/login`) — JWT-based, roles/permissions embedded in access token.
- Browse products (public, unauthenticated): `HomePage`, `ProductListingPage`, `ProductDetailPage`, `StorePage` (per-seller storefront).
- Add to cart / manage cart (`CartPage`) — cart persists per-user server-side (`Cart` model, one cart per user).
- Wishlist (`WishlistPage`).
- Checkout (`CheckoutPage`) — creates a `ParentOrder` which is split into one `SellerOrder` per distinct seller in the cart.
- Payment — Stripe payment intent flow and Cash-on-Delivery / dummy payment flow (`Payment.routes.js`, `Payment.model.js` `method: ['Dummy','CashOnDelivery','Stripe','PayPal','JazzCash','EasyPaisa']` — note: only Dummy/COD/Stripe have confirmed working service logic; PayPal/JazzCash/EasyPaisa exist only as enum values with no confirmed processor implementation).
- Order history and detail (`OrderHistoryPage`, `OrderDetailPage`, `OrderConfirmationPage`); order cancellation (`PUT /api/v1/orders/:id/cancel`).
- Leave a review per purchased seller-order line item (`ReviewPage`, one review per customer+product+sellerOrder, enforced by a unique compound index).
- Request a return (`RequestReturnPage`) and track it (`ReturnHistoryPage`, `ReturnDetailPage`, `CustomerReturnsPage`, `CustomerReturnDetail`).
- Profile and address book management (`ProfilePage`, `AddressBookPage`) — one default address per user enforced at the DB level.
- Apply to become a Seller (`SellerRegisterPage` → `POST /api/v1/seller/apply`), then wait on `SellerPendingPage` until Admin approval.

### Seller
- Apply as Seller / create Seller profile (`sellerController.applyAsSeller`, `createProfile`) — gated behind Admin approval (`SellerProfile.status`).
- Seller dashboard (`SellerDashboardPage` / `GET /api/v1/seller/dashboard`) — summary stats and status cards.
- Product management (`SellerProductsPage`, `ProductGrid`, `ProductForm`, `ProductDetailModal`) — create/update/delete own products, image upload (max 5 images, 10MB each, jpeg/jpg/png/gif/webp only), scoped to the seller's own `Store`.
- Store settings (`StoreSettingsPage`) — update store name/description/logo/city; store logo upload.
- Order management (`SellerOrdersPage`) — view orders containing the seller's items (`SellerOrder`), mark as read, update fulfillment status.
- Shipment management (`ShipmentManagementPage`, `ShipmentModal`) — create/update shipment, tracking number, carrier, and status history per `SellerOrder` (one shipment per seller order).
- Reviews (`SellerReviewsPage`) — view and reply to customer reviews on their products.
- Returns (`SellerReturnsPage`) — review return requests routed to them after admin pre-review, approve/reject, process refund handoff.

### Admin
- User management (`AdminUsersPage`) — list, activate, deactivate users.
- Seller approval (`SellerApprovalPage`) — approve/reject pending `SellerProfile` applications.
- Product moderation (`ProductModerationPage`, `ProductInspectionModal`) — review products, update moderation status, view global product statistics, inspect a product's paginated reviews.
- Category / SubCategory / Brand management (`AdminCategoriesPage`, `AdminBrandsPage`) — CRUD with soft-delete (`isDeleted` flag).
- Orders overview (`AdminOrdersPage`), Payments overview (`AdminPaymentsPage`), Shipments overview (`AdminShipmentsPage`) — read/monitoring views.
- Returns management (`ReturnsManagementPage`) — first-line admin review/decision on return requests before they route to the seller.
- Refunds management (`RefundManagementPage`) — create and view refunds tied to processed returns.
- Permission system administration (`PermissionGroupsPage`, `RolePermissionGroupsPage`) — manage `PermissionGroup`/`Permission` documents and assign permission groups to `Role`s.
- Admin dashboard (`AdminDashboardPage` / `GET /api/v1/admin/stats`) — platform-wide summary stats.

## 5. Functional Requirements

Based on confirmed backend route domains (`multi-vendor-mern/app/routes/*`):

| Domain | Confirmed capability |
|---|---|
| Auth | Register, login, refresh-token (rotating hashed refresh tokens), logout |
| Authorization | Role-based (`requireRole`) and fine-grained permission-based (`requirePermission`) route guards |
| Products (Seller) | Create/update/delete own products, list own products, image upload |
| Products (Public) | Public listing and detail, excludes deleted/inactive |
| Products (Admin) | List all products, get by ID, update moderation status, get global product stats |
| Categories/SubCategories/Brands | Admin CRUD (create/update/soft-delete); public/authenticated read; paginated brand listing endpoint |
| Cart | Get, add item, update item quantity, remove item, clear cart |
| Wishlist | Get, add product, remove product, clear wishlist |
| Addresses | CRUD + set-default, one default per user |
| Orders | Checkout (splits cart into per-seller orders), get single seller-order, order history, cancel order, order detail |
| Payments | Create payment intent (Stripe/COD), legacy "dummy" payment creation, get payment by order, get payment status, Stripe webhook handling (mounted before body-parsing middleware) |
| Shipments | Create, get by seller order, update carrier/tracking info, update status (tracking-history entries) |
| Reviews | Create, list own ("mine"), list by product (public), get by ID, image upload, seller reply |
| Returns | Create, list own, upload return image, update tracking, get refund for a return; seller queue + seller decision + seller-process-refund; admin queue + admin decision |
| Refunds | Admin create refund, get refund by return request |
| Admin (platform) | Users list/activate/deactivate, sellers list/approve/reject, orders/payments/shipments/returns/refunds read views, permission groups & roles CRUD, platform stats |
| Account | Update avatar, change password, get/update profile, get own permissions |
| Seller | Status check, create profile, apply as seller, upload store logo, seller order detail, unread-order count, mark-as-read, dashboard, orders list, reviews list, get/update own profile |

## 6. Business Rules

Confirmed directly from models/services:

- A `SellerProfile` must have `status: 'Approved'` before a seller can meaningfully operate (approval workflow is Admin-gated).
- A `Product` belongs to exactly one `Store`, one `Category`, one `SubCategory`, and optionally one `Brand`.
- Category and SubCategory names are unique only among non-deleted documents (partial unique index on `isDeleted: false`), i.e., soft-deleted names can be reused.
- A user may have only one default `Address` at a time (partial unique index on `isDefault: true`).
- A `Cart` and a `Wishlist` are unique per user (one document each).
- Checkout produces one `ParentOrder` plus one `SellerOrder` per distinct seller represented in the cart; each `SellerOrder` carries its own status lifecycle (`Pending → Processing → Shipped → Delivered → Cancelled`).
- A customer may leave only one `Review` per (customer, product, sellerOrder) combination — enforced by a unique compound index, i.e., reviews are tied to an actual purchase line.
- A `Return` is likewise unique per (customer, product, sellerOrder).
- Return workflow is a multi-stage state machine: `PENDING_ADMIN_REVIEW → REJECTED_BY_ADMIN | PENDING_SELLER_REVIEW → APPROVED_PENDING_SHIPMENT | REJECTED_BY_SELLER → ITEM_IN_TRANSIT → SELLER_RECEIVED → INSPECTED_AND_REFUNDED`. Admin reviews first, then (if approved) the seller makes the fulfillment decision.
- A `Shipment` is unique per `SellerOrder` (one-to-one).
- A `Payment` is unique per `ParentOrder` (one-to-one).
- Product image uploads are capped at 5 files per request, 10MB per file, restricted to jpeg/jpg/png/gif/webp.
- Avatar uploads are capped at a separate limit (comment in source says "10MB for testing" while the configured limit is 20MB — **flagged as a discrepancy for verification**, see `rules.md`/`memory.md`).

## 7. Role Responsibilities

| Capability | Customer | Seller | Admin |
|---|:---:|:---:|:---:|
| Browse public catalog | ✅ | ✅ | ✅ |
| Manage own cart/wishlist/addresses | ✅ | — | — |
| Checkout / place orders | ✅ | — | — |
| Manage own store & products | — | ✅ (own store only) | — |
| View/manage orders for own store | — | ✅ (own `SellerOrder`s only) | — |
| Global user management | — | — | ✅ |
| Seller approval | — | — | ✅ |
| Product moderation (status/global stats) | — | — | ✅ |
| Category/SubCategory/Brand write | — | — | ✅ |
| Return: initial review | — | — | ✅ |
| Return: fulfillment decision | — | ✅ (own store's returns) | — |
| Refund creation | — | — | ✅ |
| Permission/role administration | — | — | ✅ |

Enforcement mechanism: `authenticate` (JWT) + `requireRole('Seller'|'Admin')` and/or `requirePermission(<permission code>)` middleware on the Express routers; frontend mirrors this with `ProtectedRoute` (`allowedRoles` prop) and a `PermissionGate` component.

## 8. Non-Functional Requirements

Confirmed from source:

- **Security**: bcrypt password hashing (cost factor 12), JWT access tokens with configurable expiry, rotating refresh tokens stored as SHA-256 hashes (not raw tokens) with TTL-based Mongo expiry index, Helmet for HTTP headers, CORS restricted to explicit allowed origins.
- **API structure**: versioned REST API under `/api/v1/*`, consistent `ApiResponse`/`ApiError` envelope utilities, centralized `asyncHandler` wrapper and `errorHandler` middleware.
- **Data consistency**: unique/partial-unique Mongoose indexes enforce one-default-address, one-cart, one-wishlist, one-review-per-purchase, one-shipment-per-order, one-payment-per-order invariants at the database level.
- **Theme support**: light/dark theme system driven by CSS custom properties and a `data-theme` attribute, persisted to `localStorage`, with an OS-preference fallback.
- **Responsive UI**: layout components (`CustomerLayout`, `SellerLayout`, `AdminLayout`, `AuthLayout`) and CSS are structured per section (auth, dashboards, navbar, product pages, cart/checkout, orders/tables); no dedicated automated responsive test evidence found.
- **Error handling**: centralized Express error-handling middleware (`ErrorHandler.middleware.js`) and a custom `ApiError` class used throughout controllers/services.
- **Maintainability**: strict layering — Route → Controller → Service → Repository → Model — applied consistently across all backend domains.

Do not assume requirements (e.g., specific uptime SLAs, load targets, accessibility conformance level) that are not evidenced in source or configuration.

## 9. Current Feature Status

| Feature | Status |
|---|---|
| Auth (register/login/refresh/logout) | ✅ Complete |
| Role & permission-based authorization | ✅ Complete |
| Seller application & admin approval | ✅ Complete |
| Store management | ✅ Complete |
| Category/SubCategory/Brand management | ✅ Complete |
| Product CRUD (seller) | ✅ Complete |
| Public product browsing/detail | ✅ Complete |
| Cart | ✅ Complete |
| Wishlist | ✅ Complete |
| Address book (full name, phone, country dropdown) | ✅ Complete |
| Checkout & multi-seller order splitting | ✅ Complete |
| Payments (Dummy/COD/Stripe) | ✅ Complete |
| Payments (PayPal/JazzCash/EasyPaisa) | 🔴 Missing (enum values only; no processor implementation found) |
| Order history & cancellation | ✅ Complete |
| Order status history/timeline | ✅ Complete |
| Shipment tracking | ✅ Complete |
| Reviews (create/list/reply) | ✅ Complete |
| Review pagination (customer-facing product reviews, admin inspection) | ✅ Complete |
| Returns workflow (customer → admin → seller) | ✅ Complete |
| Refunds (admin-created) | ✅ Complete |
| Admin product moderation with global stats | ✅ Complete |
| Admin dashboards (users/orders/payments/shipments/returns/refunds) | ✅ Complete |
| Permission group / role administration UI | ✅ Complete |
| Theme system (light/dark, token-based) | ✅ Complete |
| Backend pagination (products, brands, reviews) | ✅ Complete |
| Reusable/shared frontend pagination component | ✅ Complete |
| Recently viewed products | ✅ Complete |
| Search autocomplete / suggestions | ✅ Complete |
| Additional seller performance indicators | ✅ Complete |
| Minor UI/UX improvements | ✅ Complete |
| Automated/API test suite | ✅ Complete |
## 10. Future Roadmap

The following is the known Phase 2 roadmap. It is **planned**, not implemented, unless separately marked complete above.

**Priority 1**
1. Regression/bug fixing
2. Order status history/timeline
3. Low-stock indicators
4. Related-products backend refinement
5. Reusable pagination component
6. Automated/API testing

**Priority 2**
- Recently viewed products
- Search autocomplete/suggestions
- Seller performance indicators
- UI/UX improvements

**Priority 3**
- Light/dark theme — ✅ already complete (see Section 9); retained here only for roadmap-numbering continuity from prior planning documents.

**Priority 4**
- Notifications
- Coupons/discounts
- Seller analytics
- Admin audit log

**Priority 5**
- Product variants
- Advanced recommendations
- Other optional marketplace features

See `phases.md` for the full history and checkpoint detail.
