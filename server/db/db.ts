import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

/**
 * To seed the database with demo data, run the following command:
 * Candidate: swipeuser@gmail.com / 11111111
 * Recruiter: swipeadmin@gmail.com / 11111111
 */

export const db = drizzle({ client: pool, schema });
