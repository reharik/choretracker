ARG NODE_VERSION=22
ARG API_WORKSPACE_PATH=apps/api
ARG API_WORKSPACE_NAME=@app/api

# =============================================================================
# BASE IMAGE SETUP
# =============================================================================
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /repo
RUN apt-get update && apt-get install -y git vim && rm -rf /var/lib/apt/lists/*
RUN corepack enable || true

# =============================================================================
# DEPENDENCY PREPARATION STAGES
# =============================================================================

FROM base AS deps-dev-staging
ARG API_WORKSPACE_PATH=apps/api
COPY package.json package-lock.json ./
COPY ${API_WORKSPACE_PATH}/package.json ${API_WORKSPACE_PATH}/package.json
# Copy other workspaces (e.g. packages/*) so npm sees them; otherwise "No workspaces found!"
COPY packages/ packages/
RUN npm ci --workspaces --include-workspace-root --ignore-scripts

FROM base AS deps-prod
ARG API_WORKSPACE_PATH=apps/api
COPY package.json package-lock.json ./
COPY ${API_WORKSPACE_PATH}/package.json ${API_WORKSPACE_PATH}/package.json
COPY packages/ packages/
RUN npm ci --workspaces --include-workspace-root --omit=dev --ignore-scripts

# =============================================================================
# BUILD STAGE
# =============================================================================

FROM base AS build
ARG API_WORKSPACE_PATH=apps/api
ARG API_WORKSPACE_NAME=@app/api
WORKDIR /repo
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY . .
ENV NX_DAEMON=false
RUN npx nx reset || true

# Generate container types (run from repo root so npm finds package.json)
RUN npm run gen:container --workspace=${API_WORKSPACE_NAME}

# Verify the file was generated
RUN test -f ${API_WORKSPACE_PATH}/src/di/awilix.autoload.d.ts || \
  (echo "ERROR: awilix.autoload.d.ts was not generated" && exit 1)

RUN npx nx build api --configuration=production

# =============================================================================
# RUNTIME STAGES
# =============================================================================

FROM node:${NODE_VERSION}-slim AS dev
ENV NODE_ENV=development
WORKDIR /app
RUN apt-get update && apt-get install -y git vim
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY . .
RUN npm install -g nodemon
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=@app/api"]

FROM node:${NODE_VERSION}-slim AS production
ARG API_WORKSPACE_PATH=apps/api
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /repo/${API_WORKSPACE_PATH}/dist ./${API_WORKSPACE_PATH}/dist

# Copy generated Awilix container types to dist
RUN mkdir -p ${API_WORKSPACE_PATH}/dist/di
COPY --from=build /repo/${API_WORKSPACE_PATH}/src/di/awilix.autoload.d.ts ./${API_WORKSPACE_PATH}/dist/di/awilix.autoload.d.ts
RUN test -f ${API_WORKSPACE_PATH}/dist/di/awilix.autoload.d.ts || \
  (echo "ERROR: awilix.autoload.d.ts was not copied to dist" && exit 1)

# Copy server startup script (copy from build stage where source files are)
RUN mkdir -p ${API_WORKSPACE_PATH}/dist/scripts
COPY --from=build /repo/${API_WORKSPACE_PATH}/src/scripts/serverStartUpProd.sh ./${API_WORKSPACE_PATH}/dist/scripts/serverStartUpProd.sh
RUN chmod +x ${API_WORKSPACE_PATH}/dist/scripts/serverStartUpProd.sh

COPY --from=deps-prod /repo/node_modules ./node_modules

RUN (test -d node_modules/dotenv || \
     (echo "ERROR: dotenv not found in node_modules" && \
      echo "Checking what's in node_modules..." && ls node_modules | grep -E '^d' | head -20 && exit 1)) && \
    echo "✓ dotenv verified in node_modules"

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]

FROM production AS staging
ENV NODE_ENV=staging
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY eslint-shared.js ./