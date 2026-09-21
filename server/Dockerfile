# ==============================================================================
# Multi-stage Production Dockerfile for PulseSync Backend API
# ==============================================================================

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and build TypeScript
COPY src ./src
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user for security hardening
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Set file permissions
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health/live || exit 1

CMD ["node", "dist/index.js"]
