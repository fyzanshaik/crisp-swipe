import { Hono } from "hono";
import { eq, and, or, sql } from "drizzle-orm";
import { requireCandidate } from "../middleware/candidate-auth";
import { db } from "../db/db";
import { interviews, interviewSessions } from "../db/schema";

const candidateRoute = new Hono()
  .use("*", requireCandidate)
  .get("/test", (c) => {
    const user = c.get('user');
    return c.json({
      message: "Candidate auth working",
      userId: user.userId,
      role: user.role
    });
  })
  .get("/dashboard", async (c) => {
    const user = c.get('user');

    const availableInterviews = await db.query.interviews.findMany({
      where: and(
        eq(interviews.status, 'published'),
        or(
          eq(interviews.isPublic, true),
          sql`${interviews.assignedEmails} @> ${JSON.stringify([user.email])}`
        )
      ),
      columns: {
        id: true,
        title: true,
        description: true,
        jobRole: true,
        deadline: true,
        isPublic: true,
        createdAt: true
      }
    });

    const mySessions = await db.query.interviewSessions.findMany({
      where: eq(interviewSessions.userId, user.userId),
      with: {
        interview: {
          columns: {
            id: true,
            title: true,
            jobRole: true
          }
        }
      }
    });

    return c.json({
      availableInterviews,
      mySessions
    });
  });

export { candidateRoute };