# syntax=docker/dockerfile:1.7-labs
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using cache mounts for speed
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application files
COPY src/ ./src/
COPY public/ ./public/

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Run as non-root user
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 expressjs
RUN chown -R expressjs:nodejs /app

USER expressjs

# Use multi-stage copying for minimal image size
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public

# Configuration overrides
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck to verify the Express API is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -no-verbose --tries=1 --spider http://localhost:${PORT}/api/tasks || exit 1

EXPOSE 3000

CMD ["node", "src/server.js"]
