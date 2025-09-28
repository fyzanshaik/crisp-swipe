import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyToken, type JWTPayload } from "../utils/auth";

type Env = {
  Variables: {
    user: JWTPayload;
  };
};

export const requireRecruiter = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, "auth-token");

  if (!token) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  try {
    const payload = await verifyToken(token);

    if (payload.role !== 'recruiter') {
      return c.json({ error: "Access denied. Recruiter role required" }, 403);
    }

    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
});

export const requireInterviewOwnership = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  const interviewId = c.req.param('id');

  if (!user || !interviewId) {
    return c.json({ error: "Missing required data" }, 400);
  }

  await next();
});