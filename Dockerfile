# ---- build stage ----
FROM node:22-bookworm-slim AS build
WORKDIR /app

# CI-friendly env
ENV HUSKY=0
ENV CI=true

# Use pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Ensure git is available for build and runtime scripts
RUN apt-get update && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

# Accept build-time variables from Railway (injected as Docker build args)
ARG VITE_PUBLIC_APP_URL
ARG E2B_API_KEY
ARG VITE_E2B_API_KEY
ARG OPEN_ROUTER_API_KEY
ENV VITE_PUBLIC_APP_URL=${VITE_PUBLIC_APP_URL}
ENV E2B_API_KEY=${E2B_API_KEY}
ENV VITE_E2B_API_KEY=${VITE_E2B_API_KEY}
ENV OPEN_ROUTER_API_KEY=${OPEN_ROUTER_API_KEY}

# Install deps efficiently
COPY package.json pnpm-lock.yaml* ./
RUN pnpm fetch

# Copy source and build
COPY . .
# install with dev deps (needed to build)
RUN pnpm install --offline --frozen-lockfile

# Build the Remix app (SSR + client)
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm run build

# ---- production dependencies stage ----
FROM build AS prod-deps

# Keep only production deps for runtime
RUN pnpm prune --prod --ignore-scripts


# ---- development stage (not used by default) ----
FROM build AS development

# Non-sensitive development arguments
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX

# Set non-sensitive environment variables for development
ENV VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX} \
    RUNNING_IN_DOCKER=true

RUN mkdir -p /app/run
CMD ["pnpm", "run", "dev", "--host"]


# ---- production stage (DEFAULT — must be last) ----
FROM prod-deps AS bolt-ai-production
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
# PORT is set by Railway at runtime — don't hardcode it

# Non-sensitive build arguments
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX

# Set non-sensitive environment variables
ENV WRANGLER_SEND_METRICS=false \
    VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX} \
    RUNNING_IN_DOCKER=true

# Install curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Copy built files, server, and deps
COPY --from=prod-deps /app/build /app/build
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/package.json /app/package.json
COPY --from=prod-deps /app/server.mjs /app/server.mjs

EXPOSE 8080

# Healthcheck uses $PORT so it works regardless of which port Railway assigns
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD curl -fsS http://localhost:${PORT:-8080}/ || exit 1

# Start with Node.js server (not Wrangler)
CMD ["node", "server.mjs"]
