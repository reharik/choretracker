/**
 * Dev-only: removes the dev admin user so you can run seed:dev-admin again.
 * Not for production.
 */
import knex from "knex";
import { knexConfig } from "../knexfile";

const DEV_ADMIN_EMAIL = "harik.raif@gmail.com";

const cleanDevAdmin = async (): Promise<void> => {
  const db = knex(knexConfig);
  try {
    const deleted = await db("users")
      .where({ email: DEV_ADMIN_EMAIL })
      .delete();
    if (deleted > 0) {
      console.log(
        "Removed dev admin user (email: %s). Run seed:dev-admin to recreate.",
        DEV_ADMIN_EMAIL,
      );
    } else {
      console.log(
        "No dev admin user found (email: %s). Nothing to remove.",
        DEV_ADMIN_EMAIL,
      );
    }
    await db.destroy();
    process.exit(0);
  } catch (err) {
    console.error("cleanDevAdmin failed:", err);
    await db.destroy();
    process.exit(1);
  }
};

void cleanDevAdmin();
