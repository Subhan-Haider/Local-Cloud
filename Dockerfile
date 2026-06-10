# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install build tools needed for native modules (sharp, etc.)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── Stage 2: Build Next.js ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js production bundle
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production Runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install ffmpeg for video processing and tini for proper signal handling
RUN apk add --no-cache ffmpeg tini

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built Next.js app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Express backend and required files
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/firebase-admin.js ./firebase-admin.js
COPY --from=builder /app/node_modules ./node_modules

# Create uploads directory and set permissions
RUN mkdir -p /data/uploads && chown -R appuser:nodejs /data /app

USER appuser

# Expose Next.js (3000) and Express (5000) ports
EXPOSE 3000 5000

# Use tini as PID 1 to handle signals correctly
ENTRYPOINT ["/sbin/tini", "--"]

# Start both servers using a simple shell script
CMD ["node", "server.js"]
