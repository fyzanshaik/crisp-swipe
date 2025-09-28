import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { authRoute } from "./routes/auth";
import { performHealthCheck } from "./utils/health";

const app = new Hono();

app.use("*", logger());

app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.get("/api/health", async (c) => {
  const health = await performHealthCheck();
  return c.json(health, health.overall ? 200 : 503);
});

const apiRoutes = app.basePath("/api")
  .route("/auth", authRoute)
  .get("/health", async (c) => {
    const health = await performHealthCheck();
    return c.json(health, health.overall ? 200 : 503);
  });

app.get("/api/hello-world", (c) => {
  return c.json({ message: "hello world" });
});

app.use("*", serveStatic({ root: "./frontend/dist" }));
app.use("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;
export type ApiRoutes = typeof apiRoutes;
