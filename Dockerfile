# Build Next.js app in a Linux container to avoid Windows Turbopack/root-casing issues
FROM node:20-alpine AS base

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

# Leverage cached deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch

# Copy sources and install
COPY . .
RUN pnpm install --frozen-lockfile

# Disable Turbopack and DevTools in build for stability
ENV NEXT_DISABLE_TURBOPACK=1
ENV NEXT_DISABLE_DEVTOOLS=1

# Build
RUN pnpm build

# Production runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and node_modules
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json

EXPOSE 3000
CMD ["pnpm", "start"]
