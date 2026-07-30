# ---------- Base ----------
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ---------- Dependencies (cached layer) ----------
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ---------- Production image ----------
FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Bring in only production node_modules from the deps layer
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run as non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S expressjs -u 1001 \
    && chown -R expressjs:nodejs /app
USER expressjs

EXPOSE 5000

CMD ["node", "server.js"]