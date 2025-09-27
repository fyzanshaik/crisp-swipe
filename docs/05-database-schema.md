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
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 20 })
    .notNull()
    .$type<"candidate" | "recruiter">(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### 2. resumes

**Stores candidate resume data**

```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'pdf' or 'docx'
  extracted_name VARCHAR(255),
  extracted_email VARCHAR(255),
  extracted_phone VARCHAR(20),
  uploaded_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
```

**Drizzle Schema:**

```typescript
export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 })
    .notNull()
    .$type<"pdf" | "docx">(),
  extractedName: varchar("extracted_name", { length: 255 }),
  extractedEmail: varchar("extracted_email", { length: 255 }),
  extractedPhone: varchar("extracted_phone", { length: 20 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
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

  //
```
