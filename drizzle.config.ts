import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./server/db/drizzle",
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
