import { RESOLVER } from 'awilix';
import type { Context } from 'koa';
import type { Container } from '../container';
import type { TypedContext } from '../types/koa';

export interface ChoreController {
  getWeeklySummary: (ctx: Context) => Promise<Context>;
  createChore: (ctx: Context) => Promise<Context>;
  updateChore: (ctx: TypedContext<{ id: string }>) => Promise<Context>;
  deleteChore: (ctx: TypedContext<{ id: string }>) => Promise<Context>;
  createExtra: (ctx: Context) => Promise<Context>;
  deleteExtra: (ctx: TypedContext<{ id: string }>) => Promise<Context>;
  toggleCheck: (ctx: Context) => Promise<Context>;
  getBonusSettings: (ctx: Context) => Promise<Context>;
  updateBonusSettings: (ctx: Context) => Promise<Context>;
}

export const createChoreController = ({ choreRepository }: Container): ChoreController => ({
  getWeeklySummary: async (ctx: Context): Promise<Context> => {
    const userId = ctx.user!.id;
    const weekKey = (ctx.query.weekKey as string) || getCurrentWeekKey();

    // Pass userId only for bonus settings, but chore data is shared across all users
    const summary = await choreRepository.getWeeklySummary(weekKey, userId);
    ctx.status = 200;
    ctx.body = summary;
    return ctx;
  },

  createChore: async (ctx: Context): Promise<Context> => {
    const userId = ctx.user!.id;
    const { name, baseValue, timesPerWeek, sortOrder } = ctx.request.body;

    if (!name || baseValue == null || timesPerWeek == null) {
      ctx.status = 400;
      ctx.body = { error: 'name, baseValue, and timesPerWeek are required' };
      return ctx;
    }

    const chore = await choreRepository.createChore(userId, {
      name,
      baseValue: Number(baseValue),
      timesPerWeek: Number(timesPerWeek),
      sortOrder: sortOrder != null ? Number(sortOrder) : undefined,
    });
    ctx.status = 201;
    ctx.body = chore;
    return ctx;
  },

  updateChore: async (ctx: TypedContext<{ id: string }>): Promise<Context> => {
    const choreId = ctx.params.id;

    const chore = await choreRepository.updateChore(choreId, ctx.request.body);
    if (!chore) {
      ctx.status = 404;
      ctx.body = { error: 'Chore not found' };
      return ctx;
    }
    ctx.status = 200;
    ctx.body = chore;
    return ctx;
  },

  deleteChore: async (ctx: TypedContext<{ id: string }>): Promise<Context> => {
    const choreId = ctx.params.id;

    const deleted = await choreRepository.deleteChore(choreId);
    if (!deleted) {
      ctx.status = 404;
      ctx.body = { error: 'Chore not found' };
      return ctx;
    }
    ctx.status = 204;
    return ctx;
  },

  createExtra: async (ctx: Context): Promise<Context> => {
    const userId = ctx.user!.id;
    const { name, value, weekKey } = ctx.request.body;

    if (!name || value == null || !weekKey) {
      ctx.status = 400;
      ctx.body = { error: 'name, value, and weekKey are required' };
      return ctx;
    }

    const extra = await choreRepository.createExtra(userId, {
      name,
      value: Number(value),
      weekKey,
    });
    ctx.status = 201;
    ctx.body = extra;
    return ctx;
  },

  deleteExtra: async (ctx: TypedContext<{ id: string }>): Promise<Context> => {
    const extraId = ctx.params.id;

    const deleted = await choreRepository.deleteExtra(extraId);
    if (!deleted) {
      ctx.status = 404;
      ctx.body = { error: 'Extra chore not found' };
      return ctx;
    }
    ctx.status = 204;
    return ctx;
  },

  toggleCheck: async (ctx: Context): Promise<Context> => {
    const userId = ctx.user!.id;
    const { choreId, choreExtraId, weekKey, dayIndex } = ctx.request.body;

    if (!weekKey || dayIndex == null || (!choreId && !choreExtraId)) {
      ctx.status = 400;
      ctx.body = { error: 'weekKey, dayIndex, and either choreId or choreExtraId are required' };
      return ctx;
    }

    const result = await choreRepository.toggleCheck(userId, {
      choreId,
      choreExtraId,
      weekKey,
      dayIndex: Number(dayIndex),
    });
    ctx.status = 200;
    ctx.body = result;
    return ctx;
  },

  getBonusSettings: async (ctx: Context): Promise<Context> => {
    const userId = ctx.user!.id;
    const settings = await choreRepository.getBonusSettings(userId);
    ctx.status = 200;
    ctx.body = settings;
    return ctx;
  },

  updateBonusSettings: async (ctx: Context): Promise<Context> => {
    const userId = ctx.user!.id;
    const { overCompletionBonusPercent, allChoresCompleteBonusPercent } = ctx.request.body;

    if (
      overCompletionBonusPercent != null &&
      (overCompletionBonusPercent < 0 || overCompletionBonusPercent > 100)
    ) {
      ctx.status = 400;
      ctx.body = { error: 'overCompletionBonusPercent must be between 0 and 100' };
      return ctx;
    }

    if (
      allChoresCompleteBonusPercent != null &&
      (allChoresCompleteBonusPercent < 0 || allChoresCompleteBonusPercent > 100)
    ) {
      ctx.status = 400;
      ctx.body = { error: 'allChoresCompleteBonusPercent must be between 0 and 100' };
      return ctx;
    }

    const settings = await choreRepository.updateBonusSettings(userId, {
      overCompletionBonusPercent,
      allChoresCompleteBonusPercent,
    });
    ctx.status = 200;
    ctx.body = settings;
    return ctx;
  },
});

function getCurrentWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
  );
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createChoreController as any)[RESOLVER] = {};
