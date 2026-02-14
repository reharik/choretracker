import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('email', 255).notNullable().unique();
    t.string('passwordHash', 255).notNullable();
    t.string('name', 200).notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['email']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
