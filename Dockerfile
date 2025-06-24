# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build  # If your app has a build step

# Stage 2: Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy built assets and production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/healthcheck.js ./

# Install curl for health checks
RUN apk add --no-cache curl

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node healthcheck.js || curl -f http://localhost:3000/health || exit 1

# Non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser
USER appuser

EXPOSE 3000
CMD ["node", "dist/index.js"]