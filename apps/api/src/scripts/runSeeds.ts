import knex from "knex";
import { knexConfig } from "../knexfile";

const detectIfSeedsHaveBeenRun = async () => {
  const db = knex(knexConfig);
  const result = await db("users").count("* as count").first();
  return Number(result?.count || 0) > 0;
};

const runSeeds = async () => {
  const db = knex(knexConfig);

  try {
    console.log("Detecting if seed have been run...");
    const seedsHaveBeenRun = await detectIfSeedsHaveBeenRun();
    if (seedsHaveBeenRun) {
      console.log("Seeds have already been run, skipping...");
      await db.destroy();
      process.exit(0);
    }
    console.log("Running database seeds...");
    await db.seed.run();
    console.log("Seeds completed successfully");
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    await db.destroy();
    process.exit(1);
  }
};

void runSeeds();
