import { Hono } from "hono";
import { requireRecruiter } from "../middleware/recruiter-auth";

export const recruiterRoute = new Hono()
  .use("*", requireRecruiter)
  .get("/test", (c) => {
    const user = c.get('user');
    return c.json({
      message: "Recruiter access granted",
      user: { id: user.userId, email: user.email, role: user.role }
    });
  });