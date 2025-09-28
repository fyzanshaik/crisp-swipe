# Database Schema Design

## Entity Relationship Diagram

```
users
├── candidates (1:N) ──────┐
│                          │
└── recruiters (1:N)       │
         │                 │
         │                 │
         ↓                 ↓
    interviews         interview_sessions
         │                 │
         ↓                 ↓
    interview_questions   answers
         │
         ↓
    questions
```

---

## Tables

### 1. users
**Base table for all users (candidates & recruiters)**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'recruiter')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Drizzle Schema:**
```typescript
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
```

---

### 2. resumes
**Stores candidate resume data (only verified resumes saved to database)**

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Cloudflare R2 Storage
  bucket_key VARCHAR(500) NOT NULL, -- 'resumes/user-123/1727431200-resume.pdf'
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('pdf', 'docx')),
  file_size INTEGER NOT NULL, -- bytes
  
  -- AI Validation Results (required for verified resumes)
  extracted_name VARCHAR(255) NOT NULL,
  extracted_email VARCHAR(255) NOT NULL,
  extracted_phone VARCHAR(20) NOT NULL,
  
  -- Verification Metadata
  verification_method VARCHAR(50) NOT NULL CHECK (verification_method IN ('ai_only', 'ai_plus_manual', 'manual_only')),
  missing_fields JSONB, -- Fields that needed manual input: ["phone", "email"]
  retry_count INTEGER DEFAULT 0, -- How many chatbot attempts were needed
  
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_verified_at ON resumes(verified_at);
```

**Drizzle Schema:**
```typescript
export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // R2 Storage
  bucketKey: varchar('bucket_key', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull().$type<'pdf' | 'docx'>(),
  fileSize: integer('file_size').notNull(),
  
  // Verified extraction data (guaranteed to exist)
  extractedName: varchar('extracted_name', { length: 255 }).notNull(),
  extractedEmail: varchar('extracted_email', { length: 255 }).notNull(),
  extractedPhone: varchar('extracted_phone', { length: 20 }).notNull(),
  
  // Verification metadata
  verificationMethod: varchar('verification_method', { length: 50 }).notNull().$type<'ai_only' | 'ai_plus_manual' | 'manual_only'>(),
  missingFields: jsonb('missing_fields').$type<string[]>(),
  retryCount: integer('retry_count').default(0),
  
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  verifiedAt: timestamp('verified_at').defaultNow()
});
```

---

### 3. questions
**Question bank - reusable questions**

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('mcq', 'short_answer', 'code')),
  difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category VARCHAR(100), -- 'React', 'Node.js', 'JavaScript', etc.
  question_text TEXT NOT NULL,

  -- MCQ specific
  options JSONB, -- ["option1", "option2", "option3", "option4"]
  correct_answer TEXT,

  -- Short answer specific
  expected_keywords JSONB, -- ["keyword1", "keyword2", ...]
  min_words INTEGER,
  max_words INTEGER,

  -- Code specific
  language VARCHAR(50), -- 'javascript', 'python', etc.
  starter_code TEXT,
  sample_solution TEXT,
  evaluation_criteria JSONB, -- ["criteria1", "criteria2", ...]

  -- Common
  time_limit INTEGER NOT NULL, -- seconds
  points INTEGER NOT NULL,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_created_by ON questions(created_by);
```

**Drizzle Schema:**
```typescript
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull().$type<'mcq' | 'short_answer' | 'code'>(),
  difficulty: varchar('difficulty', { length: 50 }).notNull().$type<'easy' | 'medium' | 'hard'>(),
  category: varchar('category', { length: 100 }),
  questionText: text('question_text').notNull(),

  // MCQ
  options: jsonb('options').$type<string[]>(),
  correctAnswer: text('correct_answer'),

  // Short answer
  expectedKeywords: jsonb('expected_keywords').$type<string[]>(),
  minWords: integer('min_words'),
  maxWords: integer('max_words'),

  // Code
  language: varchar('language', { length: 50 }),
  starterCode: text('starter_code'),
  sampleSolution: text('sample_solution'),
  evaluationCriteria: jsonb('evaluation_criteria').$type<string[]>(),
  
  // Common
  timeLimit: integer('time_limit').notNull(),
  points: integer('points').notNull(),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

---

### 4. interviews
**Interviews created by recruiters**

```sql
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  job_role VARCHAR(100) NOT NULL, -- 'Full Stack Developer', etc.
  
  -- Publishing mode
  is_public BOOLEAN DEFAULT false,
  assigned_emails JSONB, -- ["email1@example.com", "email2@example.com"]
  
  -- Timing
  deadline TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_interviews_created_by ON interviews(created_by);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_is_public ON interviews(is_public);
```

**Drizzle Schema:**
```typescript
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
```

---

### 5. interview_questions
**Junction table linking interviews to questions**

```sql
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL, -- 0, 1, 2, 3, 4, 5
  points INTEGER NOT NULL, -- Can override question's default points
  
  CONSTRAINT fk_interview FOREIGN KEY (interview_id) REFERENCES interviews(id),
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES questions(id),
  CONSTRAINT unique_interview_question UNIQUE (interview_id, question_id),
  CONSTRAINT unique_interview_order UNIQUE (interview_id, order_index)
);

CREATE INDEX idx_interview_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX idx_interview_questions_question_id ON interview_questions(question_id);
```

**Drizzle Schema:**
```typescript
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
```

---

### 6. interview_sessions
**Active/completed interview sessions (candidate taking interview)**

```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES resumes(id), -- Required: can't start without verified resume
  
  -- Progress tracking
  current_question_index INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
  
  -- Session locking (prevents concurrent sessions)
  session_token VARCHAR(255) UNIQUE NOT NULL, -- Unique token to prevent duplicate sessions
  locked_until TIMESTAMP, -- Session expires after 3 hours
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Results
  final_score INTEGER,
  max_score INTEGER,
  percentage DECIMAL(5, 2),
  ai_summary TEXT,
  evaluated_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_interview FOREIGN KEY (interview_id) REFERENCES interviews(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_resume FOREIGN KEY (resume_id) REFERENCES resumes(id),
  CONSTRAINT unique_user_interview UNIQUE (user_id, interview_id)
);

CREATE INDEX idx_interview_sessions_interview_id ON interview_sessions(interview_id);
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX idx_interview_sessions_session_token ON interview_sessions(session_token);
CREATE INDEX idx_interview_sessions_locked_until ON interview_sessions(locked_until);
```

**Drizzle Schema:**
```typescript
export const interviewSessions = pgTable('interview_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  interviewId: uuid('interview_id').notNull().references(() => interviews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resumeId: uuid('resume_id').notNull().references(() => resumes.id), // Required
  
  currentQuestionIndex: integer('current_question_index').default(0),
  status: varchar('status', { length: 50 }).default('not_started').$type<'not_started' | 'in_progress' | 'completed' | 'abandoned'>(),
  
  // Session locking
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  lockedUntil: timestamp('locked_until'),
  
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  finalScore: integer('final_score'),
  maxScore: integer('max_score'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  aiSummary: text('ai_summary'),
  evaluatedAt: timestamp('evaluated_at'),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniqueUserInterview: unique().on(table.userId, table.interviewId)
}));
```

---

### 7. answers
**Candidate answers to questions**

```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Answer data
  answer_text TEXT NOT NULL,
  
  -- Evaluation
  score INTEGER,
  feedback JSONB, -- AI-generated feedback (structured)
  evaluated BOOLEAN DEFAULT false,
  evaluated_at TIMESTAMP,
  ai_model_used VARCHAR(50), -- Track which AI model was used for evaluation (optional analytics)
  
  -- Timing
  time_taken INTEGER, -- seconds
  submitted_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES questions(id),
  CONSTRAINT unique_session_question UNIQUE (session_id, question_id)
);

CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_evaluated ON answers(evaluated);
```

**Drizzle Schema:**
```typescript
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
```

---

## Relationships

### Drizzle Relations
```typescript
import { relations } from 'drizzle-orm';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  createdInterviews: many(interviews),
  sessions: many(interviewSessions),
  createdQuestions: many(questions)
}));

// Resume relations
export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id]
  })
}));

// Interview relations
export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  creator: one(users, {
    fields: [interviews.createdBy],
    references: [users.id]
  }),
  questions: many(interviewQuestions),
  sessions: many(interviewSessions)
}));

// Question relations
export const questionsRelations = relations(questions, ({ one, many }) => ({
  creator: one(users, {
    fields: [questions.createdBy],
    references: [users.id]
  }),
  interviewQuestions: many(interviewQuestions),
  answers: many(answers)
}));

// Interview Questions relations
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

// Interview Session relations
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

// Answer relations
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
```

---

## Example Queries

### 1. Get Interview with Questions (Recruiter View)
```typescript
const interview = await db.query.interviews.findFirst({
  where: eq(interviews.id, interviewId),
  with: {
    questions: {
      with: {
        question: true
      },
      orderBy: [asc(interviewQuestions.orderIndex)]
    },
    sessions: {
      with: {
        user: true
      },
      orderBy: [desc(interviewSessions.finalScore)]
    }
  }
});
```

### 2. Get Active Session for Candidate
```typescript
const activeSession = await db.query.interviewSessions.findFirst({
  where: and(
    eq(interviewSessions.userId, userId),
    eq(interviewSessions.status, 'in_progress')
  ),
  with: {
    interview: {
      with: {
        questions: {
          with: { question: true },
          orderBy: [asc(interviewQuestions.orderIndex)]
        }
      }
    },
    answers: true
  }
});
```

### 3. Get Candidate Results with Feedback
```typescript
const sessionWithResults = await db.query.interviewSessions.findFirst({
  where: eq(interviewSessions.id, sessionId),
  with: {
    user: true,
    interview: true,
    answers: {
      with: {
        question: true
      },
      orderBy: [asc(answers.submittedAt)]
    }
  }
});
```

### 4. Get Question Bank with Filters
```typescript
const questionBank = await db.query.questions.findMany({
  where: and(
    eq(questions.difficulty, 'medium'),
    eq(questions.category, 'React')
  ),
  orderBy: [desc(questions.createdAt)],
  limit: 20
});
```

### 5. Get All Candidates for Interview (Recruiter Dashboard)
```typescript
const candidates = await db.query.interviewSessions.findMany({
  where: eq(interviewSessions.interviewId, interviewId),
  with: {
    user: true,
    answers: {
      with: { question: true }
    }
  },
  orderBy: [desc(interviewSessions.finalScore)]
});
```

---

## Indexes Strategy

### Performance Optimization
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Interview queries
CREATE INDEX idx_interviews_created_by ON interviews(created_by);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_is_public ON interviews(is_public);

-- Session queries (most frequent)
CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_interview_id ON interview_sessions(interview_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);

-- Answer queries (for evaluation)
CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_evaluated ON answers(evaluated);

-- Question bank search
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_type ON questions(type);
```

---

## Data Types & Constraints

### Key Design Decisions

**UUID vs Integer IDs:**
- ✅ UUIDs for all primary keys (better for distributed systems, no collision)
- ✅ `gen_random_uuid()` for PostgreSQL 13+

**JSONB for Flexible Data:**
- `options` (MCQ): Array of strings
- `expected_keywords` (Short Answer): Array of strings
- `evaluation_criteria` (Code): Array of strings
- `feedback` (Answers): Complex nested object
- `assigned_emails` (Interviews): Array of strings

**Timestamps:**
- `created_at`: When record was created
- `updated_at`: Last modification time
- `started_at`: Interview start time (source of truth for timing)
- `submitted_at`: Answer submission time
- `evaluated_at`: When AI evaluation completed

**Unique Constraints:**
- One user per email: `UNIQUE (email)`
- One session per user per interview: `UNIQUE (user_id, interview_id)`
- One answer per question per session: `UNIQUE (session_id, question_id)`
- No duplicate questions in interview: `UNIQUE (interview_id, question_id)`

---

## Migration Strategy

### Initial Migration (Drizzle Kit)
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
});
```

### Generate & Run Migration
```bash
# Generate migration
pnpm drizzle-kit generate

# Apply migration
pnpm drizzle-kit migrate
```

### Seed Data (Optional)
```typescript
// seed.ts
import { db } from './db';
import { users, questions } from './db/schema';

async function seed() {
  // Create demo recruiter
  const [recruiter] = await db.insert(users).values({
    email: 'recruiter@example.com',
    passwordHash: await hash('password123'),
    name: 'Demo Recruiter',
    role: 'recruiter'
  }).returning();
  
  // Create sample questions
  await db.insert(questions).values([
    {
      type: 'mcq',
      difficulty: 'easy',
      category: 'React',
      questionText: 'What is JSX?',
      options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'],
      correctAnswer: 'JavaScript XML',
      timeLimit: 20,
      points: 10,
      createdBy: recruiter.id
    },
    // ... more questions
  ]);
}

seed();
```