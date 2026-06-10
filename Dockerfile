# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

# Build tools needed for native modules (sharp, canvas, etc.)
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

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Lean Production Runtime ───────────────────────────────────────────
FROM node:20-alpine AS runner

# ffmpeg → video processing | tini → proper PID 1 signal handling
RUN apk add --no-cache ffmpeg tini

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 appuser

# ── Copy Next.js standalone server into /app/ui/ ──────────────────────────────
# IMPORTANT: Next.js standalone output includes its own server.js.
# We put it in a SEPARATE directory (/app/ui/) so it does NOT collide
# with our Express server.js at /app/api/server.js.
COPY --from=builder /app/.next/standalone   /app/ui/
COPY --from=builder /app/.next/static       /app/ui/.next/static
COPY --from=builder /app/public             /app/ui/public

# ── Copy Express API into /app/api/ ────────────────────────────────────────────
COPY --from=builder /app/server.js          /app/api/server.js
COPY --from=builder /app/firebase-admin.js  /app/api/firebase-admin.js
COPY --from=builder /app/node_modules       /app/api/node_modules

# ── Copy startup script ────────────────────────────────────────────────────────
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# ── Create persistent data directory ───────────────────────────────────────────
RUN mkdir -p /data/uploads && \
    chown -R appuser:nodejs /data /app

USER appuser

# Next.js UI (3000) and Express API (5000)
EXPOSE 3000 5000

# tini handles signals properly (SIGTERM → graceful shutdown)
ENTRYPOINT ["/sbin/tini", "--"]

# start.sh launches both processes and waits on them
CMD ["/bin/sh", "/app/start.sh"]
