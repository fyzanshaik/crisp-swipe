import { Hono } from "hono";
import { requireCandidate } from "../middleware/candidate-auth";

const candidateRoute = new Hono()
  .use("*", requireCandidate)
  .get("/test", (c) => {
    const user = c.get('user');
    return c.json({
      message: "Candidate auth working",
      userId: user.userId,
      role: user.role
    });
  });

export { candidateRoute };