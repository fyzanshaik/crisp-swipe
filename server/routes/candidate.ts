import { Hono } from "hono";
import { eq, and, or, sql } from "drizzle-orm";
import { requireCandidate } from "../middleware/candidate-auth";
import { db } from "../db/db";
import { interviews, interviewSessions, resumes } from "../db/schema";
import { uploadFile, generateResumeKey, isValidResumeType } from "../utils/r2";
import { extractResumeData, processChatbotMessage } from "../utils/ai-integration";
import { z } from "zod";

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
  })
  .get("/resumes", async (c) => {
    const user = c.get('user');

    const userResumes = await db.query.resumes.findMany({
      where: eq(resumes.userId, user.userId),
      columns: {
        id: true,
        fileName: true,
        fileType: true,
        extractedName: true,
        extractedEmail: true,
        extractedPhone: true,
        uploadedAt: true,
        verifiedAt: true
      },
      orderBy: (resumes, { desc }) => [desc(resumes.uploadedAt)]
    });

    return c.json({ resumes: userResumes });
  })
  .post("/resumes/upload", async (c) => {
    const user = c.get('user');
    const body = await c.req.parseBody();
    const file = body.file as File;

    if (!file) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    if (!isValidResumeType(file.type)) {
      return c.json({
        error: "Invalid file type. Only PDF and DOCX files are allowed"
      }, 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return c.json({
        error: "File too large. Maximum size is 5MB"
      }, 400);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bucketKey = generateResumeKey(user.userId, file.name);

      await uploadFile(bucketKey, arrayBuffer, file.type);

      const fileType = file.type === 'application/pdf' ? 'pdf' : 'docx';

      const extractedData = await extractResumeData(arrayBuffer, file.type);

      const hasAllFields = extractedData.missing_fields.length === 0 &&
                          extractedData.confidence.name > 0.8 &&
                          extractedData.confidence.email > 0.8 &&
                          extractedData.confidence.phone > 0.8;

      const verificationMethod = hasAllFields ? 'ai_only' : 'ai_plus_manual';
      const missingFields = extractedData.missing_fields;

      const newResume = await db.insert(resumes).values({
        userId: user.userId,
        bucketKey,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        extractedName: extractedData.name || "Not found",
        extractedEmail: extractedData.email || "Not found",
        extractedPhone: extractedData.phone || "Not found",
        verificationMethod,
        missingFields
      }).returning();

      if (hasAllFields) {
        return c.json({
          resume: newResume[0],
          status: 'verified',
          message: 'Resume uploaded and verified successfully!'
        });
      } else {
        return c.json({
          resume: newResume[0],
          status: 'needs_completion',
          message: 'Resume uploaded. Some information needs verification.',
          missingFields,
          extractedData
        });
      }

    } catch (error) {
      console.error('Resume upload error:', error);
      return c.json({ error: "Failed to upload resume" }, 500);
    }
  })
  .post("/resumes/:id/chat", async (c) => {
    const user = c.get('user');
    const resumeId = c.req.param('id');
    const body = await c.req.json();

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Messages array is required" }, 400);
    }

    const resume = await db.query.resumes.findFirst({
      where: and(
        eq(resumes.id, resumeId),
        eq(resumes.userId, user.userId)
      )
    });

    if (!resume) {
      return c.json({ error: "Resume not found" }, 404);
    }

    if (!resume.missingFields || resume.missingFields.length === 0) {
      return c.json({
        message: "Resume is already complete!",
        is_complete: true
      });
    }

    try {
      const currentData = {
        name: resume.extractedName,
        email: resume.extractedEmail === "Not found" ? "" : resume.extractedEmail,
        phone: resume.extractedPhone === "Not found" ? "" : resume.extractedPhone
      };

      const response = await processChatbotMessage(
        messages,
        resume.missingFields,
        currentData
      );

      if (response.is_complete) {
        const updatedEmail = response.extracted_data.email || currentData.email;
        const updatedPhone = response.extracted_data.phone || currentData.phone;

        await db.update(resumes)
          .set({
            extractedEmail: updatedEmail,
            extractedPhone: updatedPhone,
            missingFields: [],
            verificationMethod: 'ai_plus_manual',
            verifiedAt: new Date()
          })
          .where(eq(resumes.id, resumeId));

        return c.json({
          message: response.message,
          is_complete: true,
          resume_updated: true
        });
      }

      return c.json({
        message: response.message,
        is_complete: false,
        next_field_needed: response.next_field_needed,
        extracted_data: response.extracted_data,
        validation: response.validation
      });

    } catch (error) {
      console.error('Chatbot error:', error);
      return c.json({ error: "Failed to process message" }, 500);
    }
  });

export { candidateRoute };