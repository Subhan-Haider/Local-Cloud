#!/bin/sh
# ════════════════════════════════════════════════════════════════════
# LootOps Cloud — Production Startup Script
# Starts both the Express API (port 5000) and Next.js UI (port 3000)
# This file is used by the Docker container.
# ════════════════════════════════════════════════════════════════════

set -e

echo "🚀 Starting LootOps Cloud..."
echo "   Express API  → port ${PORT:-5000}"
echo "   Next.js UI   → port ${NEXTJS_PORT:-3000}"
echo ""

# ── Start Express API backend (port 5000) ─────────────────────────
node /app/api/server.js &
API_PID=$!
echo "✅ Express API started (PID $API_PID)"

# ── Start Next.js standalone server (port 3000) ───────────────────
PORT=${NEXTJS_PORT:-3000} HOSTNAME=0.0.0.0 node /app/ui/server.js &
UI_PID=$!
echo "✅ Next.js UI started (PID $UI_PID)"

echo ""
echo "   Dashboard: http://0.0.0.0:${NEXTJS_PORT:-3000}"
echo "   API:       http://0.0.0.0:${PORT:-5000}"
echo ""

# ── Wait for either process to exit ───────────────────────────────
# If one dies, exit so Docker can restart the container
wait $API_PID $UI_PID
