# VendorVerse Development Rules

> Binding constraints for any AI agent (Claude, DeepSeek, Gemini, etc.) or human developer making changes to VendorVerse. These rules are derived from the confirmed architecture (`architecture.md`) and product scope (`prd.md`). They exist to prevent regressions in a codebase that has already been stabilized through 14A phases of work.

## Rule 1 — Source Code Is Authoritative

The current contents of `Ecommerce-FrontEnd/` and `multi-vendor-mern/` always win over historical reports, prior chat summaries, or this documentation set if a conflict is found. If you discover a conflict, fix the documentation (or flag it in `memory.md`) rather than assuming the old report was right.

## Rule 2 — Preserve Existing Functionality

Do not modify working behavior unless the task explicitly requires it. A bug fix should touch only the code path responsible for the bug.

## Rule 3 — Minimal Changes

Modify only the files necessary for the requested feature/fix. Do not "improve" adjacent code as a side effect of an unrelated task.

## Rule 4 — No Unnecessary Refactoring

Do not refactor unrelated code, rename variables, reorganize imports, or restructure components while implementing a feature or fix unless refactoring was the explicit task.

## Rule 5 — No Unauthorized Architecture Changes

Do not change the following without explicit justification and approval:
- The Route → Controller → Service → Repository → Model layering (backend).
- Authentication (JWT issuance, rotating hashed refresh tokens).
- Authorization (`requireRole` / `requirePermission` middleware, `Role`/`Permission`/`PermissionGroup` model shape).
- Database schema/relationships for existing models.
- Existing API request/response contracts.

## Rule 6 — Inspect Before Modifying

Before changing any behavior, trace the full path it lives on:

```
Frontend Page/Component → services/<domain>Service.js → Axios call
  → Express route (routes/<Domain>.routes.js)
  → Controller (controllers/<Domain>.controller.js)
  → Service (services/<Domain>.service.js)
  → Repository (repositories/<Domain>.repository.js)
  → Model (models/<Domain>.model.js)
```

Do not guess at a layer's behavior — open the file and read it.

## Rule 7 — Preserve Tested/Stabilized Work

The following areas have been through explicit stabilization work (see `phases.md`, Phase 14A) and must not be broken by unrelated changes:

- Authentication & Authorization (JWT, roles, permissions)
- Products (seller CRUD, public browsing, admin moderation + global stats)
- Cart, Wishlist, Checkout, Multi-seller order splitting
- Orders, Payments (Dummy/COD/Stripe), Shipments
- Reviews (including admin/product review pagination)
- Returns & Refunds (multi-stage state machine)
- Pagination (backend-driven, `page`/`pageSize`/`total`/`totalPages` shape)
- Theme system (light/dark tokens) and theme-aware branding

## Rule 8 — Do Not Duplicate Existing Logic

Reuse existing:
- Axios service modules (`src/services/*Service.js`) — do not write ad hoc `fetch`/`axios` calls inside components.
- `utils/statusBadge.js` (`getStatusBadgeStyle()`) — do not write a new local status-to-color mapping.
- `utils/imageHelper.js` for image URL resolution.
- Redux slices (`authSlice`, `cartSlice`, `wishlistSlice`, `permissionsSlice`, `themeSlice`) — do not introduce parallel local state for data these slices already own.
- Backend `utils/ApiError.util.js`, `ApiResponse.util.js`, `AsyncHandler.util.js` — every controller action should be wrapped and should respond/throw through these.

## Rule 9 — Theme Rules

Do not introduce hardcoded hex colors, `rgb()`/`rgba()` literals, or inline color styles in new or edited components. Use the existing CSS custom properties defined in `Ecommerce-FrontEnd/src/index.css` (`--bg-primary`, `--surface`, `--text-primary`, `--border`, `--primary`, `--success`/`--warning`/`--danger`/`--info` and their `-bg`/`-text` variants, `--disabled-bg`/`--disabled-text`). Phase 14A (D-02, D-03) specifically removed hardcoded colors from `SellerProductsPage` and `SellerDashboardPage` for this reason — do not reintroduce the pattern elsewhere.

## Rule 10 — Status Helper

Any UI element that renders a status pill/badge (order status, return status, seller-profile status, etc.) must use `getStatusBadgeStyle()` from `utils/statusBadge.js`. If a new status value is introduced, add it to `STATUS_STYLES` in that file rather than writing a page-local helper.

## Rule 11 — Pagination

- If a backend endpoint already returns paginated data (`{ page, pageSize, total, totalPages, ... }`), the frontend must consume that pagination rather than fetching everything and paginating client-side.
- Client-side ("frontend-only") pagination should only be used against a dataset that is intentionally fetched in full.
- Do not replace an existing working pagination implementation without a specific reason recorded in `memory.md`.
- New paginated endpoints should follow the existing repository-layer pattern (`skip = (page - 1) * pageSize`, `limit = pageSize`) and the existing response metadata shape — see `architecture.md` §11.

## Rule 12 — API Contracts

Do not silently change existing request/response shapes (field names, status codes, envelope structure) consumed by the frontend. If a contract change is unavoidable, update both sides together and record the change in `memory.md`.

## Rule 13 — Security

Do not weaken:
- Password hashing (bcrypt, cost factor 12).
- JWT access-token expiry / rotating hashed refresh-token storage (refresh tokens are stored as SHA-256 hashes, never raw).
- `requireRole` / `requirePermission` middleware checks on any existing protected route.
- Helmet headers or the explicit CORS allow-list.
- Multer upload limits (file count/size/mime-type restrictions on product, review, avatar, and store-logo uploads).

## Rule 14 — Testing

There is currently **no automated/API test suite** in either package (no test runner configured, no test files present as of this inspection — see `phases.md` Priority 1). Until that changes:
- Every meaningful backend change should be manually verified against the affected route(s) (e.g., via REST client) end-to-end through the full layer stack.
- Every meaningful frontend change should be verified with `npm run build` (Vite build) succeeding and a manual walkthrough of the affected page/flow.
- Introducing an automated/API test framework is itself a tracked Priority 1 roadmap item (`phases.md`) — do not silently half-introduce one as a side effect of an unrelated task; do it as its own reviewed piece of work.

## Rule 15 — Complete Files

When asked to provide a modified source file for copy/paste, provide the complete file rather than a fragment/diff, unless a fragment is specifically requested.

## Rule 16 — No Guessing

If required behavior is unclear from the source, say so explicitly and either inspect further or ask, rather than inventing behavior, a new endpoint, a new model field, or a new component that does not exist.

## Rule 17 — Regression Protection

Every change must preserve all currently-working functionality listed as "✅ Complete" in `prd.md` §9. If a change risks one of those items, call it out explicitly before proceeding.

## Rule 18 — Two-Project Boundary

`Ecommerce-FrontEnd/` and `multi-vendor-mern/` are separate npm projects with separate `package.json`/`node_modules`. Do not add cross-project imports, and install dependencies only in the project that needs them.

## Rule 19 — Documentation Maintenance

When a change materially affects product scope, architecture, business rules, or the current checkpoint, update the relevant file(s) in `documentation/` (`prd.md`, `architecture.md`, `phases.md`, `memory.md`) as part of that change rather than letting the documentation drift out of date. `memory.md` in particular should be updated at the end of any meaningful work session.

## Rule 20 — Known Verification Items Are Not License to "Fix" Silently

Items flagged as discrepancies in `memory.md` (e.g., the avatar-upload comment/limit mismatch, the `Refund.returnRequest` ref pointing at `'ReturnRequest'` while the registered model is `Return`) are **flagged for verification, not pre-approved for a silent fix**. Confirm the intended behavior and get it explicitly scoped as a task before changing it.
