import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { requireRecruiter } from "../middleware/recruiter-auth";
import { db } from "../db/db";
import { interviews, questions, interviewQuestions } from "../db/schema";
import { createInterviewSchema, updateInterviewSchema, createQuestionSchema, generateQuestionsSchema, regenerateQuestionSchema, assignQuestionsSchema } from "../utils/validation";
import { generateAllQuestionsPlaceholder, regenerateQuestionPlaceholder } from "../utils/ai-placeholders";

export const recruiterRoute = new Hono()
  .use("*", requireRecruiter)
  .post("/interviews", zValidator("json", createInterviewSchema), async (c) => {
    const user = c.get('user');
    const data = c.req.valid("json");

    const newInterview = await db.insert(interviews).values({
      ...data,
      createdBy: user.userId,
      status: 'draft'
    }).returning();

    if (!newInterview || newInterview.length === 0) {
      return c.json({ error: "Failed to create interview" }, 500);
    }

    return c.json({ interview: newInterview[0] });
  })
  .get("/interviews", async (c) => {
    const user = c.get('user');

    const userInterviews = await db.query.interviews.findMany({
      where: eq(interviews.createdBy, user.userId),
      orderBy: [desc(interviews.createdAt)]
    });

    return c.json({ interviews: userInterviews });
  })
  .get("/interviews/:id", async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');

    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        questions: {
          with: {
            question: true
          },
          orderBy: (interviewQuestions, { asc }) => [asc(interviewQuestions.orderIndex)]
        },
        sessions: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
        }
      }
    });

    if (!interview || interview.createdBy !== user.userId) {
      return c.json({ error: "Interview not found" }, 404);
    }

    return c.json({ interview });
  })
  .put("/interviews/:id", zValidator("json", updateInterviewSchema), async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');
    const data = c.req.valid("json");

    const existingInterview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId)
    });

    if (!existingInterview || existingInterview.createdBy !== user.userId) {
      return c.json({ error: "Interview not found" }, 404);
    }

    const updatedInterview = await db.update(interviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(interviews.id, interviewId))
      .returning();

    if (!updatedInterview || updatedInterview.length === 0) {
      return c.json({ error: "Failed to update interview" }, 500);
    }

    return c.json({ interview: updatedInterview[0] });
  })
  .delete("/interviews/:id", async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');

    const existingInterview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId)
    });

    if (!existingInterview || existingInterview.createdBy !== user.userId) {
      return c.json({ error: "Interview not found" }, 404);
    }

    if (existingInterview.status !== 'draft') {
      return c.json({ error: "Can only delete draft interviews" }, 400);
    }

    await db.delete(interviews).where(eq(interviews.id, interviewId));

    return c.json({ message: "Interview deleted successfully" });
  })
  .post("/interviews/:id/publish", async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');

    const existingInterview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        questions: true
      }
    });

    if (!existingInterview || existingInterview.createdBy !== user.userId) {
      return c.json({ error: "Interview not found" }, 404);
    }

    if (existingInterview.questions.length === 0) {
      return c.json({ error: "Cannot publish interview without questions" }, 400);
    }

    const publishedInterview = await db.update(interviews)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(interviews.id, interviewId))
      .returning();

    return c.json({ interview: publishedInterview[0] });
  })
  .post("/interviews/:id/close", async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');

    const existingInterview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId)
    });

    if (!existingInterview || existingInterview.createdBy !== user.userId) {
      return c.json({ error: "Interview not found" }, 404);
    }

    if (existingInterview.status !== 'published') {
      return c.json({ error: "Can only close published interviews" }, 400);
    }

    const closedInterview = await db.update(interviews)
      .set({
        status: 'closed',
        updatedAt: new Date()
      })
      .where(eq(interviews.id, interviewId))
      .returning();

    return c.json({ interview: closedInterview[0] });
  })
  .post("/interviews/:id/clone", async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');

    const sourceInterview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        questions: {
          with: {
            question: true
          }
        }
      }
    });

    if (!sourceInterview || sourceInterview.createdBy !== user.userId) {
      return c.json({ error: "Interview not found" }, 404);
    }

    const clonedInterview = await db.insert(interviews).values({
      title: `${sourceInterview.title} (Copy)`,
      description: sourceInterview.description,
      jobRole: sourceInterview.jobRole,
      isPublic: sourceInterview.isPublic,
      assignedEmails: sourceInterview.assignedEmails,
      deadline: sourceInterview.deadline,
      createdBy: user.userId,
      status: 'draft'
    }).returning();

    if (!clonedInterview || clonedInterview.length === 0) {
      return c.json({ error: "Failed to clone interview" }, 500);
    }

    const newInterview = clonedInterview[0];
    if (!newInterview) {
      return c.json({ error: "Failed to clone interview" }, 500);
    }

    if (sourceInterview.questions.length > 0) {
      const { interviewQuestions } = await import("../db/schema");

      const questionAssignments = sourceInterview.questions.map(q => ({
        interviewId: newInterview.id,
        questionId: q.questionId,
        orderIndex: q.orderIndex,
        points: q.points
      }));

      await db.insert(interviewQuestions).values(questionAssignments);
    }

    return c.json({ interview: newInterview });
  })
  .post("/questions/generate-all", zValidator("json", generateQuestionsSchema), async (c) => {
    const user = c.get('user');
    const { jobRole, technologies, customPrompt } = c.req.valid("json");

    try {
      const generatedQuestions = await generateAllQuestionsPlaceholder(jobRole, technologies, customPrompt);

      const savedQuestions = await db.insert(questions).values(
        generatedQuestions.map(q => ({
          ...q,
          createdBy: user.userId
        }))
      ).returning();

      return c.json({ questions: savedQuestions });
    } catch (error) {
      return c.json({ error: "Failed to generate questions" }, 500);
    }
  })
  .post("/questions/regenerate", zValidator("json", regenerateQuestionSchema), async (c) => {
    const user = c.get('user');
    const { questionId, modificationRequest } = c.req.valid("json");

    try {
      const existingQuestion = await db.query.questions.findFirst({
        where: eq(questions.id, questionId)
      });

      if (!existingQuestion || existingQuestion.createdBy !== user.userId) {
        return c.json({ error: "Question not found" }, 404);
      }

      const regeneratedQuestion = await regenerateQuestionPlaceholder(questionId, modificationRequest);

      const updatedQuestion = await db.update(questions)
        .set({
          ...regeneratedQuestion,
          updatedAt: new Date()
        })
        .where(eq(questions.id, questionId))
        .returning();

      if (!updatedQuestion || updatedQuestion.length === 0) {
        return c.json({ error: "Failed to regenerate question" }, 500);
      }

      return c.json({ question: updatedQuestion[0] });
    } catch (error) {
      return c.json({ error: "Failed to regenerate question" }, 500);
    }
  })
  .get("/questions", async (c) => {
    const user = c.get('user');
    const type = c.req.query('type');
    const difficulty = c.req.query('difficulty');
    const category = c.req.query('category');

    let query = db.query.questions.findMany({
      where: eq(questions.createdBy, user.userId),
      orderBy: [desc(questions.createdAt)]
    });

    const userQuestions = await query;

    let filteredQuestions = userQuestions;

    if (type) {
      filteredQuestions = filteredQuestions.filter(q => q.type === type);
    }
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    if (category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }

    return c.json({ questions: filteredQuestions });
  })
  .post("/questions", zValidator("json", createQuestionSchema), async (c) => {
    const user = c.get('user');
    const data = c.req.valid("json");

    const newQuestion = await db.insert(questions).values({
      ...data,
      createdBy: user.userId
    }).returning();

    if (!newQuestion || newQuestion.length === 0) {
      return c.json({ error: "Failed to create question" }, 500);
    }

    return c.json({ question: newQuestion[0] });
  })
  .put("/questions/:id", zValidator("json", createQuestionSchema.partial()), async (c) => {
    const user = c.get('user');
    const questionId = c.req.param('id');
    const data = c.req.valid("json");

    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, questionId)
    });

    if (!existingQuestion || existingQuestion.createdBy !== user.userId) {
      return c.json({ error: "Question not found" }, 404);
    }

    const updatedQuestion = await db.update(questions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(questions.id, questionId))
      .returning();

    if (!updatedQuestion || updatedQuestion.length === 0) {
      return c.json({ error: "Failed to update question" }, 500);
    }

    return c.json({ question: updatedQuestion[0] });
  })
  .delete("/questions/:id", async (c) => {
    const user = c.get('user');
    const questionId = c.req.param('id');

    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, questionId)
    });

    if (!existingQuestion || existingQuestion.createdBy !== user.userId) {
      return c.json({ error: "Question not found" }, 404);
    }

    await db.delete(questions).where(eq(questions.id, questionId));

    return c.json({ message: "Question deleted successfully" });
  })
  .post("/interviews/:id/questions", zValidator("json", assignQuestionsSchema), async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');
    const { questions: questionAssignments } = c.req.valid("json");

    const existingInterview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId)
    });

    if (!existingInterview || existingInterview.createdBy !== user.userId) {
      return c.json({ error: "Interview not found" }, 404);
    }

    await db.delete(interviewQuestions).where(eq(interviewQuestions.interviewId, interviewId));

    const assignments = questionAssignments.map(q => ({
      interviewId,
      questionId: q.questionId,
      orderIndex: q.orderIndex,
      points: q.points
    }));

    await db.insert(interviewQuestions).values(assignments);

    return c.json({ message: "Questions assigned successfully" });
  });