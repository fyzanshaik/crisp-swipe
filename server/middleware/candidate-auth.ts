import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyToken, type JWTPayload } from "../utils/auth";

type Env = {
  Variables: {
    user: JWTPayload;
  };
};

export const requireCandidate = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, "auth-token");

  if (!token) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  try {
    const payload = await verifyToken(token);

    if (payload.role !== 'candidate') {
      return c.json({ error: "Access denied. Candidate role required" }, 403);
    }

    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});