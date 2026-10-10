# ==============================================================================
# Production Dockerfile for Smart Scheme & Scholarship Portal Frontend
# Multi-stage build with Nginx Alpine static serving and SPA routing
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source code
COPY . ./

# Build optimized static distribution bundle in /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Minimal Nginx Runtime
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Add curl for health check
RUN apk add --no-cache curl

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/nginx-health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
