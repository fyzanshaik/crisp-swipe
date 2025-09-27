# Question & Evaluation System

## Question Types & Distribution

### Full Stack Developer Interview (6 questions, ~6 minutes)

| Difficulty | Type         | Count | Time Each | Points Each | Total Time        | Total Points |
| ---------- | ------------ | ----- | --------- | ----------- | ----------------- | ------------ |
| Easy       | MCQ          | 2     | 20s       | 10          | 40s               | 20           |
| Medium     | Short Answer | 2     | 60s       | 20          | 120s              | 40           |
| Hard       | Code         | 2     | 120s      | 30          | 240s              | 60           |
| **TOTAL**  | -            | **6** | -         | -           | **400s (6m 40s)** | **120**      |

---

## Question Schema

### Base Question Structure

```javascript
{
  id: "q_123",
  type: "mcq" | "short_answer" | "code",
  difficulty: "easy" | "medium" | "hard",
  category: "React" | "Node.js" | "JavaScript" | "System Design" | "Database",
  question_text: string,
  time_limit: number, // seconds
  points: number,

  // Type-specific fields (see below)
}
```

---

## 1. Easy - MCQ (Multiple Choice Questions)

### Schema

```javascript
{
  type: "mcq",
  difficulty: "easy",
  question_text: "Which hook is used for side effects in React?",
  options: [
    "useState",
    "useEffect", // correct
    "useContext",
    "useMemo"
  ],
  correct_answer: "useEffect",
  time_limit: 20,
  points: 10,
  validation: "exact_match"
}
```

### Evaluation (Auto-graded)

```javascript
// Instant scoring, no AI needed
const score = userAnswer === question.correct_answer ? question.points : 0;

const feedback =
  score > 0
    ? "Correct!"
    : `Incorrect. Correct answer: ${question.correct_answer}`;
```

**Characteristics:**

- ✅ Instant scoring
- ✅ Zero AI cost
- ✅ Objective evaluation
- ✅ AI-generated options (during question creation)

---

## 2. Medium - Short Answer

### Schema

```javascript
{
  type: "short_answer",
  difficulty: "medium",
  question_text: "Explain the difference between REST and GraphQL APIs.",
  expected_keywords: [
    "query",
    "endpoint",
    "over-fetching",
    "single request",
    "schema"
  ],
  min_words: 30,
  max_words: 150,
  time_limit: 60,
  points: 20,
  evaluation_prompt: `Score this answer on:
    - Technical accuracy (10 pts)
    - Practical understanding (5 pts)
    - Use case awareness (5 pts)`
}
```

### Evaluation (Hybrid: Keywords + AI)

```javascript
// Step 1: Keyword matching (50% weight)
const keywordsFound = countKeywords(userAnswer, question.expected_keywords);
const keywordScore =
  (keywordsFound / question.expected_keywords.length) * (question.points * 0.5);

// Step 2: AI semantic evaluation (50% weight)
const aiEval = await generateObject({
  model: openai("gpt-4o-mini"), // Cheaper model
  schema: z.object({
    semantic_score: z.number().min(0).max(10),
    feedback: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
  }),
  prompt: `
    Evaluate this answer for technical accuracy and depth:
    Question: ${question.question_text}
    Answer: ${userAnswer}
    ${question.evaluation_prompt}
  `,
});

const totalScore = keywordScore + aiEval.object.semantic_score;
const feedback = aiEval.object.feedback;
```

**Scoring Breakdown:**

- **Keyword Match (10 points)**: 3/5 keywords found = 6 points
- **AI Semantic (10 points)**: Evaluates depth, accuracy, clarity
- **Total**: 0-20 points

---

## 3. Hard - Code Questions

### Schema

```javascript
{
  type: "code",
  difficulty: "hard",
  question_text: "Write a React hook that debounces a value.",
  language: "javascript",
  starter_code: `function useDebounce(value, delay) {
  // Your implementation here
}`,
  sample_solution: `function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}`,
  evaluation_criteria: [
    "Uses useEffect and useState correctly (8 pts)",
    "Implements debounce logic with setTimeout (8 pts)",
    "Cleans up timeout on unmount (7 pts)",
    "Returns debounced value (7 pts)"
  ],
  time_limit: 120,
  points: 30
}
```

### Evaluation (AI - No Execution)

```javascript
const aiEval = await generateObject({
  model: openai("gpt-4o"), // Better model for code reasoning
  schema: z.object({
    score: z.number().min(0).max(30),
    criteria_scores: z.object({
      uses_hooks_correctly: z.number().min(0).max(8),
      debounce_logic: z.number().min(0).max(8),
      cleanup: z.number().min(0).max(7),
      returns_value: z.number().min(0).max(7),
    }),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    overall_feedback: z.string(),
  }),
  prompt: `
    You are evaluating a coding interview answer.

    Question: ${question.question_text}

    Expected approach:
    ${question.sample_solution}

    Candidate's code:
    ${userCode}

    Evaluate based on these criteria:
    ${question.evaluation_criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

    Be fair but rigorous. Award partial credit for correct concepts
    even if implementation is incomplete.

    Return structured JSON with scores and feedback.
  `,
});

const score = aiEval.object.score;
const feedback = aiEval.object;
```

**Why No Code Execution?**

- ✅ **Security**: No eval(), no sandboxing complexity
- ✅ **Flexibility**: Can evaluate ANY language (Python, Java, etc.)
- ✅ **Partial Credit**: AI understands intent, not just output
- ✅ **Feedback**: Detailed explanations of strengths/weaknesses

---

## Question Generation Flow

### Recruiter Creates Interview

#### Step 1: Trigger Generation

```
POST /api/questions/generate

Request:
{
  role: "Full Stack Developer",
  technologies: ["React", "Node.js", "PostgreSQL"],
  difficulty_distribution: {
    easy: 2,    // MCQs
    medium: 2,  // Short answers
    hard: 2     // Code questions
  }
}
```

#### Step 2: AI Generates All 6 Questions

```javascript
const { object } = await generateObject({
  model: openai("gpt-4o"),
  schema: z.object({
    questions: z.array(
      z.object({
        type: z.enum(["mcq", "short_answer", "code"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        question_text: z.string(),
        options: z.array(z.string()).optional(),
        correct_answer: z.string().optional(),
        expected_keywords: z.array(z.string()).optional(),
        starter_code: z.string().optional(),
        sample_solution: z.string().optional(),
        evaluation_criteria: z.array(z.string()).optional(),
      }),
    ),
  }),
  prompt: `
    Generate 6 interview questions for a Full Stack Developer role.
    Technologies: React, Node.js, PostgreSQL

    Requirements:
    - 2 Easy MCQ questions (20 seconds each)
    - 2 Medium short answer questions (60 seconds each)
    - 2 Hard code questions (120 seconds each)

    For MCQs: Include 4 options with 1 correct answer
    For Short Answers: Include 5 expected keywords
    For Code: Include starter code and sample solution

    Make questions practical and test real-world skills.
  `,
});

// Returns all 6 questions instantly
```

#### Step 3: Recruiter Reviews & Edits

```
Frontend shows:
┌─────────────────────────────────────────┐
│  Generated Questions (6)                │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Question 1 (Easy - MCQ)             │
│  "Which hook is used for..."            │
│  [Edit] [Regenerate] [Delete]           │
│                                         │
│  ✅ Question 2 (Easy - MCQ)             │
│  "What does useEffect do?"              │
│  [Edit] [Regenerate] [Delete]           │
│                                         │
│  ✅ Question 3 (Medium - Short Answer)  │
│  "Explain closure in JavaScript..."     │
│  Keywords: [closure, scope, function]   │
│  [Edit Keywords] [Regenerate]           │
│                                         │
│  ... (3 more questions)                 │
│                                         │
│  [Save to Question Bank]                │
│  [Use in Interview]                     │
└─────────────────────────────────────────┘
```

#### Step 4: Regenerate Individual Question (if needed)

```
POST /api/questions/regenerate

Request:
{
  question_index: 2,
  current_question: {...},
  feedback: "Make it more focused on async/await"
}

// AI regenerates just that one question with feedback
```

#### Step 5: Save to Question Bank

```javascript
// Save questions to database
await db.insert(questions).values([
  {
    type: "mcq",
    difficulty: "easy",
    question_text: "...",
    created_by: recruiterId,
    created_at: new Date(),
  },
  // ... 5 more
]);

// Link questions to interview
await db.insert(interview_questions).values([
  { interview_id, question_id, order: 0, points: 10 },
  { interview_id, question_id, order: 1, points: 10 },
  // ...
]);
```

---

## Evaluation Cost Breakdown

### Per Interview

```
Question Generation (one-time):
- 6 questions via gpt-4o: ~$0.05

Per Candidate:
- 2 MCQ: $0 (auto-graded)
- 2 Short Answer (gpt-4o-mini): ~$0.002
- 2 Code (gpt-4o): ~$0.02
- Final Summary (gpt-4o): ~$0.02

Total per candidate: ~$0.04
```

### Scale

- 10 candidates: ~$0.40
- 100 candidates: ~$4.00
- 1000 candidates: ~$40.00

**Cost Optimization:**

- Reuse questions across interviews
- Use gpt-4o-mini for simpler evaluations
- Cache AI responses (Redis later)

---

## Question Bank

### Organic Growth Strategy

- **No pre-seeding required**
- Questions accumulate naturally during testing
- Recruiter generates → reviews → saves
- Build library of 50-100 questions over time

### Categories for Organization

```
- React (Hooks, Components, State Management)
- Node.js (Express, APIs, Async)
- JavaScript (ES6+, Closures, Promises)
- Database (SQL, PostgreSQL, MongoDB)
- System Design (Scalability, Architecture)
- Algorithms (Data Structures, Complexity)
```

### Reusability

- Questions tagged by technology/category
- Recruiters can:
  - Browse question bank
  - Filter by difficulty/category
  - Mix bank questions + new generations
  - Edit and save variations
