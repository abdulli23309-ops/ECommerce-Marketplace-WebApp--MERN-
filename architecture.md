# VendorVerse Architecture

> Derived from direct inspection of the current source tree. File paths below are relative to the two project roots: `Ecommerce-FrontEnd/` (frontend) and `multi-vendor-mern/` (backend).

## 1. System Overview

VendorVerse is a classic three-tier MERN application split into two independently deployable projects sharing one Git repository root:

```
Project4 (MernStack)/
├── Ecommerce-FrontEnd/     # React + Vite SPA
└── multi-vendor-mern/      # Express + MongoDB REST API
```

The frontend communicates with the backend exclusively over HTTP via Axios, calling REST endpoints under `/api/v1/*`. There is no server-side rendering and no GraphQL layer.

## 2. Technology Stack

**Frontend** (`Ecommerce-FrontEnd/package.json`):
- React 19, React DOM 19
- Vite 8 (build tool/dev server)
- Redux Toolkit 2 + React-Redux 9 (state management)
- React Router DOM 7 (routing)
- Axios (HTTP client)
- React Hook Form + Yup + @hookform/resolvers (form handling/validation)
- @stripe/react-stripe-js, @stripe/stripe-js (Stripe payment UI)
- react-toastify (notifications/toasts)
- react-icons, react-spinners (UI utility libraries)
- jwt-decode (client-side token decoding)
- ESLint (linting)

**Backend** (`multi-vendor-mern/package.json`):
- Node.js, Express 5
- Mongoose 9 (MongoDB ODM)
- jsonwebtoken (JWT issuance/verification)
- bcrypt / bcryptjs (password hashing — `bcrypt` used in `User.model.js`)
- multer (file/image upload handling)
- express-validator (request validation)
- helmet (HTTP security headers)
- cors (CORS policy)
- morgan (HTTP request logging)
- cookie-parser
- ioredis (Redis client — connected at startup alongside MongoDB)
- stripe (Stripe SDK, used in payment/webhook services)
- dotenv (environment configuration)
- nodemon (dev-only autoreload)

**Database**: MongoDB via Mongoose ODM. Schema-per-domain models (see Section 9). No raw SQL/relational store is used.

## 3. Repository Structure

### Frontend — `Ecommerce-FrontEnd/src/`
```
assets/branding/     Theme-aware logo assets (light/dark variants) + index.js export map
components/
  common/             BrandLogo, Logo, Footer, ThemeToggle, PermissionGate
  admin/ seller/ customer/   (present as folders; role-specific reusable components currently live inline in pages rather than these folders)
constants/            (present, no populated files inspected beyond folder)
context/              (present, empty — no React Context providers currently defined)
hooks/                useTheme, useIdleLogout
layouts/              AuthLayout, CustomerLayout, SellerLayout, AdminLayout
pages/
  auth/               LoginPage, RegisterPage
  customer/           Home, About, Product listing/detail, Cart, Checkout, Orders, Reviews, Returns, Wishlist, Address book, Profile, Store
  seller/             Product grid/form/detail modal, Dashboard, Orders, Store settings, Shipments, Reviews, Returns, Pending/Register
  admin/               Dashboard, Users, Sellers, Categories, Brands, Product moderation + inspection modal, Orders, Payments, Shipments, Returns, Refunds, Permission groups, Role-permission groups
routes/                ProtectedRoute (role-gated route guard)
services/               One Axios-based service module per domain (see Section 4)
store/                  Redux slices: store.js (root), authSlice, cartSlice, wishlistSlice, permissionsSlice, themeSlice
utils/                  imageHelper.js, statusBadge.js (shared status→color mapping)
index.css               Single global stylesheet with theme tokens + component styles
App.jsx                 Route table (React Router v7)
main.jsx                Entry point
```

### Backend — `multi-vendor-mern/app/`
```
config/        app.conf.js, app.keys.js, db.conf.js, db.keys.js, init.js — environment/config loading
controllers/   Thin HTTP handlers; one file per domain, delegate to services
services/      Business logic; one file per domain; services/payment/ + services/payment/processors/ for payment-processor-specific logic
repositories/  Mongoose query layer; one file per domain that owns persistence concerns
models/        Mongoose schemas (see Section 9)
middleware/    App.middleware.js (global middleware wiring), Auth.middleware.js (authenticate/requireRole/requirePermission), ErrorHandler.middleware.js, Validation.middleware.js, init.js
routes/        Express routers, one per domain, mounted in app.js
validations/   express-validator rule sets (Auth, Address, Product, Store, Category, SubCategory, Brand)
helpers/       FileUpload.helper.js (Multer config), Jwt.helper.js (token issuance/verification/hashing)
utils/         ApiError.util.js, ApiResponse.util.js, AsyncHandler.util.js
database/      DB connection bootstrap (Mongo + Redis)
uploads/       Static file storage: products/, reviews/, stores/, users/
views/         (present; not part of the API surface — no server-rendered routes registered in app.js)
app.js         Express app assembly and route mounting
stripe.js       Stripe SDK client initialization
server.js       Process entry point (project root)
```

Only folders actually present are listed. `components/admin`, `components/seller`, `components/customer`, and `context/` exist as directories but were empty or not populated with domain logic at the time of inspection — role-specific UI logic currently lives directly inside the corresponding `pages/<role>/` files rather than being extracted into `components/<role>/`.

## 4. Frontend Architecture

- **Component structure**: Page-level components under `pages/<role>/` contain most UI and data-fetching logic directly (fewer small reusable sub-components than a typical design-system-driven app). Shared cross-role UI (branding, footer, theme toggle, permission gating) lives in `components/common/`.
- **Layouts**: Each role has a dedicated layout wrapping its pages via nested `<Route element={<XLayout />}>` in `App.jsx` (`AuthLayout`, `CustomerLayout`, `SellerLayout`, `AdminLayout`).
- **Redux store** (`store/store.js`): slices for `auth`, `cart`, `wishlist`, `permissions`, `theme`. `authSlice` holds `accessToken`/`user`; `permissionsSlice` is populated via `fetchPermissions()` thunk dispatched whenever `accessToken` is present (see `App.jsx` `useEffect`).
- **Services**: One Axios-wrapping module per backend domain (`authService`, `productService`, `sellerProductService`, `adminProductService`, `adminService`, `orderService`, `cartService`, `wishlistService`, `reviewService`, `addressService`, `brandService`, `categoryService`, `sellerOrderService`, `sellerReviewService`, `sellerShipmentService`), all built on a shared `axiosInstance.js`.
- **Routing**: `react-router-dom` v7 `<Routes>`/`<Route>` tree defined entirely in `App.jsx`. Public routes (home, product listing/detail, store page, auth) are outside `ProtectedRoute`; authenticated-only and role-scoped routes are wrapped in `<ProtectedRoute allowedRoles={[...]} />`.
- **Route guards**: `ProtectedRoute` (`routes/ProtectedRoute.jsx`) checks for `accessToken` + `user` in Redux state and an optional `allowedRoles` array; redirects to `/login` (unauthenticated) or `/` (wrong role).
- **Permission gating**: `PermissionGate` (`components/common/PermissionGate.jsx`) is available for fine-grained, permission-code-based UI gating beyond role checks.
- **Theme system**: `useTheme` hook reads `state.theme.mode` and sets `document.documentElement.setAttribute('data-theme', mode)`; `themeSlice` persists the mode to `localStorage` and falls back to the OS `prefers-color-scheme` media query on first load.

## 5. Backend Architecture

Strict layered architecture applied uniformly across all domains:

```
Route → Controller → Service → Repository → Model (Mongoose) → MongoDB
```

- **Routes** (`routes/*.routes.js`): declare HTTP verbs/paths, attach `authenticate`/`requireRole`/`requirePermission` middleware and `express-validator` validation chains, then delegate to a controller function.
- **Controllers** (`controllers/*.controller.js`): thin HTTP-layer functions wrapped in `asyncHandler`; extract request data, call the matching service, and send a response via the shared `ApiResponse` utility.
- **Services** (`services/*.service.js`): business logic — orchestration, cross-repository coordination (e.g., checkout splitting a cart into multiple `SellerOrder`s), and domain rules. `services/payment/` and `services/payment/processors/` isolate payment-processor-specific logic (Stripe, etc.) from the general `Payment.service.js`.
- **Repositories** (`repositories/*.repository.js`): the only layer that talks to Mongoose models directly; encapsulates queries, pagination (`skip`/`limit`), filtering, and population logic.
- **Models** (`models/*.model.js`): Mongoose schemas with validation, indexes, and (for `User`) a `pre('save')` password-hashing hook.
- **Middleware**: global middleware (Helmet, CORS, JSON body parsing, cookie-parser, morgan, static `/uploads`) wired via `middleware/App.middleware.js` / `middleware/init.js`; auth/authorization middleware in `Auth.middleware.js`; centralized error handling in `ErrorHandler.middleware.js`; request-body validation in `Validation.middleware.js`.

## 6. Data Flow

Confirmed to match the standard MERN flow for all inspected domains:

```
React component
  → Service (Axios call, e.g. sellerProductService.js)
  → axiosInstance (baseURL, interceptors, auth header)
  → Express Route (auth/role/permission middleware, then express-validator)
  → Controller (asyncHandler-wrapped)
  → Service (business logic)
  → Repository (Mongoose query)
  → MongoDB
```

Responses flow back through the same layers wrapped in a consistent `ApiResponse` envelope (`{ success, statusCode, message, data }`, based on `ApiResponse.util.js` usage patterns) and errors are normalized via `ApiError` + the global `errorHandler`.

## 7. Authentication Architecture

- Registration/login handled by `Auth.controller.js` / `Auth.service.js` / `Auth.repository.js`.
- Passwords hashed with bcrypt (cost 12) in a Mongoose `pre('save')` hook on `User.model.js`; `password` field has `select: false` so it is excluded from default queries.
- **Access tokens**: short-lived JWTs signed with `JWT_ACCESS_SECRET`, payload contains `sub` (user id), `roles` (array), and `permissions` (array) — issued by `generateAccessToken()` in `Jwt.helper.js`.
- **Refresh tokens**: signed separately with `JWT_REFRESH_SECRET`, given a random `jwtid` per issuance; the raw token is never stored — only its SHA-256 hash (`RefreshToken.model.js`, `tokenHash`, `select: false`) is persisted, with a TTL index on `expiresAt` for automatic Mongo-level expiry cleanup. This implements a **rotating hashed refresh token** pattern.
- `authenticate` middleware (`Auth.middleware.js`) expects a `Bearer` token in the `Authorization` header, verifies it, and attaches `{ id, roles, permissions }` to `req.user`.
- Frontend stores the access token/user in Redux (`authSlice`); `jwt-decode` is available client-side for token inspection. `useIdleLogout` hook exists for idle-session handling.

## 8. Authorization Architecture

Two complementary mechanisms, both enforced server-side and mirrored client-side:

1. **Role-based** — `requireRole('Seller' | 'Admin')` middleware checks `req.user.roles` (supports both plain-string roles from the JWT and populated role objects from the DB).
2. **Permission-based** — `requirePermission(...codes)` middleware checks `req.user.permissions` contains every required permission code (e.g., `Seller.Products.Create`, `Seller.Products.Edit`, `Seller.Products.Delete`, `Products.Create`).

Backing data model: `Role` documents reference `Permission` and `PermissionGroup` documents; `PermissionGroup` bundles `Permission`s. Admin UI (`PermissionGroupsPage`, `RolePermissionGroupsPage`) manages these associations. `Admin.permission.controller.js` / `Admin.permission.service.js` expose the CRUD and assignment endpoints (`/api/v1/admin/permission-groups`, `/api/v1/admin/roles/:roleId/groups/:groupId`, `/api/v1/admin/permissions`).

Frontend mirrors this with `ProtectedRoute` (`allowedRoles`) for route-level role gating and `PermissionGate` for permission-level UI gating; `permissionsSlice` is populated from `GET /api/v1/account/permissions` after login.

## 9. Database Architecture

Confirmed Mongoose models and key relationships (`ref`erences):

| Model | Key references | Notable constraints |
|---|---|---|
| `User` | — | unique `email`; `role` enum `Customer/Seller/Admin`; hashed password |
| `RefreshToken` | `user → User` | unique `tokenHash`; TTL index on `expiresAt` |
| `Role` | `permissions[] → Permission`, `permissionGroups[] → PermissionGroup` | unique `name` |
| `Permission` | `group → PermissionGroup` | unique `name`, unique `code` |
| `PermissionGroup` | `permissions[] → Permission` | unique `name` |
| `SellerProfile` | `user → User` (1:1), `approvedBy → User` | unique `user`; `status` enum `Pending/Approved/Rejected` |
| `Store` | `sellerProfile → SellerProfile` | — |
| `Category` | — | unique `name` among non-deleted (partial index) |
| `SubCategory` | `category → Category` | unique `(name, category)` among non-deleted |
| `Brand` | — | unique `name` among non-deleted |
| `Product` | `store → Store`, `category → Category`, `subCategory → SubCategory`, `brand → Brand` (optional) | — |
| `Cart` | `user → User` (1:1), `items[].product → Product` | unique `user` |
| `Wishlist` | `user → User` (1:1), `products[] → Product` | unique `user` |
| `Address` | `user → User` | one default per user (partial unique index) |
| `ParentOrder` | `customer → User`; virtual `sellerOrders` populated from `SellerOrder.parentOrder` | `orderStatus` enum |
| `SellerOrder` | `parentOrder → ParentOrder`, `store → Store` (nullable), `items[].product → Product` (nullable, snapshot fields for name/price preserved independently) | `status` enum |
| `Payment` | `parentOrder → ParentOrder` (1:1) | unique `parentOrder`; `method`/`status` enums; Stripe-specific fields (`stripePaymentIntentId`, card metadata) |
| `PaymentTransaction` | `payment → Payment` | unique `stripeEventId` (webhook idempotency) |
| `Shipment` | `sellerOrder → SellerOrder` (1:1) | unique `sellerOrder`; embedded `trackingHistory[]` |
| `Review` | `customer → User`, `product → Product`, `sellerOrder → SellerOrder`, `orderId → ParentOrder` (optional) | unique `(customer, product, sellerOrder)` |
| `Return` | `customer → User`, `product → Product`, `sellerOrder → SellerOrder`, `seller → User` | unique `returnNumber`; unique `(customer, product, sellerOrder)`; multi-stage `status` enum |
| `Refund` | `returnRequest → ReturnRequest` (**note**: `ref: 'ReturnRequest'`, while the actual model is registered as `Return` — see `rules.md`/`memory.md` verification item), `payment → Payment` | unique `returnRequest` |

## 10. API Architecture

All routes are mounted under `/api/v1/` in `app.js`. Major endpoint domains (not an exhaustive endpoint list — see the route files for full detail):

| Base path | Domain | Auth |
|---|---|---|
| `/api/v1/auth` | Register/login/refresh/logout | Public |
| `/api/v1/test` | Authorization smoke-test endpoints | Mixed |
| `/api/v1/products` | Public product listing/detail | Public |
| `/api/v1/seller/products` | Seller product management | Seller |
| `/api/v1/categories`, `/api/v1/subcategories`, `/api/v1/brands` | Catalog taxonomy | Public read / Admin write |
| `/api/v1/cart` | Cart | Authenticated |
| `/api/v1/wishlist` | Wishlist | Authenticated |
| `/api/v1/addresses` | Address book | Authenticated |
| `/api/v1/orders` | Checkout, order history/detail/cancel | Authenticated |
| `/api/v1/payments` | Payment intents, status, legacy dummy payment | Authenticated |
| `/api/v1/payments/webhook` | Stripe webhook (mounted before global body parser, uses `express.raw`) | Stripe signature |
| `/api/v1/shipments` | Shipment CRUD | Seller |
| `/api/v1/reviews` | Reviews | Public read (by product) / Authenticated write |
| `/api/v1/returns` | Return workflow (customer/seller/admin sub-routes) | Authenticated, role-scoped |
| `/api/v1/refunds` | Refund creation/lookup | Admin |
| `/api/v1/admin/products` | Admin product moderation + stats | Admin |
| `/api/v1/admin` | Users, sellers, orders, payments, shipments, returns, refunds views, permission groups, roles, permissions, platform stats | Admin |
| `/api/v1/account` | Avatar, password, profile, own permissions | Authenticated |
| `/api/v1/stores` | Seller's own store + public store view | Seller (mine) / Public (`:id`) |
| `/api/v1/seller` | Seller status/apply/profile/dashboard/orders/reviews | Mixed (public-ish status/apply, Seller-gated for the rest) |

`GET /api/health` provides a basic health-check endpoint outside the `/api/v1` namespace.

## 11. Pagination Architecture

Confirmed pattern, implemented at the **repository** layer (`Product.repository.js` and equivalents):

- Backend pagination parameters: `page` (default 1), `pageSize` (default varies: 12 for product listings, 50 for admin listings).
- `skip = (page - 1) * pageSize`, `limit = pageSize`.
- Response metadata shape: `{ page, pageSize, total, totalPages, ...items }` — consistent across public product listing, seller product listing, admin product listing, and brand pagination.
- **Frontend-only pagination** is used only where a complete, small dataset is intentionally fetched at once (no confirmed large unpaginated dataset was found being paginated client-side as of this inspection — verify per-page before assuming client-side pagination exists for a given screen).
- **Phase 14A (D-01)** added `GET /api/v1/admin/products/stats` specifically so `ProductModerationPage` could show *global* counts instead of counts derived only from the current paginated page — this is the confirmed rationale for keeping stats endpoints separate from list endpoints.
- **Phase 14A (D-04)** added review pagination (`page`/`pageSize` query params) to the product-reviews endpoint consumed by `ProductInspectionModal`, with Previous/Next controls (`page-btn` CSS class) driven by `totalPages` from the response.

## 12. Theme Architecture

- Single global stylesheet: `Ecommerce-FrontEnd/src/index.css`.
- CSS custom properties defined on `:root` (light, default) and overridden under `[data-theme="dark"]` — covering background/surface, text, border, primary, and semantic status colors (`success`, `warning`, `danger`, `info`), plus disabled states.
- `data-theme` attribute is set on `document.documentElement` by the `useTheme` hook, driven by Redux `theme.mode`.
- `themeSlice` initializes from `localStorage.theme`, falling back to `prefers-color-scheme: dark`, defaulting to `light`.
- `ThemeToggle` component (`components/common/ThemeToggle.jsx`) dispatches `toggleTheme`/`setTheme`.
- Semantic status colors are consumed by the shared `getStatusBadgeStyle()` utility (`utils/statusBadge.js`) rather than being hardcoded per page — this is the pattern Phase 14A (D-02, D-03) retrofitted `SellerProductsPage` and `SellerDashboardPage` onto.
- Branding is theme-aware: `BrandLogo` component picks a light/dark asset variant per `assets/branding/index.js` export map, based on the current theme (or an explicit `forceTheme` override).

## 13. Important Architectural Decisions

Decisions future development must preserve unless explicitly and deliberately changed:

1. **Strict Route → Controller → Service → Repository → Model layering** is applied uniformly across every backend domain — do not collapse layers (e.g., querying Mongoose directly from a controller) for "quick" features.
2. **Repository-owned persistence** — only repository files import/query Mongoose models directly; services must not bypass repositories.
3. **Rotating, hashed refresh tokens** — raw refresh tokens are never persisted; only SHA-256 hashes with a TTL index. Preserve this pattern for any future token-related work.
4. **Cart-to-multi-seller-order splitting at checkout** — a single `ParentOrder` fans out into per-seller `SellerOrder`s; this is central to how orders, shipments, reviews, and returns are all scoped (they hang off `SellerOrder`, not `ParentOrder`, except where explicitly noted).
5. **Snapshot fields on order items** (`productNameSnapshot`, `unitPriceSnapshot`) preserve historical order data even if the underlying `Product` is later edited or deleted — do not replace these with live product lookups.
6. **Soft-deletion for taxonomy** (`Category`, `SubCategory`, `Brand` use `isDeleted` + partial unique indexes) rather than hard deletion — preserve this pattern for any new deletable catalog entities.
9. **Semantic CSS variable theming** — colors are expressed as CSS custom properties (`var(--success-bg)`, etc.), not hardcoded hex values, so that light/dark theming and future re-theming stay centralized. Phase 14A specifically remediated two pages that had drifted from this pattern.
10. **Shared status-badge utility** (`utils/statusBadge.js`) is the single source of truth for status→color mapping across seller/admin/customer views; new statuses should be added there, not re-implemented per page.
11. **Backend-owned pagination metadata shape** (`page`, `pageSize`, `total`, `totalPages`) is consistent across all paginated endpoints — new paginated endpoints should match this shape rather than inventing a new one.

## 14. Additions from Priority 1-3

### Priority 1 Additions

- **Order Status History/Timeline** — customer-facing order detail page now displays a visual progress tracker (`StepProgress` component) based on order/seller-order/shipment statuses.
- **Low-Stock Indicators** — `Seller.dashboard.service.js` computes `lowStockCount` and `lowStockProducts` using `LOW_STOCK_THRESHOLD = 5`; `SellerDashboardPage.jsx` renders a Low Stock card.
- **Related Products backend refinement** — `ProductDetailPage.jsx` now reuses the existing `GET /api/v1/products` endpoint with `store` and `page`/`pageSize` params to fetch related products; no new backend endpoint required.
- **Reusable Pagination Component** — `Ecommerce-FrontEnd/src/components/common/Pagination.jsx` created; consumes `currentPage`, `totalPages`, `onPageChange` props and reuses `.pagination`/`.page-btn` CSS classes.

### Priority 2 Additions

- **Recently Viewed Products** — new Redux slice `recentlyViewedSlice.js`; uses `localStorage` key `recentlyViewed`; max 10 items; deduplicated. `ProductDetailPage.jsx` dispatches `addRecentlyViewed` on product load. `HomePage.jsx` renders Recently Viewed section.
- **Search Autocomplete / Suggestions** — new public endpoint `GET /api/v1/products/suggestions?q=...` (anchored prefix, returns limited products/categories/brands). Frontend debounced dropdowns added to `HomePage.jsx` and `ProductListingPage.jsx`.
- **Seller Performance Indicators** — `Seller.dashboard.service.js` now returns `totalFulfilledOrders`, `averageOrderValue`, `pendingReviewsCount`, `returnRate`. `SellerDashboardPage.jsx` adds four corresponding cards.
- **Minor UI/UX Improvements** — dark-theme fixes for search inputs and address country dropdown; consistent theme tokens for `.suggestions-dropdown`.

### Priority 3 Additions

- **Light/Dark Theme** — already present in Phase 14A; no new architecture changes. Verified across cards, forms, tables, navigation, modals, text, borders.