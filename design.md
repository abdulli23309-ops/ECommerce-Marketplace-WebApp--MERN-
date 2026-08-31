# VendorVerse Design System

> Derived from `Ecommerce-FrontEnd/src/index.css` (single global stylesheet with theme tokens, organized by section), `src/styles/returns-luxury.css` (returns/tracking timeline), and the layout/component/pages source. No CSS framework is used — hand-written, BEM-ish, page-scoped classes over a shared theme-token layer.
>
> **Project state (verified at HEAD `588fdb5`, tag `v2.1-ui-audit-locked`):** Phase 2 complete; frontend build PASS (Vite, 0 errors; non-blocking chunk-size advisory); manual regression PASS. Backend test suite: 55 files / 399 tests / 0 failures.

## 1. Design Philosophy

A minimal, high-contrast, black/white-first aesthetic (`--primary: #000000` in light mode, inverted to near-white in dark mode) with sparing semantic color for success/warning/danger/info states. Uppercase, letter-spaced headings for section/page titles; dashboard-first layout for Seller/Admin (fixed sidebar + content) versus a conventional storefront navbar for Customer-facing pages.

## 2. Theme System (finalized)

- CSS custom properties on `:root` (light, default) overridden under `[data-theme="dark"]`. Active theme controlled by Redux `themeSlice`, applied to `document.documentElement` via `useTheme`.
- `themeSlice` initializes from `localStorage.theme`, falls back to `prefers-color-scheme: dark`, defaults to `light`.
- `ThemeToggle` (`components/common/ThemeToggle.jsx`) dispatches toggle/set.
- A blanket transition rule (`background-color/color/border-color .2s ease`) on key surfaces animates switches smoothly.
- Light and dark token tables are defined once in `index.css` (see §3 tables below). New semantics should add tokens to **both** blocks.

## 3. Color Tokens

### Light (`:root`, default)
`--bg-primary #ffffff`, `--bg-secondary #f9fafb`, `--surface #ffffff`, `--surface-elevated #ffffff`, `--surface-hover #f5f5f5`, `--text-primary #111827`, `--text-secondary #6b7280`, `--text-muted #9ca3af`, `--border #e5e7eb`, `--input-bg #ffffff`, `--input-border #e5e7eb`, `--shadow rgba(0,0,0,0.05)`, `--primary #000000`, `--primary-hover #1f2937`, `--primary-contrast #ffffff`; semantic success `#16a34a/#dcfce7/#166534`, warning `#f59e0b/#fef3c7/#92400e`, danger `#dc2626/#fee2e2/#991b1b`, info `#2563eb/#dbeafe/#1e40af`; disabled `#e5e7eb/#9ca3af`.

### Dark (`[data-theme="dark"]`)
`--bg-primary #0a0a0a`, `--bg-secondary #141414`, `--surface #1a1a1a`, `--surface-elevated #202020`, `--surface-hover #262626`, `--text-primary #f3f4f6`, `--text-secondary #a1a1aa`, `--text-muted #71717a`, `--border #2e2e2e`, `--input-bg #1a1a1a`, `--input-border #3a3a3a`, `--shadow rgba(0,0,0,0.4)`, `--primary #f3f4f6`, `--primary-hover #d1d5db`, `--primary-contrast #0a0a0a`; success `#22c55e/#14532d/#86efac`, warning `#fbbf24/#78350f/#fde68a`, danger `#f87171/#7f1d1d/#fca5a5`, info `#60a5fa/#1e3a8a/#bfdbfe`; disabled `#2a2a2a/#4b4b4b`.

### Hardcoded-color status (Phase 2 update)
- **Fixed during Phase 2:** `.dashboard-footer` border now uses `var(--border)`; `.stat-value`/`.stat-label`/`.stat-card-highlight` now use `var(--text-primary)`/`var(--text-secondary)`.
- **Still literal colors:** `.hero-banner` (`#000000`/`#ffffff`) and `.hero-subtitle` (`#a1a1aa`) remain hardcoded in `index.css`. These are flagged as remaining token-migration candidates — not to be "fixed" silently (see `rules.md` Rule 20).

## 4. Typography, Layouts, Navigation, Cards, Forms, Tables, Buttons, Modals, Badges

- **Typography**: Inter/system-ui stack; uppercase letter-spaced section titles; body `line-height: 1.5`; form labels `0.875rem/600`; error text `0.75rem/500` in `var(--danger)`.
- **Layouts**: `AuthLayout` (centered `.auth-card`), `CustomerLayout` (top `.navbar` + content + `Footer`), `SellerLayout`/`AdminLayout` (shared `.dashboard-layout` with fixed 260px `.dashboard-sidebar` + `.dashboard-main`). Seller/Admin share the identical dashboard-shell CSS; only nav link sets differ.
- **Navigation**: Customer top navbar; Seller/Admin left sidebar with active/hover states and `.dashboard-footer` logout. Route access via `ProtectedRoute`; fine-grained UI gating via `PermissionGate`. `DashboardSwitcher` in the header allows switching the active **view** (Customer/Seller/Admin) without changing the backend role.
- **Cards**: `.product-card`, `.stat-card`, `.auth-card`, `.order-card`, `.address-card`, `.profile-card` — theme-token driven and in the shared transition rule.
- **Forms**: `.form-group`/`.form-input`/`.form-select`/`.btn-*`; theme-token backgrounds/borders.
- **Tables**: shared admin/seller table styling with theme tokens, status badges via `getStatusBadgeStyle()`.
- **Buttons**: purpose-specific classes (`.btn-primary`, `.btn-secondary`, `.btn-danger`, etc.).
- **Modals**: `.modal-overlay` + `.modal-content` shared pattern (ProductInspectionModal, ShipmentModal, ProductDetailModal, etc.); Phase 2 fixed a z-index/overlay rendering issue in the product inspection modal.
- **Branding**: `BrandLogo` picks light/dark asset variants via `assets/branding/` export map with optional `forceTheme`.

## 5. Pagination UI

- Shared `.pagination` container + `.page-btn` (Previous/Next + page numbers), styled with theme tokens. Reused across every paginated screen.
- **Reusable `Pagination` component** (`components/common/Pagination.jsx`) consumes `currentPage`/`totalPages`/`onPageChange` and renders the above. Prefer it for any new paginated screen.
- Backend metadata shape `{ page, pageSize, total, totalPages }` consumed by pages.

## 6. Status Badges / Rating Warning UI

- Single source of truth: `getStatusBadgeStyle()` (`utils/statusBadge.js`) maps statuses to semantic token backgrounds/text.
- Rating-moderation UI: admin product moderation/inspection shows low-rating/low-stock warning states and warning count via `utils/warningThresholds.js`; the seller dashboard renders a **low-rating warning banner** (`Low Seller Rating Warning ... Warnings: n/3`) built from `SELLER_LOW_RATING_THRESHOLD`.

## 7. Notification UI

- `NotificationDropdown` (`components/common/`) presents unread in-app notifications in the navbar/dashboard header, driven by `notificationService.js`; styled with theme tokens.

## 8. Free-Delivery Indicators

- `FreeDeliveryBadge` (`components/common/FreeDeliveryBadge.jsx`) labels products with `freeDelivery === true` on Product Listing, Store page, and (as applicable) detail/checkout; checkout and order confirmation show `deliveryCharges` and `freeDeliveryDiscount` line items.

## 9. Customer Order History / Tracking (updated)

- **OrderList/History** (`OrderHistoryPage`) shows the customer's `ParentOrder`s with status badges.
- **Order Detail / Tracking** (`OrderDetailPage`) uses a **status timeline/step tracker** (order + seller-order + shipment statuses) and, where shipped, the shipment tracking history; a vertical timeline style is also used for returns (`styles/returns-luxury.css`). This redesigned tracking experience was re-verified in Phase 2 regression.

## 10. Product Listing / Product Detail (updated)

- Updated Product Listing (`ProductListingPage`) shows free-delivery badges, price formatting, rating/`warning` cosmetics, and the reusable `Pagination`; search suggestions dropdown (Home + Listing).
- Product Detail (`ProductDetailPage`) includes related products (reusing the products endpoint), recently-viewed tracking, rating warnings where applicable, and image handling with missing-image fallbacks (regression-fixed).

## 11. Reviews (updated)

- **Write Review** (`ReviewPage`) — one review per purchased line item; rating input + comment.
- **My Reviews** (`MyReviewsPage`) and **Review Detail** (`ReviewDetailPage`) — redesigned detail view; seller replies; pagination where applicable.
- Seller side `SellerReviewsPage` for viewing/replies.

## 12. Dashboard-Switching UI

- `DashboardSwitcher.jsx` (`components/common/`) presents the available views (Customer/Seller/Admin) to the logged-in user; selection writes to `dashboardContext.activeDashboard`. Layouts and `ProtectedRoute` render the chosen view. This is a **presentation-layer switch only** — the backend role is never changed.

## 13. Component Reuse (confirmed)

- `Pagination`, `NotificationDropdown`, `DashboardSwitcher`, `MetricCard`, `FreeDeliveryBadge`, `BrandLogo`, `Logo`, `Footer`, `ThemeToggle`, `PermissionGate` in `components/common/` are reused across roles.
- Shared utilities: `getStatusBadgeStyle()` (status color), `imageHelper` (image URL/missing fallback), `warningThresholds.js` (rating-moderation thresholds), `orderStatus.js` (payment/order label maps).
- Most role-specific UI still lives inline in `pages/<role>/`; the `components/<role>/` folders are largely unpopulated for business logic.

## 14. Responsive Behavior (as actually implemented)

- CSS is organized per functional section; grids use flexbox/CSS grid with `auto-fill`/`minmax` (`repeat(auto-fill, minmax(200px, 1fr))`), which provides inherent responsiveness on core card grids.
- A dedicated mobile-first/media-query stylesheet or automated responsive test suite is **not** present. Mobile-breakpoint behavior should be treated as **partially verified** (core grids reflow) rather than fully covered on every screen.
- Dashboard layouts use a fixed-width sidebar intended for desktop; no mobile drawer/hamburger was confirmed in source.

## 15. Modernized / Phase 2 UI Patterns Summary

- Theme-aware tokens everywhere except the flagged `.hero-*` literals.
- Status-timeline / tracking redesign (orders, returns).
- Free-delivery badges + delivery/discount line items at checkout/confirmation.
- Low-stock (seller dashboard) and low-rating (admin + seller) warning UI.
- Notification dropdown; coupon admin CRUD; audit-log table with pagination.
- Dashboard view switcher; metric cards; product inspection modal.
- Email-verification gate with `VerifyEmailPage` (read-only email, countdown, expiry).

## 16. Design Rules for Future Development

1. Use theme tokens, not literal colors; add new semantics to both `:root` and `[data-theme="dark"]`.
2. Preserve the visual language (uppercase letter-spaced headings, minimal b/w primary, semantic status color).
3. Reuse existing classes/components (`Pagination`, `FreeDeliveryBadge`, `.btn-*`, `getStatusBadgeStyle`, `BrandLogo`, `DashboardSwitcher`).
4. New status values go into `STATUS_STYLES` in `utils/statusBadge.js`.
5. New paginated screens reuse `Pagination` + `.pagination`/`.page-btn` and the backend pagination shape.
6. Do not "fix" the remaining `.hero-*` hardcoded colors as a side effect of unrelated work — scope it separately (see `rules.md` Rule 20).