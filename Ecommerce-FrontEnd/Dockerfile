# ==========================================
# VendorVerse — Frontend Dockerfile
# Multi-stage: build React/Vite → serve via nginx
# ==========================================

# ---- Stage 1: Build the React app ----
# Vite 8 requires Node 20+. Using npm install (lock file may be out of sync).
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Build for production (Vite outputs to /app/dist)
RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]