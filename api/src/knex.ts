import knex, { type Knex } from 'knex';
import { knexConfig } from './knexfile';
export const database: Knex = knex(knexConfig);

process.on('SIGINT', async () => {
  await database.destroy();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await database.destroy();
  process.exit(0);
});
