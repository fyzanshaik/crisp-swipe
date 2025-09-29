import "dotenv/config";
import { db } from "../server/db/db";
import { interviewSessions } from "../server/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const fromArg = process.argv[2];
  const fromEnv = process.env.SESSION_ID;
  const id = fromArg || fromEnv;

  if (!id) {
    console.error("SESSION_ID not provided. Usage: SESSION_ID=<id> bun scripts/delete-sessions.ts or bun scripts/delete-sessions.ts <id>");
    process.exit(1);
  }

  console.log("Deleting session:", id);
  await db.delete(interviewSessions).where(eq(interviewSessions.id, id));
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
