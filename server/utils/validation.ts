import { z } from "zod";

export const createInterviewSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  jobRole: z.string().min(1).max(100),
  isPublic: z.boolean().default(false),
  assignedEmails: z.array(z.string().email()).optional(),
  deadline: z.string().datetime().optional()
});

export const updateInterviewSchema = createInterviewSchema.partial();

export const createQuestionSchema = z.object({
  type: z.enum(["mcq", "short_answer", "code"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().max(100).optional(),
  questionText: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  expectedKeywords: z.array(z.string()).optional(),
  minWords: z.number().optional(),
  maxWords: z.number().optional(),
  language: z.string().max(50).optional(),
  starterCode: z.string().optional(),
  sampleSolution: z.string().optional(),
  evaluationCriteria: z.array(z.string()).optional(),
  timeLimit: z.number().min(1),
  points: z.number().min(1)
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const generateQuestionsSchema = z.object({
  jobRole: z.string().min(1),
  technologies: z.array(z.string()).min(1),
  customPrompt: z.string().optional()
});

export const regenerateQuestionSchema = z.object({
  questionId: z.string().uuid(),
  modificationRequest: z.string().min(1)
});

export const updateNotesSchema = z.object({
  recruiterNotes: z.string().optional()
});

export const assignQuestionsSchema = z.object({
  questions: z.array(z.object({
    questionId: z.string().uuid(),
    orderIndex: z.number().min(0).max(5),
    points: z.number().min(1)
  })).min(6).max(6)
});