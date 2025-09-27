# Interview Flow & Persistence System

## Complete Interview Flow

### Phase 1: Start Interview

#### Client Side

```javascript
// User clicks "Start Interview"
const startInterview = async () => {
  const response = await fetch(`/api/interviews/${interviewId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
  });

  const session = await response.json();

  // Store in Zustand (local state)
  setInterviewState({
    sessionId: session.id,
    startedAt: new Date(session.started_at),
    currentQuestion: 0,
    questions: session.questions,
    timeLimits: session.time_limits,
    answers: [],
  });

  // Start timer
  startTimer(session.time_limits[0]);
};
```

#### Server Side

```javascript
// POST /api/interviews/:id/start
app.post("/api/interviews/:id/start", async (req, res) => {
  const { id: interviewId } = req.params;
  const userId = req.user.id; // from JWT

  // Check if already started
  const existing = await db.query.interview_sessions.findFirst({
    where: and(
      eq(interview_sessions.interview_id, interviewId),
      eq(interview_sessions.user_id, userId),
      eq(interview_sessions.status, "in_progress"),
    ),
  });

  if (existing) {
    return res.status(409).json({ error: "Interview already in progress" });
  }

  // Get interview with questions
  const interview = await db.query.interviews.findFirst({
    where: eq(interviews.id, interviewId),
    with: { questions: true },
  });

  // Create session
  const [session] = await db
    .insert(interview_sessions)
    .values({
      interview_id: interviewId,
      user_id: userId,
      started_at: new Date(),
      current_question_index: 0,
      status: "in_progress",
    })
    .returning();

  res.json({
    id: session.id,
    started_at: session.started_at,
    questions: interview.questions,
    time_limits: interview.questions.map((q) => q.time_limit),
    server_time: new Date().toISOString(), // For client sync
  });
});
```

---

### Phase 2: Answer Questions

#### Timer Logic (Client)

```javascript
// Zustand store
const useInterviewStore = create((set, get) => ({
  timeRemaining: 20,
  currentQuestion: 0,
  startedAt: new Date(),

  // Tick every second
  tick: () => {
    const { startedAt, timeLimits, currentQuestion } = get();
    const elapsed = (Date.now() - startedAt) / 1000;
    const remaining = timeLimits[currentQuestion] - elapsed;

    if (remaining <= 0) {
      get().autoSubmit();
    } else {
      set({ timeRemaining: Math.floor(remaining) });
    }
  },

  autoSubmit: async () => {
    const { currentAnswer } = get();
    await submitAnswer(currentAnswer, { timeExpired: true });
  },
}));

// Timer component
useEffect(() => {
  const interval = setInterval(() => {
    tick();
  }, 1000);

  return () => clearInterval(interval);
}, [currentQuestion]);
```

#### Submit Answer (Client → Server)

```javascript
// Client submits answer
const submitAnswer = async (answer, options = {}) => {
  const { sessionId, currentQuestion } = useInterviewStore.getState();

  const response = await fetch(`/api/interviews/${sessionId}/answers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      question_index: currentQuestion,
      answer,
      submitted_at: new Date().toISOString(),
      time_expired: options.timeExpired || false,
    }),
  });

  const result = await response.json();

  // Move to next question
  if (result.next_question) {
    setInterviewState({
      currentQuestion: currentQuestion + 1,
      startedAt: new Date(result.server_time), // Re-sync with server
      timeRemaining: result.time_limit,
    });
  } else {
    // Interview complete
    router.navigate("/interview/complete");
  }
};
```

#### Server Processes Answer

```javascript
// POST /api/interviews/:sessionId/answers
app.post("/api/interviews/:sessionId/answers", async (req, res) => {
  const { sessionId } = req.params;
  const { question_index, answer, submitted_at, time_expired } = req.body;

  const session = await db.query.interview_sessions.findFirst({
    where: eq(interview_sessions.id, sessionId),
    with: { interview: { with: { questions: true } } },
  });

  // Validate question index
  if (question_index !== session.current_question_index) {
    return res.status(400).json({ error: "Invalid question index" });
  }

  // Server-side time validation (anti-cheat)
  const serverNow = new Date();
  const startedAt = new Date(session.started_at);
  const totalElapsed = (serverNow - startedAt) / 1000;

  // Calculate expected minimum time
  let expectedMinTime = 0;
  for (let i = 0; i < question_index; i++) {
    expectedMinTime += session.interview.questions[i].time_limit;
  }

  // Check if too fast (cheating)
  if (totalElapsed < expectedMinTime - 5) {
    // 5s grace period
    return res.status(400).json({ error: "Invalid submission time" });
  }

  // Check if exceeded time limit
  const timeForCurrentQ = totalElapsed - expectedMinTime;
  if (
    timeForCurrentQ >
    session.interview.questions[question_index].time_limit + 2
  ) {
    return res.status(400).json({ error: "Time limit exceeded" });
  }

  // Save answer to database
  await db.insert(answers).values({
    session_id: sessionId,
    question_id: session.interview.questions[question_index].id,
    answer_text: answer,
    time_taken: timeForCurrentQ,
    submitted_at: serverNow,
    evaluated: false, // Mark for background evaluation
  });

  // Update session progress
  const nextQuestionIndex = question_index + 1;
  const isComplete = nextQuestionIndex >= session.interview.questions.length;

  await db
    .update(interview_sessions)
    .set({
      current_question_index: nextQuestionIndex,
      status: isComplete ? "completed" : "in_progress",
      completed_at: isComplete ? serverNow : null,
    })
    .where(eq(interview_sessions.id, sessionId));

  // Queue background evaluation
  await queue.add("evaluate-answer", {
    session_id: sessionId,
    question_id: session.interview.questions[question_index].id,
    answer,
  });

  // Return next question or completion
  if (isComplete) {
    res.json({
      success: true,
      completed: true,
      message: "Interview completed! Results will be available soon.",
    });
  } else {
    res.json({
      success: true,
      next_question_index: nextQuestionIndex,
      next_question: session.interview.questions[nextQuestionIndex],
      time_limit: session.interview.questions[nextQuestionIndex].time_limit,
      server_time: serverNow.toISOString(), // Client re-syncs timer
    });
  }
});
```

---

### Phase 3: Page Refresh / Resume Flow

#### Check for Active Session (Client)

```javascript
// On page load
useEffect(() => {
  const checkActiveInterview = async () => {
    const response = await fetch("/api/interviews/active", {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const data = await response.json();

    if (data.active_session) {
      const session = data.active_session;

      // Show "Welcome Back" modal
      setShowResumeModal(true);
      setResumeData(session);
    }
  };

  checkActiveInterview();
}, []);

// Handle resume
const handleResume = () => {
  const session = resumeData;

  // Calculate remaining time based on SERVER data
  const serverNow = new Date(session.server_time);
  const startedAt = new Date(session.started_at);
  const totalElapsed = (serverNow - startedAt) / 1000;

  // Calculate elapsed time for current question
  let elapsedForCurrentQ = totalElapsed;
  for (let i = 0; i < session.current_question_index; i++) {
    elapsedForCurrentQ -= session.time_limits[i];
  }

  const timeRemaining =
    session.time_limits[session.current_question_index] - elapsedForCurrentQ;

  if (timeRemaining <= 0) {
    // Time expired while away, auto-submit
    autoSubmitAndMoveNext();
  } else {
    // Resume with correct time
    setInterviewState({
      sessionId: session.id,
      currentQuestion: session.current_question_index,
      startedAt: new Date(serverNow.getTime() - elapsedForCurrentQ * 1000),
      timeRemaining: Math.floor(timeRemaining),
      questions: session.questions,
      answers: session.answers || [],
    });

    startTimer();
  }

  setShowResumeModal(false);
};
```

#### Server Returns Active Session

```javascript
// GET /api/interviews/active
app.get("/api/interviews/active", async (req, res) => {
  const userId = req.user.id;

  const activeSession = await db.query.interview_sessions.findFirst({
    where: and(
      eq(interview_sessions.user_id, userId),
      eq(interview_sessions.status, "in_progress"),
    ),
    with: {
      interview: {
        with: { questions: true },
      },
      answers: true,
    },
  });

  if (!activeSession) {
    return res.json({ active_session: null });
  }

  res.json({
    active_session: {
      id: activeSession.id,
      interview_id: activeSession.interview_id,
      started_at: activeSession.started_at,
      current_question_index: activeSession.current_question_index,
      questions: activeSession.interview.questions,
      time_limits: activeSession.interview.questions.map((q) => q.time_limit),
      answers: activeSession.answers,
      server_time: new Date().toISOString(), // Critical for time sync
    },
  });
});
```

---

### Phase 4: Background Evaluation

#### Evaluation Worker

```javascript
// Background job processor
queue.process("evaluate-answer", async (job) => {
  const { session_id, question_id, answer } = job.data;

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, question_id),
  });

  let score, feedback;

  // Route to appropriate evaluator
  switch (question.type) {
    case "mcq":
      ({ score, feedback } = await evaluateMCQ(question, answer));
      break;

    case "short_answer":
      ({ score, feedback } = await evaluateShortAnswer(question, answer));
      break;

    case "code":
      ({ score, feedback } = await evaluateCode(question, answer));
      break;
  }

  // Update answer with score
  await db
    .update(answers)
    .set({
      score,
      feedback: JSON.stringify(feedback),
      evaluated: true,
      evaluated_at: new Date(),
    })
    .where(
      and(
        eq(answers.session_id, session_id),
        eq(answers.question_id, question_id),
      ),
    );

  // Check if all answers evaluated
  const session = await db.query.interview_sessions.findFirst({
    where: eq(interview_sessions.id, session_id),
    with: { answers: true },
  });

  const allEvaluated = session.answers.every((a) => a.evaluated);

  if (allEvaluated) {
    // Generate final summary
    await generateFinalSummary(session_id);
  }
});

// MCQ Evaluator (instant)
async function evaluateMCQ(question, answer) {
  const isCorrect = answer === question.correct_answer;
  const score = isCorrect ? question.points : 0;
  const feedback = isCorrect
    ? "Correct!"
    : `Incorrect. Correct answer: ${question.correct_answer}`;

  return { score, feedback };
}

// Short Answer Evaluator (hybrid)
async function evaluateShortAnswer(question, answer) {
  // Keyword matching (50% weight)
  const keywords = question.expected_keywords || [];
  const keywordsFound = keywords.filter((kw) =>
    answer.toLowerCase().includes(kw.toLowerCase()),
  ).length;
  const keywordScore =
    (keywordsFound / keywords.length) * (question.points * 0.5);

  // AI semantic evaluation (50% weight)
  const aiEval = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      semantic_score: z
        .number()
        .min(0)
        .max(question.points * 0.5),
      feedback: z.string(),
      strengths: z.array(z.string()),
      improvements: z.array(z.string()),
    }),
    prompt: `
      Evaluate this short answer:
      Question: ${question.question_text}
      Answer: ${answer}
      Expected keywords: ${keywords.join(", ")}

      Score based on technical accuracy and depth (max ${question.points * 0.5} points).
    `,
  });

  const score = keywordScore + aiEval.object.semantic_score;
  const feedback = {
    total_score: score,
    keyword_score: keywordScore,
    semantic_score: aiEval.object.semantic_score,
    keywords_found: keywordsFound,
    keywords_total: keywords.length,
    ai_feedback: aiEval.object.feedback,
    strengths: aiEval.object.strengths,
    improvements: aiEval.object.improvements,
  };

  return { score, feedback };
}

// Code Evaluator (AI-based)
async function evaluateCode(question, answer) {
  const aiEval = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      score: z.number().min(0).max(question.points),
      criteria_scores: z.record(z.number()),
      strengths: z.array(z.string()),
      improvements: z.array(z.string()),
      overall_feedback: z.string(),
    }),
    prompt: `
      You are evaluating a coding interview answer.

      Question: ${question.question_text}

      Expected solution approach:
      ${question.sample_solution}

      Candidate's code:
      ${answer}

      Evaluation criteria:
      ${question.evaluation_criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

      Be fair but rigorous. Award partial credit for correct concepts.
      Max score: ${question.points} points
    `,
  });

  return {
    score: aiEval.object.score,
    feedback: {
      total_score: aiEval.object.score,
      criteria_scores: aiEval.object.criteria_scores,
      strengths: aiEval.object.strengths,
      improvements: aiEval.object.improvements,
      overall_feedback: aiEval.object.overall_feedback,
    },
  };
}
```

---

### Phase 5: Final Summary Generation

```javascript
async function generateFinalSummary(session_id) {
  const session = await db.query.interview_sessions.findFirst({
    where: eq(interview_sessions.id, session_id),
    with: {
      answers: {
        with: { question: true },
      },
      user: true,
      interview: true,
    },
  });

  // Calculate total score
  const totalScore = session.answers.reduce((sum, a) => sum + a.score, 0);
  const maxScore = session.answers.reduce(
    (sum, a) => sum + a.question.points,
    0,
  );
  const percentage = (totalScore / maxScore) * 100;

  // Generate AI summary
  const summary = await generateText({
    model: openai("gpt-4o"),
    prompt: `
      Generate a concise interview summary for a candidate.

      Candidate: ${session.user.name}
      Position: ${session.interview.title}
      Total Score: ${totalScore}/${maxScore} (${percentage.toFixed(1)}%)

      Performance breakdown:
      ${session.answers
        .map(
          (a) => `
        Q: ${a.question.question_text}
        Type: ${a.question.type} (${a.question.difficulty})
        Score: ${a.score}/${a.question.points}
      `,
        )
        .join("\n")}

      Generate a 3-4 sentence summary covering:
      1. Overall technical competency level
      2. Key strengths demonstrated
      3. Areas for improvement
      4. Hiring recommendation: Strong Hire / Hire / Maybe / No Hire

      Be objective and constructive.
    `,
  });

  // Update session with final results
  await db
    .update(interview_sessions)
    .set({
      final_score: totalScore,
      max_score: maxScore,
      percentage: percentage,
      ai_summary: summary.text,
      status: "completed",
      evaluated_at: new Date(),
    })
    .where(eq(interview_sessions.id, session_id));

  // Optional: Notify recruiter (if real-time implemented)
  // io.to(`recruiter_${session.interview.created_by}`).emit('interview_completed', {
  //   candidate_name: session.user.name,
  //   score: totalScore,
  //   percentage
  // });
}
```

---

## Data Persistence Strategy

### Server as Source of Truth

**PostgreSQL stores:**

```
interview_sessions:
- id, user_id, interview_id
- started_at, completed_at, evaluated_at
- current_question_index
- status (in_progress | completed)
- final_score, max_score, percentage
- ai_summary

answers:
- id, session_id, question_id
- answer_text
- score, feedback (JSON)
- time_taken, submitted_at
- evaluated (boolean), evaluated_at
```

**Client Storage (IndexedDB via TanStack Query):**

```
Caches for fast UI rendering:
- Interview metadata (title, description)
- Questions (text, options, time limits)
- User's previous answers (for display)

NOT stored in IndexedDB:
- Timer state (calculated from server timestamps)
- Current progress (fetched from server on resume)
```

**Zustand (In-memory only):**

```
Ephemeral UI state:
- timeRemaining (countdown)
- currentQuestion (index)
- startedAt (Date object for local calculation)
- UI flags (showModal, isSubmitting)
```

### Synchronization Points

| Event            | Action                                                             | Source of Truth |
| ---------------- | ------------------------------------------------------------------ | --------------- |
| Start interview  | POST /start → Server records `started_at`                          | Server          |
| Timer countdown  | Client calculates locally: `remaining = limit - (now - startedAt)` | Client (synced) |
| Submit answer    | POST /answers → Server validates timestamp                         | Server          |
| Page refresh     | GET /active → Server returns current state                         | Server          |
| Resume interview | Server calculates elapsed time → Client resumes timer              | Server          |
| Time expires     | Client auto-submits → Server validates                             | Server          |

### Anti-Cheat Validation

**Server validates ALL timestamps:**

```javascript
// Time validation logic
const totalElapsed = (serverNow - startedAt) / 1000;

// Check minimum time (prevent skipping ahead)
let expectedMinTime = 0;
for (let i = 0; i < currentQuestionIndex; i++) {
  expectedMinTime += timeLimits[i];
}

if (totalElapsed < expectedMinTime - 5) {
  throw new Error("Invalid submission - too fast");
}

// Check maximum time (prevent exceeding limit)
const timeForCurrentQ = totalElapsed - expectedMinTime;
if (timeForCurrentQ > timeLimits[currentQuestionIndex] + 2) {
  throw new Error("Time limit exceeded");
}
```

---

## "Welcome Back" Modal

### UX Flow

```
User refreshes page during interview
       ↓
Check for active session (GET /active)
       ↓
If active session exists:
       ↓
Show modal:
┌─────────────────────────────────────┐
│         Welcome Back! 🎉            │
├─────────────────────────────────────┤
│                                     │
│  You were taking:                   │
│  "Full Stack Developer Interview"   │
│                                     │
│  Progress: Question 3 of 6          │
│  Time remaining: 45 seconds         │
│                                     │
│  [Resume Interview]  [Start Over]   │
│                                     │
└─────────────────────────────────────┘
       ↓
Resume: Calculate remaining time from server data
       ↓
Start timer from correct position
```

### Implementation

```javascript
// Modal component
function WelcomeBackModal({ session, onResume, onStartOver }) {
  const timeRemaining = calculateRemainingTime(session);

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome Back! 🎉</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            You were taking: <strong>{session.interview.title}</strong>
          </p>

          <div className="bg-muted p-4 rounded-lg">
            <p>
              Progress: Question {session.current_question_index + 1} of{" "}
              {session.questions.length}
            </p>
            <p>
              Time remaining: <strong>{timeRemaining}s</strong>
            </p>
          </div>

          {timeRemaining <= 0 && (
            <Alert>
              <AlertTitle>Time Expired</AlertTitle>
              <AlertDescription>
                Time ran out while you were away. Your answer will be
                auto-submitted.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onStartOver}>
            Start Over
          </Button>
          <Button onClick={onResume}>Resume Interview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function calculateRemainingTime(session) {
  const serverNow = new Date(session.server_time);
  const startedAt = new Date(session.started_at);
  const totalElapsed = (serverNow - startedAt) / 1000;

  let elapsedForCurrentQ = totalElapsed;
  for (let i = 0; i < session.current_question_index; i++) {
    elapsedForCurrentQ -= session.time_limits[i];
  }

  const remaining =
    session.time_limits[session.current_question_index] - elapsedForCurrentQ;
  return Math.max(0, Math.floor(remaining));
}
```

---

## Cross-Device Resume

### Scenario: User switches devices

```
Device A (Chrome):
- User starts interview
- Answers Q1, Q2
- Closes browser

Device B (Firefox):
- User logs in (same JWT/account)
- GET /active returns session from Device A
- User sees "Welcome Back" modal
- Resumes from Q3 with correct time
```

**Key Implementation:**

```javascript
// Session is tied to user_id, not device
const session = await db.query.interview_sessions.findFirst({
  where: and(
    eq(interview_sessions.user_id, userId), // from JWT
    eq(interview_sessions.status, "in_progress"),
  ),
});

// Device-agnostic resume
// Server calculates state based on:
// - started_at (absolute timestamp)
// - current_question_index
// - Server's current time
// No device-specific data needed!
```

---

## Edge Cases Handled

### 1. Network Failure During Submit

```javascript
// Client: Retry logic
async function submitAnswer(answer, retries = 3) {
  try {
    const response = await fetch("/api/interviews/answers", {
      method: "POST",
      body: JSON.stringify({ answer }),
    });
    return response.json();
  } catch (error) {
    if (retries > 0) {
      await sleep(1000);
      return submitAnswer(answer, retries - 1);
    }
    throw error;
  }
}

// Server: Idempotency
// Use unique constraint on (session_id, question_id)
// Duplicate submissions are ignored
```

### 2. User Opens Multiple Tabs

```javascript
// Server: Lock check
const existingSession = await db.query.interview_sessions.findFirst({
  where: and(
    eq(interview_sessions.user_id, userId),
    eq(interview_sessions.status, "in_progress"),
  ),
});

if (existingSession && existingSession.locked_until > new Date()) {
  return res.status(409).json({
    error: "Interview already in progress in another tab/device",
  });
}
```

### 3. Time Manipulation (Client-side)

```javascript
// Server ALWAYS validates with its own clock
// Client timestamp is only for logging, NOT used for validation

// Server validation:
const serverCalculatedElapsed = (new Date() - session.started_at) / 1000;
// Ignore any client-sent elapsed time
```

### 4. Browser Crash Mid-Answer

```javascript
// Answer is only saved on submit
// If crash before submit:
// - On resume, user sees same question again
// - Timer continues from where it should be (server calculates)
// - User can re-answer the question

// No partial answers saved (simplifies state management)
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│                                                      │
│  Zustand (ephemeral):                               │
│  - timeRemaining (countdown)                        │
│  - currentQuestion (index)                          │
│  - startedAt (for local calculation)                │
│                                                      │
│  IndexedDB (TanStack Query cache):                  │
│  - Questions (text, options)                        │
│  - Interview metadata                               │
│  - Previous answers (display only)                  │
│                                                      │
└─────────────────────────────────────────────────────┘
                          ↕ (API calls)
┌─────────────────────────────────────────────────────┐
│                   SERVER (Hono + Bun)                │
│                                                      │
│  PostgreSQL (source of truth):                      │
│  - started_at (absolute timestamp)                  │
│  - current_question_index                           │
│  - answers (with timestamps)                        │
│  - session status                                   │
│                                                      │
│  Background Jobs:                                   │
│  - Answer evaluation (async)                        │
│  - Summary generation                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Performance Optimizations

### 1. Reduce API Calls

```javascript
// Don't poll server every second for time
// Client calculates timer locally, syncs only on:
// - Submit answer
// - Page load/resume
// - Every 30 seconds (optional heartbeat)
```

### 2. Batch Evaluations

```javascript
// Don't wait for evaluation before showing next question
// Queue all evaluations, process in background
// Candidate sees "Submitted!" immediately
```

### 3. Cache Questions

```javascript
// TanStack Query caches questions
const { data: questions } = useQuery({
  queryKey: ["interview", interviewId, "questions"],
  queryFn: fetchQuestions,
  staleTime: Infinity, // Questions don't change during interview
  cacheTime: 1000 * 60 * 60, // 1 hour
});
```

### 4. Lazy Load Results

```javascript
// Don't fetch all candidate results upfront
// Recruiter dashboard: Load summary list first
// Detailed view: Load on click (individual API call)
```
