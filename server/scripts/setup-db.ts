import "dotenv/config";
import { db } from "../db/db";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  console.log("🗄️  Setting up database...");
  
  try {
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");
    
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log("✅ UUID extension enabled");
    
    console.log("📝 Run 'bun run db-push' to create tables from schema");
    console.log("📝 Or run 'bun run db-generate' to generate migration files");
    
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
