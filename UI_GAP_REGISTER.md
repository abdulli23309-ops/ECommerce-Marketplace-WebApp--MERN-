# UI Gap Register — VendorVerse (UI-001 → UI-011)

Audit date: 2026-08-30 · Baseline: `v2.0-phase2-remediated-locked` (`e739f64`)

Severity definitions: BLOCKER / HIGH / MEDIUM / LOW (per audit charter).

| Gap ID | Related UI ID | Severity | Page/Component | Problem | Evidence | Required Fix | Status |
|---|---|---|---|---|---|---|---|
| GAP-001 | UI-001 | LOW | `components/common/StatusChip.jsx` | Dead shared component — zero importers; the real status mechanism is `utils/statusBadge.js` (token-based, used by 15 pages). Duplicate UI infrastructure confuses future maintenance. | `Get-ChildItem src -Recurse \| Select-String 'StatusChip'` → only self-reference + docs comments | Delete after confirming no import/runtime dependency | FIXED (deleted; build re-verified) |
| GAP-002 | UI-001 / UI-011 | LOW | Admin ad-hoc modals (`AdminShipmentsPage`, `AdminBrandsPage`, `AdminCategoriesPage`, `AdminCouponsPage`, `AdminOrdersPage`, `AdminSellerAppealsPage`) | Page-local fixed-position dialogs instead of shared `Modal`; lack focus-trap (Escape, overlay click, ARIA roles are present). | grep `position: "fixed"` in pages; `AdminShipmentsPage.jsx:170-186` shows `role="dialog"`, `aria-modal`, overlay-click close, Escape handler in file | Migrate to shared `Modal` (adds focus trap) | DEFERRED — functional, accessible-labels + Escape + theming present; 6-page migration is regression-risk-heavy for a LOW a11y-polish item. Scheduled as follow-up refactor. |
| GAP-003 | UI-011 | LOW (verified, no fix needed) | Dashboard tables (`.product-table`, `.audit-log-table`, `.coupons-table`) | Tables have no explicit horizontal scroll wrapper. | `.dashboard-main` has `overflow-y: auto`; per CSS spec `overflow-x` computes to `auto`, so tables scroll horizontally on mobile instead of clipping | None — behavior verified usable; optional polish: explicit `overflow-x: auto` | VERIFIED-OK |
| GAP-004 | UI-001 | LOW | Date formatting | 28 pages call `toLocaleString`/`toLocaleDateString` directly; `utils/dateHelper.js` (strict, `—` fallback) used by only 2 files. | grep counts: dateHelper importers = 2; raw toLocale pages = 28 | Consolidate on `dateHelper` | DEFERRED — no user-visible inconsistency (same locale semantics); pure code-hygiene refactor. |
| GAP-005 | UI-002 / UI-011 | LOW | Dashboard sidebars | Mobile sidebar uses scrim + open state (implemented); no focus-trap inside open mobile sidebar. | `SellerLayout.jsx`/`AdminLayout.jsx` `dashboard-sidebar-scrim` | Add focus trap / Escape-to-close for mobile drawer | DEFERRED — drawer works (scim click closes); LOW polish. |
| GAP-006 | UI-001 | LOW | `HomePage.jsx`, `ProductListingPage.jsx` | Escape handlers present for suggestion/search popovers (verified) — no gap found on recheck. | grep `key === "Escape"` hits in both files | None | VERIFIED-OK |

No BLOCKER or HIGH gaps were found. All MEDIUM-candidate findings degraded to LOW/DEFERRED on evidence review (each suspected gap was traced to working, themed, token-based implementations).

## Non-gaps explicitly verified (do not re-open)

- `window.confirm` / `alert()`: zero occurrences — `ConfirmDialog` policy respected.
- `<img>` missing `alt`: zero occurrences.
- Route reachability: build resolves every lazy import; `NotFound` wildcard present.
- Dead pages: `ReturnDetailPage`, `ReturnHistoryPage`, `SellerProductsPage`, `ShipmentModal`, `GoogleAuthButton` deleted at baseline lock (proven zero importers; Google auth lives in `AuthLayout` via `@react-oauth/google`).
- Suspension/appeal flow: seller allowlist guard (`SellerLayout`), suspension screen, appeal list/new/detail, admin decisions with mandatory rejection reason — all reachable and linked.
