# Chore Tracker – Integration Guide

## New Files to Add

Drop these files into your existing project:

```
network/
├── apps/
│   ├── api/
│   │   ├── db/migrations/
│   │   │   └── 20260214000000_chore_tracker.ts        ← migration
│   │   └── src/
│   │       ├── controllers/
│   │       │   └── choreController.ts                  ← controller
│   │       ├── repositories/
│   │       │   └── choreRepository.ts                  ← repository
│   │       └── routes/
│   │           └── choreRoutes.ts                      ← routes
│   └── web/
│       └── src/
│           ├── hooks/
│           │   └── useChoreService.ts                  ← service hook
│           └── pages/
│               └── Chores.tsx                          ← page component
└── packages/
    └── contracts/
        └── src/
            └── types/
                └── chores.ts                           ← contract types
```

## Wiring Changes (existing files to update)

### 1. `packages/contracts/src/index.ts`
Add the export:
```ts
export * from './types/chores';
```

### 2. `packages/contracts/src/types/entities.ts`
No changes needed — chore types live in their own file.

### 3. `apps/api/src/routes/createRoutes.ts`
Add `choreRoutes` to the destructured container and mount it:
```ts
export const createRoutes = ({
  userRoutes,
  contactRoutes,
  planRoutes,
  touchesRoutes,
  authRoutes,
  communicationRoutes,
  healthRoutes,
  choreRoutes,        // ← add
}: Container): Routes => ({
  mountRoutes: (router: Router) => {
    healthRoutes.mountRoutes(router);
    authRoutes.mountRoutes(router);
    userRoutes.mountRoutes(router);
    contactRoutes.mountRoutes(router);
    planRoutes.mountRoutes(router);
    touchesRoutes.mountRoutes(router);
    communicationRoutes.mountRoutes(router);
    choreRoutes.mountRoutes(router);   // ← add
  },
});
```

### 4. `apps/api/src/di/awilix.autoload.d.ts`
Add these type imports and container entries:
```ts
// Add these type declarations:
type ChoreRepository = import('../repositories/choreRepository').ChoreRepository;
type ChoreController = import('../controllers/choreController').ChoreController;
type ChoreRoutes = import('../routes/choreRoutes').ChoreRoutes;

// Add to AutoLoadedContainer interface:
export interface AutoLoadedContainer {
  // ... existing entries ...
  choreRepository: ChoreRepository;
  choreController: ChoreController;
  choreRoutes: ChoreRoutes;
}
```
Or just run `npm run gen:container` if that regenerates it automatically.

### 5. `apps/web/src/Routes.tsx`
Add the lazy import and route:
```tsx
const Chores = lazy(async () => {
  const mod = await import('./pages/Chores');
  return { default: mod.Chores };
});

// Inside the protected route group:
<Route path="chores" element={<Chores />} />
```

### 6. Navigation (Layout.tsx or wherever your nav lives)
Add a link to `/chores` in your nav menu.

## Run the Migration

```bash
# From project root
cd apps/api
npx knex migrate:latest
```

## API Endpoints

All routes are under `/api/chores` and require auth:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chores/weekly?weekKey=2026-W07` | Full weekly summary (chores, extras, checks, computed totals) |
| POST | `/chores` | Create a base chore `{ name, baseValue, timesPerWeek }` |
| PATCH | `/chores/:id` | Update a chore |
| DELETE | `/chores/:id` | Delete a chore |
| POST | `/chores/extras` | Create an extra chore `{ name, value, weekKey }` |
| DELETE | `/chores/extras/:id` | Delete an extra |
| POST | `/chores/checks/toggle` | Toggle a check `{ choreId?, choreExtraId?, weekKey, dayIndex }` |

## Notes

- The awilix autoloader should pick up the new repository, controller, and routes automatically (they all have the `[RESOLVER]` marker) — you just need the types in `awilix.autoload.d.ts`.
- All data is scoped to `userId` from the JWT, so it's multi-tenant safe.
- Weekly summaries are computed server-side, so your print/payday calculations are always consistent.
- The `chore_checks` table has unique constraints to prevent double-checks on the same chore+day.
- `baseValue` is stored as `decimal(8,2)` in Postgres for precise currency math.
