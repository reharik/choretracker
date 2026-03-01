/** Jest mock for knexfile so tests don't hit real DB. */
export const knexConfig = {
  client: "sqlite3",
  connection: { filename: ":memory:" },
  useNullAsDefault: true,
};
export default knexConfig;
