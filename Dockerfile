# seventwo-frontend — imagen standalone (Next 16 + pnpm), igual que web-inmobitwo.
# Las NEXT_PUBLIC_* se hornean en el BUILD -> llegan como build-args desde
# docker-compose.yml, que las lee de .env.production (manual en el VPS).

# ─── deps ───
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@12.6.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ─── build ───
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@12.6.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL=wss://ws.seventwo.tech
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "❌ Falta NEXT_PUBLIC_API_URL (build-arg)" && exit 1)
RUN pnpm build

# ─── runner ───
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
