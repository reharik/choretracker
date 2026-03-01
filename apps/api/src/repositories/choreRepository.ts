import type {
  BonusSettings,
  Chore,
  ChoreCheck,
  ChoreExtra,
  ChoreWeeklySummary,
  CreateChoreExtraInput,
  CreateChoreInput,
  CreateSnapshotInput,
  ToggleCheckInput,
  UpdateBonusSettingsInput,
  UpdateChoreInput,
  WeeklySnapshot,
} from "@chore-tracker/contracts";
import { RESOLVER } from "awilix";
import type { Container } from "../container";

export interface ChoreRepository {
  getChores: () => Promise<Chore[]>;
  createChore: (userId: string, input: CreateChoreInput) => Promise<Chore>;
  updateChore: (
    choreId: string,
    input: UpdateChoreInput,
  ) => Promise<Chore | undefined>;
  deleteChore: (choreId: string) => Promise<boolean>;
  getExtras: (weekKey: string) => Promise<ChoreExtra[]>;
  createExtra: (
    userId: string,
    input: CreateChoreExtraInput,
  ) => Promise<ChoreExtra>;
  deleteExtra: (extraId: string) => Promise<boolean>;
  getChecks: (weekKey: string) => Promise<ChoreCheck[]>;
  toggleCheck: (
    userId: string,
    input: ToggleCheckInput,
  ) => Promise<{ checked: boolean; check?: ChoreCheck }>;
  getWeeklySummary: (
    weekKey: string,
    userId?: string,
  ) => Promise<ChoreWeeklySummary>;
  getBonusSettings: (userId: string) => Promise<BonusSettings>;
  updateBonusSettings: (
    userId: string,
    input: UpdateBonusSettingsInput,
  ) => Promise<BonusSettings>;
  createSnapshot: (
    userId: string,
    input: CreateSnapshotInput,
  ) => Promise<WeeklySnapshot>;
  getSnapshot: (
    userId: string,
    weekKey: string,
  ) => Promise<WeeklySnapshot | undefined>;
}

export const createChoreRepository = ({
  connection,
  logger,
}: Container): ChoreRepository => ({
  getChores: async (): Promise<Chore[]> => {
    return connection("chores")
      .where({ isActive: true })
      .orderBy("sortOrder", "asc")
      .orderBy("createdAt", "asc");
  },

  createChore: async (
    userId: string,
    input: CreateChoreInput,
  ): Promise<Chore> => {
    const [chore] = await connection("chores")
      .insert({
        id: connection.raw("gen_random_uuid()"),
        userId,
        name: input.name,
        baseValue: input.baseValue,
        timesPerWeek: input.timesPerWeek,
        sortOrder: input.sortOrder ?? 0,
        isActive: true,
        createdAt: connection.fn.now(),
        updatedAt: connection.fn.now(),
      })
      .returning("*");
    logger.info("Chore created", {
      userId,
      choreId: chore.id,
      name: input.name,
    });
    return chore;
  },

  updateChore: async (
    choreId: string,
    input: UpdateChoreInput,
  ): Promise<Chore | undefined> => {
    const [chore] = await connection("chores")
      .where({ id: choreId })
      .update({ ...input, updatedAt: connection.fn.now() })
      .returning("*");
    return chore;
  },

  deleteChore: async (choreId: string): Promise<boolean> => {
    const count = await connection("chores").where({ id: choreId }).delete();
    return count > 0;
  },

  getExtras: async (weekKey: string): Promise<ChoreExtra[]> => {
    return connection("chore_extras")
      .where({ weekKey })
      .orderBy("createdAt", "asc");
  },

  createExtra: async (
    userId: string,
    input: CreateChoreExtraInput,
  ): Promise<ChoreExtra> => {
    const [extra] = await connection("chore_extras")
      .insert({
        id: connection.raw("gen_random_uuid()"),
        userId,
        name: input.name,
        value: input.value,
        weekKey: input.weekKey,
        createdAt: connection.fn.now(),
      })
      .returning("*");
    logger.info("Extra chore created", {
      userId,
      extraId: extra.id,
      name: input.name,
      weekKey: input.weekKey,
    });
    return extra;
  },

  deleteExtra: async (extraId: string): Promise<boolean> => {
    // Also delete any checks for this extra
    await connection("chore_checks").where({ choreExtraId: extraId }).delete();
    const count = await connection("chore_extras")
      .where({ id: extraId })
      .delete();
    return count > 0;
  },

  getChecks: async (weekKey: string): Promise<ChoreCheck[]> => {
    return connection("chore_checks")
      .where({ weekKey })
      .orderBy("checkedAt", "asc");
  },

  toggleCheck: async (
    userId: string,
    input: ToggleCheckInput,
  ): Promise<{ checked: boolean; check?: ChoreCheck }> => {
    const where: Record<string, unknown> = {
      userId,
      weekKey: input.weekKey,
      dayIndex: input.dayIndex,
    };

    if (input.choreId) {
      where.choreId = input.choreId;
    } else if (input.choreExtraId) {
      where.choreExtraId = input.choreExtraId;
    }

    const existing = await connection("chore_checks").where(where).first();

    if (existing) {
      await connection("chore_checks").where({ id: existing.id }).delete();
      return { checked: false };
    }

    const [check] = await connection("chore_checks")
      .insert({
        id: connection.raw("gen_random_uuid()"),
        userId,
        choreId: input.choreId ?? null,
        choreExtraId: input.choreExtraId ?? null,
        weekKey: input.weekKey,
        dayIndex: input.dayIndex,
        checkedAt: connection.fn.now(),
      })
      .returning("*");

    return { checked: true, check };
  },

  getWeeklySummary: async (
    weekKey: string,
    userId?: string,
  ): Promise<ChoreWeeklySummary> => {
    // Check if there's a snapshot for this week (if userId provided)
    if (userId) {
      const snapshot = await connection("weekly_snapshots")
        .where({ userId, weekKey })
        .first();

      if (snapshot) {
        // Return snapshot data with isPaid flag
        const data =
          typeof snapshot.snapshotData === "string"
            ? JSON.parse(snapshot.snapshotData)
            : snapshot.snapshotData;
        return { ...data, isPaid: true };
      }
    }

    // No snapshot found, calculate live data
    const [chores, extras, checks] = await Promise.all([
      connection("chores")
        .where({ isActive: true })
        .orderBy("sortOrder", "asc"),
      connection("chore_extras").where({ weekKey }).orderBy("createdAt", "asc"),
      connection("chore_checks").where({ weekKey }),
    ]);

    // Get bonus settings for the user if userId is provided, otherwise use defaults
    let settings;
    if (userId) {
      settings = await connection("bonus_settings").where({ userId }).first();
      if (!settings) {
        [settings] = await connection("bonus_settings")
          .insert({
            id: connection.raw("gen_random_uuid()"),
            userId,
            overCompletionBonusPercent: 50,
            allChoresCompleteBonusPercent: 25,
          })
          .returning("*");
      }
    } else {
      // Default settings if no user
      settings = {
        overCompletionBonusPercent: 50,
        allChoresCompleteBonusPercent: 25,
      };
    }

    const overCompletionRate = settings.overCompletionBonusPercent / 100;
    const allChoresCompleteRate = settings.allChoresCompleteBonusPercent / 100;

    const choreCompletions = chores.map((chore: Chore) => {
      const completions = checks.filter(
        (c: ChoreCheck) => c.choreId === chore.id,
      ).length;
      const base =
        Math.min(completions, chore.timesPerWeek) * Number(chore.baseValue);
      // Extra completions earn 100% + bonus% (e.g., if bonus is 25%, extra earns 125% of base value)
      const extra =
        Math.max(0, completions - chore.timesPerWeek) *
        (Number(chore.baseValue) * (1 + overCompletionRate));
      return { ...chore, completions, earned: base + extra };
    });

    const extraCompletions = extras.map((ex: ChoreExtra) => {
      const completions = checks.filter(
        (c: ChoreCheck) => c.choreExtraId === ex.id,
      ).length;
      return { ...ex, completions, earned: completions * Number(ex.value) };
    });

    const baseEarned = choreCompletions.reduce(
      (s: number, c: { earned: number }) => s + c.earned,
      0,
    );
    const extrasEarned = extraCompletions.reduce(
      (s: number, e: { earned: number }) => s + e.earned,
      0,
    );
    const totalPossible = chores.reduce(
      (s: number, c: Chore) => s + Number(c.baseValue) * c.timesPerWeek,
      0,
    );

    const completionRate =
      totalPossible > 0
        ? choreCompletions.reduce(
            (s: number, c: { completions: number; timesPerWeek: number }) =>
              s + Math.min(c.completions / c.timesPerWeek, 1),
            0,
          ) / chores.length
        : 0;

    const bonusActive = completionRate >= 1.0;
    const bonusAmount = bonusActive ? baseEarned * allChoresCompleteRate : 0;
    const grandTotal = baseEarned + bonusAmount + extrasEarned;

    return {
      chores: choreCompletions,
      extras: extraCompletions,
      checks,
      baseEarned,
      extrasEarned,
      bonusAmount,
      grandTotal,
      completionRate,
      bonusActive,
      bonusSettings: settings,
      isPaid: false, // Live data is not paid yet
    };
  },

  getBonusSettings: async (userId: string): Promise<BonusSettings> => {
    let settings = await connection("bonus_settings").where({ userId }).first();

    if (!settings) {
      [settings] = await connection("bonus_settings")
        .insert({
          id: connection.raw("gen_random_uuid()"),
          userId,
          overCompletionBonusPercent: 50,
          allChoresCompleteBonusPercent: 25,
        })
        .returning("*");
    }

    return settings;
  },

  updateBonusSettings: async (
    userId: string,
    input: UpdateBonusSettingsInput,
  ): Promise<BonusSettings> => {
    // First ensure settings exist
    let settings = await connection("bonus_settings").where({ userId }).first();

    if (!settings) {
      [settings] = await connection("bonus_settings")
        .insert({
          id: connection.raw("gen_random_uuid()"),
          userId,
          overCompletionBonusPercent: input.overCompletionBonusPercent ?? 50,
          allChoresCompleteBonusPercent:
            input.allChoresCompleteBonusPercent ?? 25,
        })
        .returning("*");
      return settings;
    }

    const updateData: Record<string, unknown> = {
      updatedAt: connection.fn.now(),
    };

    if (input.overCompletionBonusPercent !== undefined) {
      updateData.overCompletionBonusPercent = input.overCompletionBonusPercent;
    }
    if (input.allChoresCompleteBonusPercent !== undefined) {
      updateData.allChoresCompleteBonusPercent =
        input.allChoresCompleteBonusPercent;
    }

    const [updated] = await connection("bonus_settings")
      .where({ userId })
      .update(updateData)
      .returning("*");

    return updated;
  },

  createSnapshot: async (
    userId: string,
    input: CreateSnapshotInput,
  ): Promise<WeeklySnapshot> => {
    const { weekKey } = input;

    // Get the current weekly summary
    const summary = await createChoreRepository({
      connection,
      logger,
    }).getWeeklySummary(weekKey, userId);

    // Check if snapshot already exists
    const existing = await connection("weekly_snapshots")
      .where({ userId, weekKey })
      .first();

    if (existing) {
      // Update existing snapshot
      const [updated] = await connection("weekly_snapshots")
        .where({ userId, weekKey })
        .update({
          snapshotData: JSON.stringify(summary),
          paidAt: connection.fn.now(),
        })
        .returning("*");

      return {
        ...updated,
        snapshotData:
          typeof updated.snapshotData === "string"
            ? JSON.parse(updated.snapshotData)
            : updated.snapshotData,
      };
    }

    // Create new snapshot
    const [snapshot] = await connection("weekly_snapshots")
      .insert({
        id: connection.raw("gen_random_uuid()"),
        userId,
        weekKey,
        snapshotData: JSON.stringify(summary),
      })
      .returning("*");

    return {
      ...snapshot,
      snapshotData:
        typeof snapshot.snapshotData === "string"
          ? JSON.parse(snapshot.snapshotData)
          : snapshot.snapshotData,
    };
  },

  getSnapshot: async (
    userId: string,
    weekKey: string,
  ): Promise<WeeklySnapshot | undefined> => {
    const snapshot = await connection("weekly_snapshots")
      .where({ userId, weekKey })
      .first();

    if (!snapshot) {
      return undefined;
    }

    return {
      ...snapshot,
      snapshotData:
        typeof snapshot.snapshotData === "string"
          ? JSON.parse(snapshot.snapshotData)
          : snapshot.snapshotData,
    };
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
(createChoreRepository as any)[RESOLVER] = {};
