import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    // Role: 'adult' or 'kid'
    table.string('role', 20).notNullable().defaultTo('kid');

    // Auth fields
    table.string('firstName', 100).nullable();
    table.string('lastName', 100).nullable();
    table.timestamp('lastLoginAt', { useTz: true }).nullable();
    table.timestamp('emailVerifiedAt', { useTz: true }).nullable();
    table.string('emailVerificationToken', 255).nullable();
    table.string('passwordResetToken', 255).nullable();
    table.timestamp('passwordResetExpiresAt', { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('role');
    table.dropColumn('firstName');
    table.dropColumn('lastName');
    table.dropColumn('lastLoginAt');
    table.dropColumn('emailVerifiedAt');
    table.dropColumn('emailVerificationToken');
    table.dropColumn('passwordResetToken');
    table.dropColumn('passwordResetExpiresAt');
  });
}
