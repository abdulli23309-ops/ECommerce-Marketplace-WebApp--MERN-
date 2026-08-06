# VendorVerse

VendorVerse is a professional multi-vendor marketplace platform built with the MERN stack.

This frontend app is built with React and Vite, and connects to the VendorVerse backend API for store management, checkout, seller dashboards, and marketplace operations.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open the app in your browser at `http://localhost:5173`.

## Project structure

- `src/` — React application source files
- `src/pages/` — page components for customers, sellers, and admin
- `src/services/` — API service modules
- `src/store/` — Redux store and slices
- `src/layouts/` — layout components for authenticated and public pages

## Branding

This repository is branded as VendorVerse. Update frontend branding, page titles, navbar labels, and footer text to reflect VendorVerse across the user interface.

## Deployment

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
