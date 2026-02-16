ARG NODE_VERSION=22

# =============================================================================
# BASE IMAGE SETUP
# =============================================================================
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /repo
# Install git for GitHub dependencies
RUN apt-get update && apt-get install -y git vim && rm -rf /var/lib/apt/lists/*
RUN corepack enable || true

# =============================================================================
# DEPENDENCY PREPARATION STAGES
# =============================================================================

# Development and staging dependencies - includes all dependencies
FROM base AS deps-dev-staging
COPY package.json package-lock.json ./
COPY api/package.json api/package.json
COPY contracts/package.json contracts/package.json
RUN npm ci --workspaces --include-workspace-root --ignore-scripts

# Production dependencies - only production dependencies
FROM base AS deps-prod
COPY package.json package-lock.json ./
COPY api/package.json api/package.json
COPY contracts/package.json contracts/package.json
RUN npm ci --workspaces --include-workspace-root --only=production --ignore-scripts

# =============================================================================
# BUILD STAGE
# =============================================================================

# Build stage - creates production build for staging and production
FROM base AS build
WORKDIR /repo
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY . .
# Disable Nx daemon in Docker (causes hangs/crashes)
ENV NX_DAEMON=false
# Clear Nx cache to avoid stale state issues
RUN npx nx reset || true
# Build contracts first (required dependency)
RUN npx nx build contracts
# Build API
RUN npx nx build api --configuration=production

# =============================================================================
# RUNTIME STAGES
# =============================================================================

# Development runtime - full environment with hot reloading
FROM node:${NODE_VERSION}-slim AS dev
ENV NODE_ENV=development
WORKDIR /app
RUN apt-get update && apt-get install -y git vim 
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY . .
RUN npm install -g nodemon
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=@app/api"]

# Production runtime - minimal dependencies, optimized for production
FROM node:${NODE_VERSION}-slim AS production
ENV NODE_ENV=production
WORKDIR /app
# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /repo/api/dist ./api/dist
COPY --from=build /repo/contracts/dist ./contracts/dist
COPY --from=deps-prod /repo/node_modules ./node_modules
# Verify dotenv is available (it should be in production dependencies)
RUN (test -d node_modules/dotenv || \
     (echo "ERROR: dotenv not found in node_modules" && \
      echo "Checking what's in node_modules..." && ls node_modules | grep -E '^d' | head -20 && exit 1)) && \
    echo "✓ dotenv verified in node_modules"
# Note: .env file should be provided via docker-compose env_file or environment variables
EXPOSE 3000
CMD ["node", "api/dist/index.js"]

# Staging/CI runtime - production base with CI tools
FROM production AS staging
ENV NODE_ENV=staging
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY eslint-shared.js ./
