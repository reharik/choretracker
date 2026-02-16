# ChoreTracker Setup Guide

This document outlines the root-level configuration files that have been added to the ChoreTracker project, based on the network application template.

## Files Created

### Root Level Configuration

1. **package.json** - Root workspace configuration with npm workspaces
   - Defines workspaces: `api`, `web`, `contracts`
   - Contains scripts for building, testing, linting, and development
   - Includes all shared dependencies

2. **tsconfig.json** - Root TypeScript configuration
   - References all workspace projects
   - Configures path aliases for `@chore-tracker/contracts`
   - Sets up Typia plugin for runtime validation

3. **nx.json** - Nx build system configuration
   - Configures caching and build orchestration
   - Defines target defaults for build, test, lint, and serve

4. **eslint-shared.js** - Shared ESLint configuration
   - Common TypeScript rules
   - Prettier integration
   - Jest plugin configuration
   - Factory function for creating project-specific configs

5. **.prettierrc.json** - Prettier code formatting configuration
   - Consistent code style across all projects
   - Includes plugins for organizing imports and formatting package.json

6. **.prettierignore** - Files to exclude from Prettier formatting

7. **.gitignore** - Git ignore patterns
   - node_modules, dist, .env, etc.
   - Nx cache directories

8. **.cursorrules** - Cursor AI coding standards
   - TypeScript best practices
   - Function style rules (arrow functions)
   - Security and performance guidelines

9. **jest.preset.cjs** - Shared Jest configuration preset

10. **.nxignore** - Files for Nx to ignore

11. **.dockerignore** - Docker build context exclusions

12. **.env** & **.env.example** - Environment variable templates

13. **README.md** - Project documentation and usage guide

### API Workspace (`api/`)

1. **package.json** - API-specific dependencies and scripts
2. **tsconfig.json** - TypeScript config extending root
3. **project.json** - Nx project configuration
4. **eslint.config.js** - ESLint config using shared rules
5. **jest.config.js** - Jest test configuration
6. **vite.config.mjs** - Vite build configuration for Node.js
7. **nodemon.json** - Development server configuration
8. **.env.example** - API environment variables template

### Web Workspace (`web/`)

1. **package.json** - Web app dependencies and scripts
2. **tsconfig.json** - TypeScript config with React JSX support
3. **project.json** - Nx project configuration
4. **eslint.config.js** - ESLint config with React plugins
5. **jest.config.js** - Jest test configuration for jsdom
6. **vite.config.js** - Vite build configuration for React
7. **.env.example** - Web app environment variables template

### Contracts Workspace (`contracts/`)

1. **package.json** - Contracts library dependencies and scripts
2. **tsconfig.json** - TypeScript config for library compilation
3. **project.json** - Nx project configuration
4. **eslint.config.js** - ESLint config using shared rules
5. **jest.config.js** - Jest test configuration
6. **src/index.ts** - Main export file for the contracts package

## Next Steps

### 1. Install Dependencies

```bash
cd /home/reharik/Development/ChoreTracker
npm install
```

This will install all dependencies for the root workspace and all sub-workspaces.

### 2. Build Contracts

The contracts package needs to be built first since both API and web depend on it:

```bash
npm run build
```

Or build just contracts:

```bash
cd contracts
npm run build
```

### 3. Set Up Environment Variables

Copy the example env files and update with your values:

```bash
# Root level
cp .env.example .env

# API
cp api/.env.example api/.env

# Web
cp web/.env.example web/.env
```

### 4. Database Setup

If you have a database, run migrations:

```bash
npm run db:migrate
```

### 5. Start Development

Run both API and web in development mode:

```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Web
npm run dev:web
```

## Key Features

### Monorepo Structure

- **npm workspaces** - Shared node_modules and dependency management
- **Nx** - Smart build caching and task orchestration
- **TypeScript project references** - Fast incremental builds

### Development Workflow

- **Hot reload** - Both API and web support hot module replacement
- **Type safety** - Shared types via contracts package
- **Linting** - Consistent code style with ESLint + Prettier
- **Testing** - Jest configured for both Node.js and browser environments

### Scripts

- `npm run build` - Build all packages
- `npm run dev:api` - Start API in development mode
- `npm run dev:web` - Start web in development mode
- `npm run lint` - Lint all projects
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format all code
- `npm run test` - Run all tests
- `npm run dance` - Run format, build, lint, and test

## Troubleshooting

### Build Errors

If you encounter build errors, try:

```bash
npm run build:clean  # Clean build with cache reset
```

### Dependency Issues

If dependencies are out of sync:

```bash
npm run nuke  # Nuclear option: clean everything and reinstall
```

### Type Errors

Make sure contracts are built:

```bash
cd contracts
npm run build
```

## Architecture Notes

### Contracts Package

The contracts package contains shared TypeScript types and validation schemas using Typia. It must be built before the API and web packages can use it.

### Path Aliases

The root tsconfig.json configures path aliases:

- `@chore-tracker/contracts` - Points to contracts/dist/src/index.d.ts

### Build System

- **Vite** - Used for both API (Node.js) and web (React) builds
- **Nx** - Orchestrates builds and manages dependencies between projects
- **TypeScript** - Compiled via Vite with ts-patch for Typia transforms

## Additional Resources

- [Nx Documentation](https://nx.dev)
- [Vite Documentation](https://vitejs.dev)
- [Typia Documentation](https://typia.io)
