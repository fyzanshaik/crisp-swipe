import "dotenv/config";
import { db } from "../server/db/db";
import { sql } from "drizzle-orm";

async function truncateAllTables() {
  console.log("⚠️  WARNING: This will delete ALL data from the database!");
  console.log("Starting database truncation in 3 seconds...");

  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    console.log("🗑️  Truncating all tables...");

    await db.execute(sql`
      TRUNCATE TABLE
        answers,
        interview_sessions,
        interview_questions,
        interviews,
        questions,
        resumes,
        users
      RESTART IDENTITY CASCADE;
    `);

    console.log("✅ All tables truncated successfully!");
    console.log("🔄 All sequences have been reset to 1");
  } catch (error) {
    console.error("❌ Error truncating tables:", error);
    process.exit(1);
  }
}

truncateAllTables()
  .then(() => {
    console.log("✨ Database cleanup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });