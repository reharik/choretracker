import Router from '@koa/router';
import { RESOLVER } from 'awilix';
import type { Context } from 'koa';
import type { Container } from '../container';
import { requireAuth } from '../middleware/routeGuards';
import type { TypedContext } from '../types/koa';

export interface ChoreRoutes {
  mountRoutes: (router: Router) => void;
}

const typedHandler = <T extends Record<string, string>>(
  handler: (ctx: TypedContext<T>) => Promise<Context>,
) => {
  return (ctx: Context) => handler(ctx as TypedContext<T>);
};

export const createChoreRoutes = ({ choreController }: Container): ChoreRoutes => ({
  mountRoutes: (router: Router) => {
    // Weekly summary (includes chores, extras, checks, and computed totals)
    router.get('/chores/weekly', requireAuth(choreController.getWeeklySummary));

    // Bonus settings (must be before /chores/:id to avoid route collision)
    router.get('/chores/bonus-settings', requireAuth(choreController.getBonusSettings));
    router.patch('/chores/bonus-settings', requireAuth(choreController.updateBonusSettings));

    // Snapshots (payday)
    router.post('/chores/snapshot', requireAuth(choreController.createSnapshot));

    // Base chores CRUD
    router.post('/chores', requireAuth(choreController.createChore));
    router.patch('/chores/:id', requireAuth(typedHandler(choreController.updateChore)));
    router.delete('/chores/:id', requireAuth(typedHandler(choreController.deleteChore)));

    // Extra chores
    router.post('/chores/extras', requireAuth(choreController.createExtra));
    router.delete('/chores/extras/:id', requireAuth(typedHandler(choreController.deleteExtra)));

    // Toggle check on/off
    router.post('/chores/checks/toggle', requireAuth(choreController.toggleCheck));
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createChoreRoutes as any)[RESOLVER] = {};
