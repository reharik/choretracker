import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('bonus_settings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('overCompletionBonusPercent').notNullable().defaultTo(50);
    t.integer('allChoresCompleteBonusPercent').notNullable().defaultTo(25);
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['userId']); // One settings record per user
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('bonus_settings');
}
