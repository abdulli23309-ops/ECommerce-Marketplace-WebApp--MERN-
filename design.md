# VendorVerse Design System

> Derived from `Ecommerce-FrontEnd/src/index.css` (single global stylesheet, ~2,550 lines, organized into 10 numbered sections) and the layout/component source under `Ecommerce-FrontEnd/src/`. No CSS framework (Tailwind/Bootstrap/MUI) is used — this is hand-written CSS with BEM-ish, page-scoped class names plus a shared theme-token layer.

## 1. Design Philosophy

A minimal, high-contrast, black/white-first aesthetic (`--primary: #000000` in light mode, inverted to near-white in dark mode) with sparing use of color, reserved almost entirely for semantic status states (success/warning/danger/info). Typography leans on uppercase, letter-spaced headings for section/page titles, and the layout is dashboard-first for Seller/Admin (fixed sidebar + content area) versus a conventional storefront navbar layout for Customer-facing pages.

## 2. Theme System

Implemented as CSS custom properties on `:root` (light, default) and overridden under `[data-theme="dark"]`, both defined at the top of `index.css`. The active theme is controlled by Redux (`themeSlice`) and applied to `document.documentElement` via the `useTheme` hook.

- `themeSlice` initializes from `localStorage.theme`, falls back to the OS `prefers-color-scheme: dark` media query, and defaults to `light` if neither is available.
- `ThemeToggle` (`components/common/ThemeToggle.jsx`) dispatches the toggle/set actions.
- A blanket transition rule (`background-color .2s ease, color .2s ease, border-color .2s ease`) is applied to key surfaces (`body`, `.navbar`, `.dashboard-sidebar`, `.dashboard-header`, `.auth-card`, `.product-card`, `.stat-card`, `.order-card`, `.address-card`, `.profile-card`) so theme switches animate smoothly rather than flashing.

## 3. Color Tokens

All values as defined in `index.css`. Do not invent additional tokens — extend this table (and the CSS) if a new semantic need arises.

### Light (`:root`, default)

| Token | Value | Purpose |
|---|---|---|
| `--bg-primary` | `#ffffff` | Page background |
| `--bg-secondary` | `#f9fafb` | Secondary/section background (e.g. dashboard shell, auth layout) |
| `--surface` | `#ffffff` | Card/panel surface |
| `--surface-elevated` | `#ffffff` | Elevated surface |
| `--surface-hover` | `#f5f5f5` | Hover state for surfaces/nav links |
| `--text-primary` | `#111827` | Primary text |
| `--text-secondary` | `#6b7280` | Secondary text |
| `--text-muted` | `#9ca3af` | Muted/placeholder text |
| `--border` | `#e5e7eb` | Default border |
| `--input-bg` | `#ffffff` | Form input background |
| `--input-border` | `#e5e7eb` | Form input border |
| `--shadow` | `rgba(0,0,0,0.05)` | Card/box shadow |
| `--primary` | `#000000` | Primary action color (buttons, focus ring, hero) |
| `--primary-hover` | `#1f2937` | Primary hover state |
| `--primary-contrast` | `#ffffff` | Text/icon color on primary background |
| `--success` / `--success-bg` / `--success-text` | `#16a34a` / `#dcfce7` / `#166534` | Success semantics (Delivered, Approved, Completed, Refunded) |
| `--warning` / `--warning-bg` / `--warning-text` | `#f59e0b` / `#fef3c7` / `#92400e` | Warning semantics (Pending, Processing) |
| `--danger` / `--danger-bg` / `--danger-text` | `#dc2626` / `#fee2e2` / `#991b1b` | Danger semantics (Cancelled, Rejected) |
| `--info` / `--info-bg` / `--info-text` | `#2563eb` / `#dbeafe` / `#1e40af` | Info semantics (Shipped, Out for Delivery, in-transit return states) |
| `--disabled-bg` / `--disabled-text` | `#e5e7eb` / `#9ca3af` | Disabled controls |

### Dark (`[data-theme="dark"]`)

| Token | Value |
|---|---|
| `--bg-primary` | `#0a0a0a` |
| `--bg-secondary` | `#141414` |
| `--surface` | `#1a1a1a` |
| `--surface-elevated` | `#202020` |
| `--surface-hover` | `#262626` |
| `--text-primary` | `#f3f4f6` |
| `--text-secondary` | `#a1a1aa` |
| `--text-muted` | `#71717a` |
| `--border` | `#2e2e2e` |
| `--input-bg` / `--input-border` | `#1a1a1a` / `#3a3a3a` |
| `--shadow` | `rgba(0,0,0,0.4)` |
| `--primary` / `--primary-hover` / `--primary-contrast` | `#f3f4f6` / `#d1d5db` / `#0a0a0a` |
| `--success` / `--success-bg` / `--success-text` | `#22c55e` / `#14532d` / `#86efac` |
| `--warning` / `--warning-bg` / `--warning-text` | `#fbbf24` / `#78350f` / `#fde68a` |
| `--danger` / `--danger-bg` / `--danger-text` | `#f87171` / `#7f1d1d` / `#fca5a5` |
| `--info` / `--info-bg` / `--info-text` | `#60a5fa` / `#1e3a8a` / `#bfdbfe` |
| `--disabled-bg` / `--disabled-text` | `#2a2a2a` / `#4b4b4b` |

### Known hardcoded exceptions (verification items, not to be copied)

A few older/less-trafficked selectors still use literal colors instead of tokens and were **not** in scope for the Phase 14A (D-02/D-03) cleanup, which only covered `SellerProductsPage` and `SellerDashboardPage`:
- `.dashboard-footer` border: `#eaeaea`
- `.stat-card` background/border: `#fff` / `#eaeaea`; `.stat-label` color: `#666`; `.stat-card-highlight` color: `#000`
- `.hero-banner` background/text: `#000000` / `#ffffff`; `.hero-subtitle`: `#a1a1aa`

These are flagged here (and in `memory.md`) as candidates for a future token-migration pass — do not treat them as the intended pattern for new code (see `rules.md` Rule 9).

## 4. Typography

- Font stack: `'Inter', system-ui, -apple-system, sans-serif` (set globally on `*` in the reset).
- No `@font-face`/self-hosted font file was found — `Inter` is expected to resolve via a system/Google Fonts source if present, or fall back to `system-ui`.
- Headings/section titles favor uppercase with letter-spacing (`.section-title`: `1.5rem`/`700`/`uppercase`/`1px` spacing; `.dashboard-header h1`: `1.25rem`/`700`/`uppercase`/`0.05em`; `.hero-title`: `3rem`/`700`/`-0.02em` tight tracking).
- Body copy uses `line-height: 1.5` globally.
- Form labels: `0.875rem`/`600`. Error text: `0.75rem`/`500`, colored `var(--danger)`.

## 5. Layouts

Four layout components in `Ecommerce-FrontEnd/src/layouts/`:

| Layout | Used by | Structure |
|---|---|---|
| `AuthLayout.jsx` | Login/Register | Centered `.auth-card` (max-width 400px) on `--bg-secondary`, full viewport height |
| `CustomerLayout.jsx` | All customer-facing pages | Top navbar (`.navbar`) + content (`.customer-layout main`) + `Footer`; column flex, full viewport height |
| `SellerLayout.jsx` | Seller dashboard pages | `.dashboard-layout`: fixed 260px `.dashboard-sidebar` (nav + logout) + `.dashboard-main` content area |
| `AdminLayout.jsx` | Admin dashboard pages | Same `.dashboard-layout` pattern as Seller, admin-specific nav links |

Seller and Admin share the identical dashboard-shell CSS (`.dashboard-layout`, `.dashboard-sidebar`, `.dashboard-nav-link`, `.dashboard-main`) — only the nav link set and page content differ.

## 6. Navigation

- Customer: top `.navbar` (see Section 4 of `index.css`) — not a sidebar.
- Seller/Admin: left `.dashboard-sidebar` with `.dashboard-header` (role label), `.dashboard-nav` (link list, active state via hover-style `.dashboard-nav-link:hover`), and a `.dashboard-footer` housing `.btn-logout`.
- Route-level access control is enforced by `ProtectedRoute` (`allowedRoles` prop); UI-level gating of individual actions/buttons uses `PermissionGate`.

## 7. Cards

- `.product-card` — used across Home/Listing pages; has its own hover elevation and is included in the theme-transition selector list.
- `.stat-card` — dashboard summary metrics (Admin/Seller dashboards); grid via `.stats-grid` (`repeat(auto-fill, minmax(200px, 1fr))`). `.stat-card-highlight` adds a bullet accent after the value.
- `.auth-card`, `.order-card`, `.address-card`, `.profile-card` — form/detail cards for their respective domains, all theme-token-driven and included in the shared transition rule.

## 8. Forms

- `.form-group` / `.form-label` / `.form-input` — consistent pattern across auth, profile, address, product, and store forms.
- Inputs use `var(--input-bg)`/`var(--input-border)`, focus state adds a `box-shadow: 0 0 0 1px var(--primary)` ring plus `border-color: var(--primary)`.
- Form validation is handled via React Hook Form + Yup (`@hookform/resolvers`); inline errors render through the shared `.error-text` class.

## 9. Tables

- `.product-table` — seller/admin product listings.
- `.table-container` (shared with `.review-card`, `.wishlist-card` in the dark-theme override block) wraps tabular/listing sections for orders, users, sellers, etc. across Admin pages.
- Table styling is theme-token-driven (`var(--surface)`, `var(--border)`).

## 10. Buttons

Purpose-specific button classes rather than a generic variant system:

| Class | Context |
|---|---|
| `.btn-primary` | Primary form submit (auth, generic forms) — full-width, `var(--primary)` background |
| `.btn-logout` | Sidebar logout |
| `.btn-add-to-cart` | Product detail/listing |
| `.btn-remove` | Cart line-item removal |
| `.btn-checkout` | Cart → checkout |
| `.btn-place-order` | Checkout submission |
| `.btn-edit`, `.btn-delete` | Row-level admin/seller table actions |
| `.btn-update-shipment` | Shipment modal |
| `.btn-edit-profile` | Profile page |
| `.btn-manage` | Generic "manage" actions (categories/brands/etc.) |

New buttons should follow this pattern — a purpose-named class using theme tokens — rather than inline styles or a new ad hoc utility class.

## 11. Status Badges

All status pills (order status, return status, seller-profile status, payment status, etc.) are rendered via the shared `getStatusBadgeStyle(status)` utility in `Ecommerce-FrontEnd/src/utils/statusBadge.js`, which maps a status string to a `{ backgroundColor, color, padding, borderRadius, fontSize, fontWeight, display }` inline-style object using the semantic `-bg`/`-text` token pairs. Known mapped statuses include order/return/shipment/refund states (`Delivered`, `Pending`, `Processing`, `Cancelled`, `Rejected`, `Shipped`, `Out for Delivery`, and the full multi-stage return state machine `PENDING_ADMIN_REVIEW` → `INSPECTED_AND_REFUNDED`). Unrecognized statuses fall back to a neutral `--bg-secondary`/`--text-secondary` style rather than erroring. See `rules.md` Rule 10 — do not create a page-local status-color map.

## 12. Pagination UI

- Shared visual pattern: `.pagination` container + `.page-btn` buttons (Previous/Next, and page-number variants), styled with `var(--surface)`/`var(--border)`/`var(--text-primary)`, hover state `var(--surface-hover)`, disabled state dimmed.
- This CSS pattern is reused across every paginated screen (public product listing, seller product listing, admin product listing, brand listing, and — since Phase 14A/D-04 — the product-review pagination inside `ProductInspectionModal`).
- **A reusable `Pagination` component exists** (`Ecommerce-FrontEnd/src/components/common/Pagination.jsx`) — it consumes `currentPage`, `totalPages`, `onPageChange` props and reuses the `.pagination`/`.page-btn` CSS classes. This is the preferred way to render pagination controls for new screens.

## 13. Modals

`.modal-overlay` (full-screen dim backdrop) + `.modal-content` (centered panel) is the shared modal pattern, used by `ProductInspectionModal` (admin), `ShipmentModal` (seller), `ProductDetailModal` (seller), and other detail/edit dialogs. Modal content areas use the same theme tokens and `.page-btn` pagination pattern where they contain paginated sub-content (e.g., reviews inside `ProductInspectionModal`).

## 14. Branding

- `assets/branding/` holds theme-aware logo asset variants plus an `index.js` export map.
- `BrandLogo` (`components/common/BrandLogo.jsx`) selects the light or dark asset variant based on the current theme (from `useTheme`/Redux), with an optional `forceTheme` override prop for contexts that need a fixed variant regardless of the active theme (e.g., a light-only footer band).
- `Logo` (`components/common/Logo.jsx`) exists alongside `BrandLogo` — treat `BrandLogo` as the theme-aware entry point for new usage.

## 15. Responsive Behavior

CSS is organized per functional section (auth, dashboard, navbar, product pages, cart/checkout, orders/tables, footer) rather than per breakpoint, and layout primitives use flexbox/CSS grid with `auto-fill`/`minmax` (e.g., `.stats-grid`) which provides some inherent responsiveness. No dedicated responsive/mobile-specific stylesheet, container-query usage, or automated responsive test evidence was found — treat mobile-breakpoint behavior as **unverified** rather than assuming full responsive coverage on every screen.

## 16. Design Rules for Future Development

1. **Use theme tokens, not literal colors.** Every new color must be one of the existing CSS custom properties, or a newly-added token in both the `:root` and `[data-theme="dark"]` blocks if a genuinely new semantic is needed.
2. **Preserve the existing visual language**: uppercase/letter-spaced section headings, minimal black/white primary palette, semantic (not decorative) use of success/warning/danger/info colors.
3. **Reuse existing classes/components** (`.btn-*`, `.page-btn`, `.stat-card`, `getStatusBadgeStyle`, `BrandLogo`, `Pagination`) rather than inventing parallel ones for the same purpose.
4. **New status values** go into `STATUS_STYLES` in `utils/statusBadge.js`, not into a new local mapping.
5. **New paginated screens** should reuse the `.pagination`/`.page-btn` classes and the backend pagination metadata shape (`architecture.md` §11) rather than inventing new pagination UI.
6. **Do not "fix" the known hardcoded-color exceptions (Section 3)** as a side effect of unrelated work — that is separate, explicitly scoped cleanup (see `rules.md` Rule 20).

## 17. Additions from Priority 1-3

### New components and patterns introduced in Priority 1-3:

- **`Pagination` component** (`components/common/Pagination.jsx`) — reuses `.pagination` and `.page-btn` classes; now the preferred way to render pagination controls.
- **Recently Viewed section** — uses existing `.product-grid` and `.product-card`; no new CSS classes required.
- **Search suggestions dropdown** — new class `.suggestions-dropdown`; styled with theme tokens (`var(--surface)`, `var(--border)`, `var(--shadow)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`). Used in both Home hero search and Listing search.
- **Seller dashboard new cards** — follow existing `cardStyle`/`gridStyle` pattern; icons added as inline SVG cases in the existing `Icon` component; all colors use semantic theme variables.
- **Dark theme fixes** — `select` elements and `.hero-search input` now explicitly use `var(--input-bg)` and `var(--text-primary)` to prevent white-on-white/invisible text.

## 18. Additions from Priority 4-5 (UI/UX)

### Priority 4 (Committed)

- **Notification dropdown** — `NotificationDropdown` (`components/common/NotificationDropdown.jsx`) provides in-app notification display in the navbar/dashboard header; styled with theme tokens.
- **Coupons admin page** — `AdminCouponsPage.jsx` follows the existing admin table/form pattern.
- **Audit log page** — `AdminAuditLogPage.jsx` follows the existing admin table pattern.

### Priority 5 (Uncommitted)

- **VerifyEmailPage** — `VerifyEmailPage.jsx` (`pages/customer/VerifyEmailPage.jsx`) shows the authenticated user's email (read-only), a countdown timer for resend, and an expiry message. Uses the standard `.auth-card`/`.form-group`/`.form-input`/`.btn-primary` pattern.
- **Checkout / Seller registration verification guard** — `CheckoutPage.jsx` and `SellerRegisterPage.jsx` enforce `emailVerified: true` before proceeding; unverified users are prompted to verify their email (link to `VerifyEmailPage`).
- **Google OAuth button** — `GoogleAuthButton.jsx` (`pages/auth/GoogleAuthButton.jsx`) renders a Google sign-in button on the auth pages.
- **Rating moderation warning/modal pattern** — rating-moderation warnings use the existing modal/warning UI pattern; thresholds are defined in `utils/warningThresholds.js`.
- **Dashboard switcher / metric cards** — `DashboardSwitcher.jsx` and `MetricCard.jsx` (`components/common/`) provide reusable dashboard UI.