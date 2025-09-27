# Architecture Summary & Key Decisions

## Executive Summary

**Crisp** is an AI-powered interview assistant with separate recruiter and candidate portals. Recruiters generate questions using AI, create interviews, and monitor candidates. Candidates upload resumes, take timed interviews, and receive AI-evaluated feedback.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│                                                          │
│  React + Vite + TypeScript + Tailwind + shadcn/ui       │
│  ├── TanStack Router (routing)                          │
│  ├── TanStack Query (server state + IndexedDB cache)    │
│  ├── Zustand (client state: timers, UI)                 │
│  └── Vercel AI SDK (streaming responses)                │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↕ REST API (JWT Auth)
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                             │
│                                                          │
│  Bun + Hono + TypeScript                                │
│  ├── JWT Authentication (role-based)                    │
│  ├── Vercel AI SDK (question gen, evaluation)           │
│  ├── Background Jobs (async evaluation)                 │
│  └── File Upload (resume parsing)                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    DATABASE                              │
│                                                          │
│  PostgreSQL + Drizzle ORM                               │
│  ├── users, resumes                                     │
│  ├── questions (question bank)                          │
│  ├── interviews, interview_questions                    │
│  ├── interview_sessions (active/completed)              │
│  └── answers (with AI evaluation)                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                      │
│                                                          │
│  ├── OpenAI / Anthropic (via Vercel AI SDK)            │
│  ├── File Storage (local or S3)                         │
│  └── Redis (optional: AI response caching)              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Key Architectural Decisions

### 1. Separate Frontend/Backend

**Decision:** Independent React frontend + Hono backend

**Rationale:**

- Clear separation of concerns
- Independent scaling & deployment
- Avoid Next.js fullstack complexity
- Easier debugging

**Alternative Rejected:** Next.js API routes (too coupled, hard to debug)

---

### 2. Pre-generated Questions (Not On-the-fly)

**Decision:** Recruiter generates and reviews questions before publishing

**Rationale:**

- Consistent evaluation (same questions for all candidates)
- Recruiter controls quality
- Reusable question bank
- Cost-efficient (generate once, reuse)
- Instant interview start (no AI wait)

**Alternative Rejected:** Generate questions during interview (slow, inconsistent, expensive)

---

### 3. AI-Evaluated Code (No Execution)

**Decision:** AI evaluates code as text, no code execution

**Rationale:**

- Security (no eval, no sandboxing)
- Works for any language (Python, Java, JS)
- Partial credit possible
- Detailed feedback

**Alternative Rejected:** Test case execution (security risks, complex sandboxing)

---

### 4. Server as Source of Truth for Timers

**Decision:** PostgreSQL stores absolute timestamps, client calculates locally

**Rationale:**

- Prevents cheating (client can't manipulate time)
- Cross-device resume works perfectly
- Server validates all timestamps
- Client timer for smooth UX only

**Alternative Rejected:** Store timer state in client (easy to manipulate, no cross-device support)

---

### 5. Async Background Evaluation

**Decision:** Evaluate answers in background after submission

**Rationale:**

- Better UX (no waiting for AI)
- Can use slower/better AI models
- Retry logic for failed API calls
- Candidate continues immediately

**Alternative Rejected:** Synchronous evaluation (candidate waits 5-15s per question)

---

### 6. TanStack Query + Zustand (Not Redux)

**Decision:** TanStack Query for server state, Zustand for client state

**Rationale:**

- TanStack Query handles caching, refetching, persistence automatically
- Zustand is lightweight for timers and UI state
- Less boilerplate than Redux
- No state overlap/confusion

**Alternative Rejected:** Redux + RTK Query (more boilerplate, slower to implement)

---

### 7. PostgreSQL + Drizzle (Not MongoDB)

**Decision:** Relational database with type-safe ORM

**Rationale:**

- Structured data (users, interviews, questions, answers)
- ACID compliance for interview integrity
- Drizzle stays close to SQL (not too abstracted)
- Type safety end-to-end

**Alternative Rejected:** MongoDB (unnecessary flexibility, harder to enforce relations)

---

## Data Flow Patterns

### Interview Start Flow

```
1. Candidate clicks "Start Interview"
   ↓
2. POST /api/interviews/:id/start
   ├── Server creates interview_session
   ├── Records started_at (timestamp)
   ├── Returns questions + time_limits
   ↓
3. Client stores in Zustand
   ├── currentQuestion: 0
   ├── startedAt: new Date(server_time)
   ├── timeRemaining: 20
   ↓
4. Timer starts (local calculation)
   remaining = timeLimit - (now - startedAt)
```

### Answer Submission Flow

```
1. User types answer OR timer expires
   ↓
2. POST /api/interviews/:sessionId/answers
   ├── Server validates timestamp
   ├── Saves answer to DB (evaluated: false)
   ├── Updates session progress
   ├── Queues background evaluation job
   ↓
3. Server responds immediately
   ├── Returns next question
   ├── Returns server_time (client re-syncs)
   ↓
4. Client updates Zustand
   ├── currentQuestion += 1
   ├── startedAt = new Date(server_time)
   ├── timeRemaining = next_time_limit
```

### Page Refresh / Resume Flow

```
1. User refreshes page mid-interview
   ↓
2. GET /api/interviews/active
   ├── Server finds active session
   ├── Calculates current state from timestamps
   ├── Returns: current_question, elapsed_time, server_time
   ↓
3. Client shows "Welcome Back" modal
   ├── Calculates remaining time from server data
   ├── If time expired → auto-submit
   ├── Else → resume with correct timer
   ↓
4. Timer resumes from correct position
```

### Evaluation Flow (Background)

```
1. Answer submitted → Queued for evaluation
   ↓
2. Background job processes answer
   ├── MCQ: Auto-grade (instant)
   ├── Short Answer: Keywords + AI (5-10s)
   ├── Code: AI evaluation (10-15s)
   ↓
3. Score & feedback saved to DB
   ├── Update answer.score
   ├── Update answer.feedback (JSON)
   ├── Set evaluated: true
   ↓
4. Check if all answers evaluated
   ├── If yes → Generate final summary (AI)
   ├── Calculate total_score, percentage
   ├── Update session with results
```

---

## State Management Strategy

### Three Layers of State

#### 1. Server State (TanStack Query)

**What:** Data from API

- User profile
- Interview data
- Questions
- Answers
- Results

**Stored in:** IndexedDB (via persistQueryClient)

**Lifecycle:**

- Fetched from API
- Cached locally
- Stale after X minutes
- Persists across refreshes

**Example:**

```typescript
const { data: interview } = useQuery({
  queryKey: ["interview", interviewId],
  queryFn: () => api.getInterview(interviewId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

#### 2. Client State (Zustand)

**What:** Ephemeral UI state

- Timer countdown
- Current question index
- Modal open/closed
- Form input values

**Stored in:** Memory only (cleared on refresh)

**Lifecycle:**

- Created on component mount
- Updated by user actions
- Cleared on unmount/refresh

**Example:**

```typescript
const useInterviewStore = create((set) => ({
  timeRemaining: 20,
  currentQuestion: 0,

  tick: () =>
    set((s) => ({
      timeRemaining: s.timeRemaining - 1,
    })),

  nextQuestion: () =>
    set((s) => ({
      currentQuestion: s.currentQuestion + 1,
    })),
}));
```

---

#### 3. Database State (PostgreSQL)

**What:** Source of truth

- All persisted data
- Timestamps (started_at, submitted_at)
- Session progress
- Scores & feedback

**Access via:** API only (never directly from frontend)

**Lifecycle:** Permanent until deleted

---

## Security Considerations

### Authentication

- JWT tokens (HS256)
- Stored in localStorage
- Included in Authorization header
- Role-based access control (candidate/recruiter)

### Authorization

- Middleware checks JWT payload
- Role-based route protection
- Resource ownership validation (can't access other user's data)

### Timer Anti-Cheat

```javascript
// Server validates ALL timestamps
const serverElapsed = (Date.now() - session.started_at) / 1000;

// Check if too fast (skipped questions)
if (serverElapsed < expectedMinTime - 5) {
  throw new Error("Invalid submission time");
}

// Check if exceeded limit
if (serverElapsed > expectedMaxTime + 2) {
  throw new Error("Time limit exceeded");
}

// Client timestamp is IGNORED (only for logging)
```

### Resume Parsing

- File type validation (only PDF/DOCX)
- File size limit (< 5MB)
- AI extraction with fallback to manual input
- No arbitrary file execution

### Input Validation

- Zod schemas for all API inputs
- SQL injection prevention (Drizzle ORM parameterized queries)
- XSS prevention (React escapes by default)

---

## Performance Optimizations

### Frontend

1. **Code Splitting:** Dynamic imports for routes
2. **Image Optimization:** Lazy loading, WebP format
3. **Bundle Size:** Tree-shaking, only import needed components
4. **Caching:** TanStack Query caches API responses
5. **IndexedDB:** Persist cache across sessions

### Backend

1. **Database Indexing:** Indexes on frequently queried columns
2. **Connection Pooling:** Reuse database connections
3. **Async Evaluation:** Don't block API responses
4. **AI Response Caching (Redis):** Cache identical prompts
5. **Batch Operations:** Bulk inserts where possible

### API

1. **Pagination:** Limit results (default 20)
2. **Field Selection:** Only return needed fields
3. **Compression:** Gzip responses
4. **Rate Limiting:** Prevent abuse (100 req/min)

---

## Deployment Architecture

### Frontend (Vercel/Netlify)

```
Browser → CDN → Static Assets
         ↓
      SPA Router (TanStack Router)
         ↓
      API Calls → Backend
```

**Environment Variables:**

- `VITE_API_URL`: Backend API URL
- `VITE_AI_ENABLED`: Feature flag for AI (optional)

---

### Backend (Railway/Render/Fly.io)

```
API Gateway → Hono Server → PostgreSQL
              ↓
         Background Jobs
              ↓
         AI APIs (OpenAI/Anthropic)
```

**Environment Variables:**

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: For token signing
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`: AI provider
- `UPLOAD_DIR`: File storage path
- `REDIS_URL` (optional): For caching

---

### Database (Neon/Supabase/Railway)

- PostgreSQL 15+
- Automated backups
- Connection pooling (PgBouncer)

**Migrations:**

```bash
pnpm drizzle-kit generate  # Generate migration
pnpm drizzle-kit migrate   # Apply to production
```

---

## Monitoring & Logging

### Application Logging

```typescript
// Structured logging
logger.info("Interview started", {
  userId,
  interviewId,
  timestamp: new Date(),
});

logger.error("AI evaluation failed", {
  sessionId,
  questionId,
  error: err.message,
});
```

### Metrics to Track

- API response times
- AI API latency
- Interview completion rate
- Error rates by endpoint
- Database query performance

### Error Tracking

- Frontend: Error boundaries + reporting service
- Backend: Global error handler + logging

---

## Testing Strategy

### Unit Tests

- Utility functions (time calculations, validation)
- Individual components
- API route handlers

### Integration Tests

- Auth flow (register → login → protected route)
- Interview flow (start → answer → submit)
- Evaluation system (mock AI responses)

### E2E Tests (Optional)

- Full recruiter flow (Playwright/Cypress)
- Full candidate flow
- Cross-browser testing

### Manual Testing Checklist

- [ ] Timer accuracy across refreshes
- [ ] Cross-device resume
- [ ] AI evaluation quality
- [ ] Mobile responsiveness
- [ ] Edge cases (network errors, expired interviews)

---

## Scaling Considerations

### Current Architecture (MVP)

- Supports: 100-500 concurrent users
- Database: Single PostgreSQL instance
- No caching layer

### Future Scaling (If Needed)

**Horizontal Scaling:**

```
          Load Balancer
         /      |      \
    Server1  Server2  Server3
         \      |      /
          PostgreSQL
          (Read Replicas)
```

**Caching Layer:**

- Redis for:
  - AI response caching
  - Session management
  - Rate limiting

**CDN:**

- CloudFront/Cloudflare for static assets
- Edge caching for API responses

**Database:**

- Read replicas for candidate queries
- Connection pooling (PgBouncer)
- Partitioning large tables (answers, sessions)

**Background Jobs:**

- Dedicated worker servers
- Queue system (BullMQ + Redis)
- Horizontal scaling of workers

---

## Cost Analysis

### Development (Free/Cheap)

- **Frontend Hosting:** Vercel/Netlify (free tier)
- **Backend Hosting:** Railway/Render ($5-10/month)
- **Database:** Neon/Supabase (free tier: 0.5GB)
- **Total:** $5-10/month

### Production (100 Candidates/month)

**AI Costs:**

- Question generation: 10 interviews × $0.05 = $0.50
- Evaluation: 100 candidates × $0.04 = $4.00
- Total AI: ~$5/month

**Infrastructure:**

- Frontend: Free (Vercel)
- Backend: $10-20/month (Railway/Render)
- Database: $10-20/month (Neon/Supabase)
- Total Infrastructure: ~$25/month

**Grand Total: ~$30/month for 100 candidates**

---

## Future Enhancements (Post-MVP)

### Phase 2 Features

1. **Real-time Updates (Socket.io)**
   - Live candidate progress on recruiter dashboard
   - Instant notification on interview completion

2. **Email Notifications**
   - Interview assignment emails
   - Reminder emails (deadline approaching)
   - Results notification

3. **Advanced Analytics**
   - Average score per question
   - Time taken analysis
   - Difficulty calibration

4. **Question Bank Management**
   - Categories & tags
   - Version control
   - Collaborative editing

5. **Interview Templates**
   - Save interview as template
   - Reuse across multiple sessions
   - Shareable templates

### Phase 3 Features

1. **Video Interviews**
   - Record candidate responses
   - AI-based facial expression analysis (optional)

2. **Collaborative Hiring**
   - Multiple recruiters per interview
   - Comments & ratings
   - Hiring pipeline integration

3. **Candidate Portal Enhancements**
   - Practice mode
   - Interview history
   - Performance trends

4. **AI Improvements**
   - Fine-tuned models for specific roles
   - Contextual follow-up questions
   - Bias detection & mitigation

---

## Quick Reference: Tech Stack

| Layer        | Technology       | Purpose                          |
| ------------ | ---------------- | -------------------------------- |
| **Frontend** | React + Vite     | UI framework                     |
|              | TypeScript       | Type safety                      |
|              | TanStack Router  | Client-side routing              |
|              | TanStack Query   | Server state management          |
|              | Zustand          | Client state management          |
|              | Tailwind CSS     | Styling                          |
|              | shadcn/ui        | UI components                    |
| **Backend**  | Bun              | JavaScript runtime               |
|              | Hono             | Web framework                    |
|              | TypeScript       | Type safety                      |
|              | Drizzle ORM      | Database ORM                     |
|              | Vercel AI SDK    | AI integration                   |
| **Database** | PostgreSQL       | Relational database              |
| **AI**       | OpenAI/Anthropic | Question generation & evaluation |
| **Storage**  | IndexedDB        | Client-side cache                |
|              | Local/S3         | File storage (resumes)           |
| **Optional** | Redis            | AI response caching              |
|              | Socket.io        | Real-time updates                |

---

## Contact & Resources

### Documentation

- Hono: https://hono.dev
- Drizzle: https://orm.drizzle.team
- TanStack Query: https://tanstack.com/query
- Vercel AI SDK: https://sdk.vercel.ai
- shadcn/ui: https://ui.shadcn.com

### GitHub Repo Structure

```
crisp/
├── frontend/          # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── main.tsx
│   └── package.json
│
├── backend/           # Hono API
│   ├── src/
│   │   ├── routes/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── lib/
│   │   └── index.ts
│   └── package.json
│
├── README.md
└── docs/
    └── (all these markdown files)
```

---

## Summary of Key Principles

1. ✅ **Server is source of truth** - All timestamps validated server-side
2. ✅ **Security first** - No code execution, JWT auth, role-based access
3. ✅ **AI-first** - Use AI for generation & evaluation, not execution
4. ✅ **Async where possible** - Background jobs for evaluation
5. ✅ **Type safety** - TypeScript + Zod + Drizzle end-to-end
6. ✅ **Performance** - Caching, indexing, lazy loading
7. ✅ **User experience** - Smooth timers, instant feedback, clear errors
8. ✅ **Scalable architecture** - Can grow from 10 to 10,000 users

---

**This document summarizes the complete architecture. Refer to individual markdown files for detailed implementation guidance.**
