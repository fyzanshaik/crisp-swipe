import { 
  boolean, 
  decimal, 
  integer, 
  jsonb, 
  pgTable, 
  text, 
  timestamp, 
  unique,
  uuid, 
  varchar 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  role: varchar('role', { length: 20 }).notNull().$type<'candidate' | 'recruiter'>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  bucketKey: varchar('bucket_key', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull().$type<'pdf' | 'docx'>(),
  fileSize: integer('file_size').notNull(),
  contentHash: varchar('content_hash', { length: 64 }),

  extractedName: varchar('extracted_name', { length: 255 }).notNull(),
  extractedEmail: varchar('extracted_email', { length: 255 }).notNull(),
  extractedPhone: varchar('extracted_phone', { length: 20 }).notNull(),

  verificationMethod: varchar('verification_method', { length: 50 }).notNull().$type<'ai_only' | 'ai_plus_manual' | 'manual_only'>(),
  missingFields: jsonb('missing_fields').$type<string[]>(),
  retryCount: integer('retry_count').default(0),

  uploadedAt: timestamp('uploaded_at').defaultNow(),
  verifiedAt: timestamp('verified_at').defaultNow()
});

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull().$type<'mcq' | 'short_answer' | 'code'>(),
  difficulty: varchar('difficulty', { length: 50 }).notNull().$type<'easy' | 'medium' | 'hard'>(),
  category: varchar('category', { length: 100 }),
  questionText: text('question_text').notNull(),

  options: jsonb('options').$type<string[]>(),
  correctAnswer: text('correct_answer'),

  expectedKeywords: jsonb('expected_keywords').$type<string[]>(),
  minWords: integer('min_words'),
  maxWords: integer('max_words'),

  language: varchar('language', { length: 50 }),
  starterCode: text('starter_code'),
  sampleSolution: text('sample_solution'),
  evaluationCriteria: jsonb('evaluation_criteria').$type<string[]>(),
  
  timeLimit: integer('time_limit').notNull(),
  points: integer('points').notNull(),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const interviews = pgTable('interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  jobRole: varchar('job_role', { length: 100 }).notNull(),
  
  isPublic: boolean('is_public').default(false),
  assignedEmails: jsonb('assigned_emails').$type<string[]>(),
  
  deadline: timestamp('deadline'),
  status: varchar('status', { length: 50 }).default('draft').$type<'draft' | 'published' | 'closed'>(),
  
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  publishedAt: timestamp('published_at')
});

export const interviewQuestions = pgTable('interview_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  interviewId: uuid('interview_id').notNull().references(() => interviews.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  points: integer('points').notNull()
}, (table) => ({
  uniqueInterviewQuestion: unique().on(table.interviewId, table.questionId),
  uniqueInterviewOrder: unique().on(table.interviewId, table.orderIndex)
}));

export const interviewSessions = pgTable('interview_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  interviewId: uuid('interview_id').notNull().references(() => interviews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resumeId: uuid('resume_id').notNull().references(() => resumes.id),
  
  currentQuestionIndex: integer('current_question_index').default(0),
  status: varchar('status', { length: 50 }).default('not_started').$type<'not_started' | 'in_progress' | 'completed' | 'abandoned'>(),
  
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  lockedUntil: timestamp('locked_until'),
  
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  finalScore: integer('final_score'),
  maxScore: integer('max_score'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  aiSummary: text('ai_summary'),
  evaluatedAt: timestamp('evaluated_at'),
  recruiterNotes: text('recruiter_notes'),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniqueUserInterview: unique().on(table.userId, table.interviewId)
}));

export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  
  answerText: text('answer_text').notNull(),
  
  score: integer('score'),
  feedback: jsonb('feedback').$type<{
    total_score?: number;
    keyword_score?: number;
    semantic_score?: number;
    criteria_scores?: Record<string, number>;
    strengths?: string[];
    improvements?: string[];
    overall_feedback?: string;
  }>(),
  evaluated: boolean('evaluated').default(false),
  evaluatedAt: timestamp('evaluated_at'),
  aiModelUsed: varchar('ai_model_used', { length: 50 }),
  
  timeTaken: integer('time_taken'),
  submittedAt: timestamp('submitted_at').defaultNow()
}, (table) => ({
  uniqueSessionQuestion: unique().on(table.sessionId, table.questionId)
}));

export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  createdInterviews: many(interviews),
  sessions: many(interviewSessions),
  createdQuestions: many(questions)
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id]
  })
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  creator: one(users, {
    fields: [interviews.createdBy],
    references: [users.id]
  }),
  questions: many(interviewQuestions),
  sessions: many(interviewSessions)
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  creator: one(users, {
    fields: [questions.createdBy],
    references: [users.id]
  }),
  interviewQuestions: many(interviewQuestions),
  answers: many(answers)
}));

export const interviewQuestionsRelations = relations(interviewQuestions, ({ one }) => ({
  interview: one(interviews, {
    fields: [interviewQuestions.interviewId],
    references: [interviews.id]
  }),
  question: one(questions, {
    fields: [interviewQuestions.questionId],
    references: [questions.id]
  })
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  interview: one(interviews, {
    fields: [interviewSessions.interviewId],
    references: [interviews.id]
  }),
  user: one(users, {
    fields: [interviewSessions.userId],
    references: [users.id]
  }),
  resume: one(resumes, {
    fields: [interviewSessions.resumeId],
    references: [resumes.id]
  }),
  answers: many(answers)
}));

export const answersRelations = relations(answers, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [answers.sessionId],
    references: [interviewSessions.id]
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id]
  })
}));
