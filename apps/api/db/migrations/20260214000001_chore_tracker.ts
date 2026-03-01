import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // chores – the recurring chore definitions
  await knex.schema.createTable("chores", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("userId")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.string("name", 200).notNullable();
    t.decimal("baseValue", 8, 2).notNullable();
    t.integer("timesPerWeek").notNullable().defaultTo(1);
    t.integer("sortOrder").notNullable().defaultTo(0);
    t.boolean("isActive").notNullable().defaultTo(true);
    t.timestamp("createdAt", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("updatedAt", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["userId", "isActive"]);
  });

  // chore_extras – one-off extra chores per week
  await knex.schema.createTable("chore_extras", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("userId")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.string("name", 200).notNullable();
    t.decimal("value", 8, 2).notNullable();
    t.string("weekKey", 10).notNullable(); // e.g. "2026-W07"
    t.timestamp("createdAt", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["userId", "weekKey"]);
  });

  // chore_checks – individual check-offs (one per chore per day)
  await knex.schema.createTable("chore_checks", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("userId")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.uuid("choreId")
      .nullable()
      .references("id")
      .inTable("chores")
      .onDelete("CASCADE");
    t.uuid("choreExtraId")
      .nullable()
      .references("id")
      .inTable("chore_extras")
      .onDelete("CASCADE");
    t.string("weekKey", 10).notNullable();
    t.integer("dayIndex").notNullable(); // 0=Mon .. 6=Sun
    t.timestamp("checkedAt", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    // one check per chore per day
    t.unique(["userId", "choreId", "weekKey", "dayIndex"]);
    t.unique(["userId", "choreExtraId", "weekKey", "dayIndex"]);
    t.index(["userId", "weekKey"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("chore_checks");
  await knex.schema.dropTableIfExists("chore_extras");
  await knex.schema.dropTableIfExists("chores");
}
