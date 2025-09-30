import { z } from "zod";

export const createInterviewSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  jobRole: z.string().min(1).max(100),
  isPublic: z.boolean().default(false),
  assignedEmails: z.array(z.string().email()).optional(),
  deadline: z.iso.datetime({ offset: true }).transform(str => new Date(str)).optional()
});

export const updateInterviewSchema = createInterviewSchema.partial();

export const createQuestionSchema = z.object({
  type: z.enum(["mcq", "short_answer", "code"]).describe("Type of question: 'mcq' for multiple choice with 4 options, 'short_answer' for text responses, 'code' for programming challenges"),
  difficulty: z.enum(["easy", "medium", "hard"]).describe("Question difficulty level: 'easy' for basic concepts, 'medium' for intermediate understanding, 'hard' for advanced problem-solving"),
  category: z.string().max(100).optional().describe("Technology or topic category (e.g., 'React', 'JavaScript', 'Node.js', 'Database', 'Algorithm')"),
  questionText: z.string().min(1).describe("The main question text that candidates will see. Should be clear, specific, and technically accurate"),

  options: z.array(z.string()).optional().describe("For MCQ only: Array of exactly 4 answer choices. Make them plausible but only one correct"),
  correctAnswer: z.string().optional().describe("For MCQ only: The exact correct answer that matches one of the options"),

  expectedKeywords: z.array(z.string()).optional().describe("For short_answer only: 5 key technical terms or concepts the answer should contain for scoring"),
  minWords: z.number().optional().describe("For short_answer only: Minimum word count (typically 30)"),
  maxWords: z.number().optional().describe("For short_answer only: Maximum word count (typically 150)"),

  language: z.string().max(50).optional().describe("For code only: Programming language (e.g., 'javascript', 'python', 'java')"),
  starterCode: z.string().optional().describe("For code only: Template code with function signature and comments to help candidates start"),
  sampleSolution: z.string().optional().describe("For code only: Complete working solution that demonstrates the expected approach"),
  evaluationCriteria: z.array(z.string()).optional().describe("For code only: 4 specific criteria for evaluation (e.g., 'Correct algorithm implementation', 'Handles edge cases')"),

  timeLimit: z.number().min(1).describe("Time limit in seconds: 60 for easy MCQ, 120 for medium short_answer, 180 for hard code"),
  points: z.number().min(1).describe("Points awarded: 10 for easy questions, 20 for medium, 30 for hard")
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const generateQuestionsSchema = z.object({
  jobRole: z.string().min(1).describe("The job position title (e.g., 'Full Stack Developer', 'Frontend Engineer', 'Backend Developer')"),
  technologies: z.array(z.string()).min(1).describe("Array of relevant technologies and frameworks (e.g., ['React', 'Node.js', 'TypeScript', 'PostgreSQL'])"),
  customPrompt: z.string().optional().describe("Optional additional requirements or specific focus areas for the questions")
});

export const regenerateQuestionSchema = z.object({
  questionId: z.uuid().describe("Unique identifier of the question to regenerate"),
  modificationRequest: z.string().min(1).describe("Specific instructions for how to modify the question (e.g., 'Make it focus on TypeScript instead of JavaScript', 'Add more emphasis on performance')")
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

export const chatbotResponseSchema = z.object({
  message: z.string().describe("Friendly message to user"),
  extracted_data: z.object({
    email: z.string().describe("Email from user message or empty"),
    phone: z.string().describe("Phone from user message or empty")
  }),
  validation: z.object({
    email_valid: z.boolean(),
    phone_valid: z.boolean()
  }),
  is_complete: z.boolean().describe("True if all required fields collected"),
  next_field_needed: z.enum(["email", "phone", "none"])
});