import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", logger());

app.get("/hello-world", (c) => {
  return c.json({ message: "hello world" });
});

export default app;
