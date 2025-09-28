import { Hono } from "hono";
import { eq, and, or, sql } from "drizzle-orm";
import { requireCandidate } from "../middleware/candidate-auth";
import { db } from "../db/db";
import { interviews, interviewSessions, resumes, answers } from "../db/schema";
import { uploadFile, generateResumeKey, isValidResumeType } from "../utils/r2";
import { extractResumeData, processChatbotMessage } from "../utils/ai-integration";
import { evaluationQueue } from "../utils/evaluation-queue";

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
  })
  .get("/interviews/:id/details", async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');

    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        questions: {
          with: {
            question: {
              columns: {
                id: true,
                type: true,
                difficulty: true,
                timeLimit: true,
                points: true
              }
            }
          },
          orderBy: (interviewQuestions, { asc }) => [asc(interviewQuestions.orderIndex)]
        }
      },
      columns: {
        id: true,
        title: true,
        description: true,
        jobRole: true,
        deadline: true,
        isPublic: true,
        status: true,
        assignedEmails: true,
        createdAt: true
      }
    });

    if (!interview) {
      return c.json({ error: "Interview not found" }, 404);
    }

    if (interview.status !== 'published') {
      return c.json({ error: "Interview is not published" }, 403);
    }

    const canAccess = interview.isPublic ||
      (interview.assignedEmails && interview.assignedEmails.includes(user.email));

    if (!canAccess) {
      return c.json({ error: "You don't have access to this interview" }, 403);
    }

    const deadlinePassed = interview.deadline && new Date() > new Date(interview.deadline);

    const questionsSummary = interview.questions.map(iq => ({
      type: iq.question.type,
      difficulty: iq.question.difficulty,
      timeLimit: iq.question.timeLimit,
      points: iq.points
    }));

    const totalTime = questionsSummary.reduce((sum, q) => sum + q.timeLimit, 0);
    const totalPoints = questionsSummary.reduce((sum, q) => sum + q.points, 0);

    return c.json({
      interview: {
        id: interview.id,
        title: interview.title,
        description: interview.description,
        jobRole: interview.jobRole,
        deadline: interview.deadline,
        totalQuestions: interview.questions.length,
        totalTime,
        totalPoints,
        questionsSummary
      },
      canAccess: true,
      deadlinePassed,
      accessType: interview.isPublic ? 'public' : 'assigned'
    });
  })
  .get("/interviews/:id/resume-check", async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');

    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      columns: {
        id: true,
        title: true,
        status: true,
        isPublic: true,
        assignedEmails: true,
        deadline: true
      }
    });

    if (!interview) {
      return c.json({ error: "Interview not found" }, 404);
    }

    if (interview.status !== 'published') {
      return c.json({ error: "Interview is not published" }, 403);
    }

    const canAccess = interview.isPublic ||
      (interview.assignedEmails && interview.assignedEmails.includes(user.email));

    if (!canAccess) {
      return c.json({ error: "You don't have access to this interview" }, 403);
    }

    const deadlinePassed = interview.deadline && new Date() > new Date(interview.deadline);

    if (deadlinePassed) {
      return c.json({ error: "Interview deadline has passed" }, 403);
    }

    const existingSession = await db.query.interviewSessions.findFirst({
      where: and(
        eq(interviewSessions.userId, user.userId),
        eq(interviewSessions.interviewId, interviewId)
      )
    });

    if (existingSession && existingSession.status === 'completed') {
      return c.json({
        error: "You have already completed this interview",
        sessionStatus: 'completed'
      }, 403);
    }

    if (existingSession && existingSession.status === 'in_progress') {
      return c.json({
        message: "You have an active session for this interview",
        sessionStatus: 'in_progress',
        sessionId: existingSession.id,
        canResume: true
      });
    }

    const userResumes = await db.query.resumes.findMany({
      where: and(
        eq(resumes.userId, user.userId),
        eq(resumes.verificationMethod, 'ai_only')
      ),
      columns: {
        id: true,
        fileName: true,
        extractedName: true,
        extractedEmail: true,
        extractedPhone: true,
        uploadedAt: true,
        verifiedAt: true
      },
      orderBy: (resumes, { desc }) => [desc(resumes.verifiedAt)]
    });

    const incompletResumes = await db.query.resumes.findMany({
      where: and(
        eq(resumes.userId, user.userId),
        eq(resumes.verificationMethod, 'ai_plus_manual')
      ),
      columns: {
        id: true,
        fileName: true,
        missingFields: true
      }
    });

    return c.json({
      interview: {
        id: interview.id,
        title: interview.title
      },
      canStart: true,
      verifiedResumes: userResumes,
      incompleteResumes: incompletResumes,
      requiresUpload: userResumes.length === 0 && incompletResumes.length === 0
    });
  })
  .post("/interviews/:id/start", async (c) => {
    const user = c.get('user');
    const interviewId = c.req.param('id');

    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    const { resumeId } = body;

    if (!resumeId) {
      return c.json({ error: "Resume ID is required" }, 400);
    }

    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
      with: {
        questions: {
          with: {
            question: true
          },
          orderBy: (interviewQuestions, { asc }) => [asc(interviewQuestions.orderIndex)]
        }
      }
    });

    if (!interview) {
      return c.json({ error: "Interview not found" }, 404);
    }

    if (interview.status !== 'published') {
      return c.json({ error: "Interview is not published" }, 403);
    }

    const canAccess = interview.isPublic ||
      (interview.assignedEmails && interview.assignedEmails.includes(user.email));

    if (!canAccess) {
      return c.json({ error: "You don't have access to this interview" }, 403);
    }

    const deadlinePassed = interview.deadline && new Date() > new Date(interview.deadline);
    if (deadlinePassed) {
      return c.json({ error: "Interview deadline has passed" }, 403);
    }

    const resume = await db.query.resumes.findFirst({
      where: and(
        eq(resumes.id, resumeId),
        eq(resumes.userId, user.userId)
      )
    });

    if (!resume) {
      return c.json({ error: "Resume not found or not owned by user" }, 404);
    }

    if (resume.missingFields && resume.missingFields.length > 0) {
      return c.json({
        error: "Resume verification is incomplete",
        missingFields: resume.missingFields
      }, 400);
    }

    const existingSession = await db.query.interviewSessions.findFirst({
      where: and(
        eq(interviewSessions.userId, user.userId),
        eq(interviewSessions.interviewId, interviewId)
      )
    });

    if (existingSession && existingSession.status === 'completed') {
      return c.json({
        error: "You have already completed this interview"
      }, 403);
    }

    if (existingSession && existingSession.status === 'in_progress') {
      if (existingSession.lockedUntil && existingSession.lockedUntil > new Date()) {
        return c.json({
          error: "Interview is already in progress elsewhere",
          sessionId: existingSession.id
        }, 409);
      }
    }

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const lockedUntil = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
    const startedAt = new Date();

    const questionsData = interview.questions.map((iq, index) => ({
      questionIndex: index,
      question: {
        id: iq.question.id,
        type: iq.question.type,
        difficulty: iq.question.difficulty,
        questionText: iq.question.questionText,
        options: iq.question.options,
        starterCode: iq.question.starterCode,
        timeLimit: iq.question.timeLimit
      },
      points: iq.points
    }));

    if (existingSession && existingSession.status === 'in_progress') {
      await db.update(interviewSessions)
        .set({
          sessionToken,
          lockedUntil,
          startedAt: startedAt
        })
        .where(eq(interviewSessions.id, existingSession.id));

      return c.json({
        sessionId: existingSession.id,
        sessionToken,
        startedAt: startedAt.toISOString(),
        currentQuestionIndex: existingSession.currentQuestionIndex || 0,
        questions: questionsData,
        serverTime: new Date().toISOString(),
        resumedSession: true
      });
    }

    const newSessions = await db.insert(interviewSessions).values({
      interviewId,
      userId: user.userId,
      resumeId,
      sessionToken,
      lockedUntil,
      startedAt,
      currentQuestionIndex: 0,
      status: 'in_progress'
    }).returning();

    const newSession = newSessions[0];

    if (!newSession) {
      return c.json({ error: "Failed to create interview session" }, 500);
    }

    return c.json({
      sessionId: newSession.id,
      sessionToken,
      startedAt: startedAt.toISOString(),
      currentQuestionIndex: 0,
      questions: questionsData,
      serverTime: new Date().toISOString(),
      resumedSession: false
    });
  })
  .get("/interviews/active", async (c) => {
    const user = c.get('user');

    const activeSession = await db.query.interviewSessions.findFirst({
      where: and(
        eq(interviewSessions.userId, user.userId),
        eq(interviewSessions.status, 'in_progress')
      ),
      with: {
        interview: {
          columns: {
            id: true,
            title: true,
            jobRole: true
          },
          with: {
            questions: {
              with: {
                question: true
              },
              orderBy: (interviewQuestions, { asc }) => [asc(interviewQuestions.orderIndex)]
            }
          }
        },
        answers: {
          columns: {
            id: true,
            questionId: true,
            answerText: true,
            submittedAt: true
          },
          orderBy: (answers, { asc }) => [asc(answers.submittedAt)]
        }
      }
    });

    if (!activeSession) {
      return c.json({ activeSession: null });
    }

    if (activeSession.lockedUntil && activeSession.lockedUntil < new Date()) {
      return c.json({
        activeSession: {
          id: activeSession.id,
          interview: activeSession.interview,
          status: 'expired',
          message: "Session has expired due to inactivity"
        }
      });
    }

    const questionsData = activeSession.interview?.questions.map((iq, index) => ({
      questionIndex: index,
      question: {
        id: iq.question.id,
        type: iq.question.type,
        difficulty: iq.question.difficulty,
        questionText: iq.question.questionText,
        options: iq.question.options,
        starterCode: iq.question.starterCode,
        timeLimit: iq.question.timeLimit
      },
      points: iq.points
    })) || [];

    const currentTime = new Date();
    const startedAt = new Date(activeSession.startedAt || currentTime);
    const totalElapsed = Math.floor((currentTime.getTime() - startedAt.getTime()) / 1000);

    let elapsedForCurrentQuestion = totalElapsed;
    const currentQuestionIndex = activeSession.currentQuestionIndex || 0;

    for (let i = 0; i < currentQuestionIndex && i < questionsData.length; i++) {
      const questionData = questionsData[i];
      if (questionData) {
        elapsedForCurrentQuestion -= questionData.question.timeLimit;
      }
    }

    const currentQuestion = questionsData[currentQuestionIndex];
    const timeRemaining = currentQuestion
      ? Math.max(0, currentQuestion.question.timeLimit - elapsedForCurrentQuestion)
      : 0;

    return c.json({
      activeSession: {
        id: activeSession.id,
        interview: activeSession.interview,
        sessionToken: activeSession.sessionToken,
        startedAt: activeSession.startedAt,
        currentQuestionIndex,
        totalQuestions: questionsData.length,
        questions: questionsData,
        answers: activeSession.answers,
        timeRemaining,
        totalElapsed,
        serverTime: currentTime.toISOString(),
        canResume: timeRemaining > 0
      }
    });
  })
  .post("/interviews/:sessionId/answers", async (c) => {
    const user = c.get('user');
    const sessionId = c.req.param('sessionId');

    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    const { session_token, question_index, answer } = body;

    if (!session_token || question_index === undefined || !answer) {
      return c.json({
        error: "Missing required fields: session_token, question_index, answer"
      }, 400);
    }

    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, sessionId),
      with: {
        interview: {
          with: {
            questions: {
              with: {
                question: true
              },
              orderBy: (interviewQuestions, { asc }) => [asc(interviewQuestions.orderIndex)]
            }
          }
        }
      }
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    if (session.userId !== user.userId) {
      return c.json({ error: "Session does not belong to user" }, 403);
    }

    if (session.sessionToken !== session_token) {
      return c.json({ error: "Invalid session token" }, 401);
    }

    if (session.status !== 'in_progress') {
      return c.json({ error: "Session is not in progress" }, 409);
    }

    if (session.lockedUntil && session.lockedUntil < new Date()) {
      return c.json({ error: "Session has expired" }, 409);
    }

    if (question_index !== session.currentQuestionIndex) {
      return c.json({
        error: "Invalid question index",
        expected: session.currentQuestionIndex,
        received: question_index
      }, 400);
    }

    const serverNow = new Date();
    const startedAt = new Date(session.startedAt || serverNow);
    const totalElapsed = (serverNow.getTime() - startedAt.getTime()) / 1000;

    const questions = session.interview?.questions || [];

    let expectedMinTime = 0;
    for (let i = 0; i < question_index; i++) {
      const questionData = questions[i];
      if (questionData) {
        expectedMinTime += questionData.question.timeLimit;
      }
    }

    if (totalElapsed < expectedMinTime - 5) {
      return c.json({
        error: "Invalid submission time - too fast",
        details: {
          totalElapsed: Math.floor(totalElapsed),
          expectedMinTime,
          difference: Math.floor(totalElapsed - expectedMinTime)
        }
      }, 400);
    }

    const currentQuestion = questions[question_index];
    if (!currentQuestion) {
      return c.json({ error: "Question not found" }, 404);
    }

    const timeForCurrentQ = totalElapsed - expectedMinTime;
    const timeLimit = currentQuestion.question.timeLimit;

    if (timeForCurrentQ > timeLimit + 2) {
      return c.json({
        error: "Time limit exceeded",
        details: {
          timeForCurrentQuestion: Math.floor(timeForCurrentQ),
          timeLimit,
          exceeded: Math.floor(timeForCurrentQ - timeLimit)
        }
      }, 400);
    }

    await db.insert(answers).values({
      sessionId: session.id,
      questionId: currentQuestion.question.id,
      answerText: answer,
      timeTaken: Math.floor(timeForCurrentQ),
      submittedAt: serverNow,
      evaluated: false
    });

    await evaluationQueue.addJob({
      sessionId: session.id,
      questionId: currentQuestion.question.id,
      answerText: answer,
      questionType: currentQuestion.question.type,
      questionData: currentQuestion.question
    });

    const nextQuestionIndex = question_index + 1;
    const isComplete = nextQuestionIndex >= questions.length;

    await db.update(interviewSessions)
      .set({
        currentQuestionIndex: nextQuestionIndex,
        status: isComplete ? 'completed' : 'in_progress',
        completedAt: isComplete ? serverNow : null
      })
      .where(eq(interviewSessions.id, session.id));

    if (isComplete) {
      return c.json({
        success: true,
        completed: true,
        message: "Interview completed! Results will be available soon.",
        finalStats: {
          totalQuestions: questions.length,
          totalTime: Math.floor(totalElapsed),
          completedAt: serverNow.toISOString()
        }
      });
    }

    const nextQuestion = questions[nextQuestionIndex];
    if (!nextQuestion) {
      return c.json({ error: "Next question not found" }, 500);
    }

    return c.json({
      success: true,
      completed: false,
      nextQuestionIndex,
      nextQuestion: {
        questionIndex: nextQuestionIndex,
        question: {
          id: nextQuestion.question.id,
          type: nextQuestion.question.type,
          difficulty: nextQuestion.question.difficulty,
          questionText: nextQuestion.question.questionText,
          options: nextQuestion.question.options,
          starterCode: nextQuestion.question.starterCode,
          timeLimit: nextQuestion.question.timeLimit
        },
        points: nextQuestion.points
      },
      timeLimit: nextQuestion.question.timeLimit,
      serverTime: serverNow.toISOString()
    });
  })
  .post("/test-evaluation/:sessionId", async (c) => {
    const sessionId = c.req.param('sessionId');

    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, sessionId),
      with: {
        answers: {
          with: {
            question: true
          }
        }
      }
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    let evaluationJobs = 0;
    for (const answer of session.answers) {
      if (!answer.evaluated) {
        await evaluationQueue.addJob({
          sessionId: session.id,
          questionId: answer.questionId,
          answerText: answer.answerText,
          questionType: answer.question.type,
          questionData: answer.question
        });
        evaluationJobs++;
      }
    }

    return c.json({
      message: `Queued ${evaluationJobs} evaluation jobs for session ${sessionId}`,
      queueStatus: evaluationQueue.getQueueStatus()
    });
  })
  .get("/evaluation-status/:sessionId", async (c) => {
    const sessionId = c.req.param('sessionId');

    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, sessionId),
      with: {
        answers: {
          with: {
            question: {
              columns: {
                id: true,
                type: true,
                questionText: true,
                points: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const evaluationStatus = session.answers.map(answer => ({
      questionId: answer.questionId,
      questionType: answer.question?.type,
      questionText: answer.question?.questionText?.substring(0, 100) + "...",
      answerText: answer.answerText.substring(0, 100) + "...",
      evaluated: answer.evaluated,
      score: answer.score,
      maxPoints: answer.question?.points,
      evaluatedAt: answer.evaluatedAt
    }));

    const totalEvaluated = session.answers.filter(a => a.evaluated).length;
    const totalAnswers = session.answers.length;

    return c.json({
      sessionId,
      sessionStatus: session.status,
      evaluationProgress: `${totalEvaluated}/${totalAnswers}`,
      finalScore: session.finalScore,
      maxScore: session.maxScore,
      percentage: session.percentage,
      aiSummary: session.aiSummary,
      evaluatedAt: session.evaluatedAt,
      answers: evaluationStatus,
      queueStatus: evaluationQueue.getQueueStatus()
    });
  });

export { candidateRoute };