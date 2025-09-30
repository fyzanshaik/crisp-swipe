import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function addContentHashColumn() {
  try {
    await pool.query(`
      ALTER TABLE resumes
      ADD COLUMN IF NOT EXISTS content_hash varchar(64);
    `);

    console.log("✓ Successfully added content_hash column to resumes table");
    process.exit(0);
  } catch (error) {
    console.error("Failed to add column:", error);
    process.exit(1);
  }
}

addContentHashColumn();