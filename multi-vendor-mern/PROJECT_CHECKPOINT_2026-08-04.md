# Project Checkpoint — 4 August 2026

## Completed foundation

- Express/Mongoose application startup, MongoDB connection, optional Redis connection, CORS, Helmet, logging, parsing, static uploads and global error handling.
- Authentication: register, login, bcrypt password hashing, JWT access tokens, hashed rotating refresh tokens, logout and validation.
- Authorization: Customer/Seller/Admin roles, permission groups, non-destructive authorization seed, authentication middleware, role middleware and permission middleware.
- Seller/Store foundation: SellerProfile and Store models, seller-owned store access, seller approval gate on store creation, and whitelisted Store updates.
- Category, SubCategory and Brand CRUD: admin write access, public reads and soft deletion.

## Product Catalog implementation status

### Seller product management — implemented

- Product Mongoose model with Store, Category, SubCategory and optional Brand ObjectId references.
- Seller-only product routes: create, list own products, update own product and soft-delete own product.
- Service resolves SellerProfile and Store from JWT user ID, verifies approval, and verifies ownership before update/delete.
- Product validation exists for name, price, stock, category/subcategory/brand ObjectId format, images and isActive.
- Product image upload uses Multer: maximum five image files, allowed image extensions, five MB file limit, and `/uploads/products/<filename>` paths.

### Public product APIs — partially implemented

- `GET /api/v1/products/public`
- `GET /api/v1/products/public/:id`
- They exclude deleted and inactive Product documents.
- They do not yet verify active Store or approved SellerProfile, and do not populate Store/Category/SubCategory/Brand data.

### Search, filtering, sorting and pagination — not implemented

- No query parsing or MongoDB filter construction for public products.
- No `skip`, `limit`, sort, search, category, brand, price-range or pagination metadata implementation.

## Important pending decisions/fixes

1. Public product queries must enforce active Store and approved SellerProfile before being considered marketplace-ready.
2. Public product detail must populate the Store, Category, SubCategory and Brand references as required by the frontend contract.
3. Product creation/update needs business-level validation that referenced Category/SubCategory/Brand documents exist, are active and not soft-deleted; it currently validates ObjectId format only.
4. Confirm whether `isActive` is Seller-editable and restrict product update fields through a service-layer whitelist.
5. Add public search/filter/sort/pagination at MongoDB query level.
6. Add integration tests; no automated test suite was found in the workspace.
7. Implement Seller application and Admin approval APIs so SellerProfile approval does not require manual database changes.

## Audit rule

This checkpoint was created during a read-only code audit. No application source code was changed.
