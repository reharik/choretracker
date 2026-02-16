import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('weekly_snapshots', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('weekKey').notNullable();
    table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('snapshotData').notNullable(); // Stores the entire weekly summary
    table.timestamp('paidAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    // Unique constraint: one snapshot per user per week
    table.unique(['weekKey', 'userId']);

    // Index for faster lookups
    table.index(['weekKey', 'userId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('weekly_snapshots');
}
