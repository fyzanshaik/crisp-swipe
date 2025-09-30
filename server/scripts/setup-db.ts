import "dotenv/config";
import { db } from "../db/db";
import { users } from "../db/schema";
import { sql, eq } from "drizzle-orm";
import { hashPassword } from "../utils/auth";

async function setupDatabase() {
  console.log("🗄️  Setting up database...");

  try {
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");

    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log("✅ UUID extension enabled");

    console.log("\n🌱 Seeding users...");

    const candidateEmail = "swipeuser@gmail.com";
    const recruiterEmail = "swipeadmin@gmail.com";
    const password = "11111111";
    const hashedPassword = await hashPassword(password);

    const existingCandidate = await db.query.users.findFirst({
      where: eq(users.email, candidateEmail)
    });

    if (!existingCandidate) {
      await db.insert(users).values({
        email: candidateEmail,
        passwordHash: hashedPassword,
        name: "Test Candidate",
        role: "candidate"
      });
      console.log("✅ Created candidate:", candidateEmail);
    } else {
      console.log("ℹ️  Candidate already exists:", candidateEmail);
    }

    const existingRecruiter = await db.query.users.findFirst({
      where: eq(users.email, recruiterEmail)
    });

    if (!existingRecruiter) {
      await db.insert(users).values({
        email: recruiterEmail,
        passwordHash: hashedPassword,
        name: "Test Recruiter",
        role: "recruiter"
      });
      console.log("✅ Created recruiter:", recruiterEmail);
    } else {
      console.log("ℹ️  Recruiter already exists:", recruiterEmail);
    }

    console.log("\n✨ Database setup complete!");
    console.log("\n📝 Login credentials:");
    console.log("   Candidate:", candidateEmail, "/ 11111111");
    console.log("   Recruiter:", recruiterEmail, "/ 11111111");

    process.exit(0);
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();