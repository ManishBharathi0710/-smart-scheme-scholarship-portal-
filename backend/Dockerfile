# ==============================================================================
# Production Dockerfile for Smart Scheme & Scholarship Portal Backend
# Multi-stage minimal footprint, non-root user execution
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies required for native modules
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code
COPY src ./src

# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# Prune devDependencies to keep production bundle lean
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Add curl for container health checks
RUN apk add --no-cache curl

# Create non-root system user and group
RUN addgroup -g 10001 -S nodejs && \
    adduser -u 10001 -S nodejs -G nodejs

# Set production environment
ENV NODE_ENV=production
ENV PORT=5001

# Copy production artifacts and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create directory for uploads with appropriate permissions
RUN mkdir -p uploads/documents && chown -R nodejs:nodejs uploads

# Switch to unprivileged user
USER nodejs

# Expose HTTP port
EXPOSE 5001

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1

# Start production server
CMD ["node", "dist/server.js"]
