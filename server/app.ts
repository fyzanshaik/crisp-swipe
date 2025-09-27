import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { authRoute } from "./routes/auth";
const app = new Hono();

app.use("*", logger());

const apiRoutes = app.basePath("/api").route("/auth", authRoute);

app.get("/hello-world", (c) => {
  return c.json({ message: "hello world" });
});

app.use("*", serveStatic({ root: "./frontend/dist" }));
app.use("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;

export type ApiRoutes = typeof apiRoutes;
