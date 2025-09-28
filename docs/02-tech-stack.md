# Tech Stack & Architecture Decisions


### Frontend

```
- React + Vite + TypeScript
- TanStack Router (type-safe routing)
- TanStack Query (server state management + persistence)
- Zustand (lightweight client state for timers/UI)
- IndexedDB (via TanStack Query persistence)
- Tailwind CSS + shadcn/ui
- Simple <textarea> for code (Monaco Editor later if time permits)
```

### Backend

```
- Bun runtime (blazing fast JavaScript runtime)
- Hono framework (Express-like, multi-runtime support)
- PostgreSQL (relational database)
- Drizzle ORM (lightweight, SQL-like, type-safe)
- Vercel AI SDK (question generation + evaluation)
- JWT authentication (stateless, simple)
- In-memory job queue (async AI evaluation)
- Cloudflare R2 (resume file storage)
```

### Package Manager

```
- pnpm (efficient, fast)
```

### Data Persistence Strategy

```
- PostgreSQL: Source of truth (all interview data, user data)
- Cloudflare R2: Resume file storage (PDF/DOCX files)
- IndexedDB: TanStack Query cache (survives refresh)
- Zustand: Ephemeral state (timers, current UI state)
- In-memory: Background job queue (evaluation processing)
```

---

## Architecture Decisions & Rationale

### Why Separate Frontend/Backend?

**Decision:** Separate React frontend + Hono backend

**Pros:**

- ✅ Clear separation of concerns
- ✅ Independent scaling
- ✅ Easier debugging
- ✅ No Next.js fullstack complexity

**Alternatives Rejected:**

- ❌ Next.js (fullstack errors, over-engineered for this use case)
- ❌ TanStack Start (still in beta, risky for deadline)

---

### Why TanStack Router (not TanStack Start)?

**Decision:** Vite + TanStack Router

**Pros:**

- ✅ Stable, production-ready
- ✅ Type-safe routing
- ✅ More control over setup
- ✅ Proven ecosystem

**Alternative:**

- ❌ TanStack Start: Still beta (v1.0 not released), potential bugs

---

### Why TanStack Query + Zustand (not Redux)?

**Decision:** TanStack Query for server state + Zustand for client state

**Reasoning:**

- **TanStack Query**: Server state, caching, persistence to IndexedDB
- **Zustand**: Lightweight client state (timers, UI flags)
- **No Redux**: Would overlap with TanStack Query, more boilerplate

**State Separation:**

```
Server State (TanStack Query):
- Interview data from API
- User profile
- Questions/answers
- Auto-refetch, caching, persistence

Client State (Zustand):
- Timer countdown (local, ephemeral)
- Current question index (synced with server periodically)
- Modal open/closed
- UI flags
```

---

### Why Hono (not Express or Elysia)?

**Decision:** Hono framework

**Pros:**

- ✅ Multi-runtime (Bun, Deno, Node, Cloudflare)
- ✅ Mature, stable
- ✅ Express-like DX (easy to learn)
- ✅ Great Drizzle integration
- ✅ Fast performance

**Alternatives:**

- Elysia: Bun-first, faster, but smaller ecosystem and less mature
- Express: Mature but slower, not optimized for Bun

---

### Why PostgreSQL + Drizzle (not MongoDB)?

**Decision:** PostgreSQL with Drizzle ORM

**Pros:**

- ✅ Relational data (users, interviews, questions, answers)
- ✅ ACID compliance
- ✅ Drizzle is SQL-like (stays close to raw queries)
- ✅ Type-safe schema
- ✅ Better for structured interview data

**Why not MongoDB:**

- ❌ Overkill for this use case (no need for flexible schema)
- ❌ Relations between users/interviews/questions better in SQL

---

### Why AI-Evaluated Code (not Test Cases)?

**Decision:** AI evaluates code as text (no execution)

**Pros:**

- ✅ No security risks (no eval, no VM sandboxing)
- ✅ Can evaluate ANY language (Python, Java, JS)
- ✅ Partial credit (not just pass/fail)
- ✅ Provides detailed feedback
- ✅ Handles edge cases through reasoning

**Alternatives Rejected:**

- ❌ Test case execution: Security risks (eval, sandboxing complexity)
- ❌ Docker containers: Overkill for MVP

---

### Why Pre-generate Questions (not on-the-fly)?

**Decision:** Recruiter generates questions before publishing interview

**Pros:**

- ✅ Consistent difficulty across candidates
- ✅ Recruiter controls quality (review/edit)
- ✅ Reusable question bank
- ✅ Instant interview start (no AI wait time)
- ✅ Cost-efficient (generate once, reuse)
- ✅ Fair comparison (same questions for all)

**Problems with on-the-fly generation:**

- ❌ Inconsistent difficulty
- ❌ Candidate waits 5-10s per question
- ❌ Expensive (6 AI calls × 100 candidates)
- ❌ Hard to compare candidates

---

### Why Async Evaluation (not wait for AI)?

**Decision:** Background job evaluates answers after submission

**Pros:**

- ✅ Better UX (no waiting for AI response)
- ✅ Candidate moves to next question immediately
- ✅ Can use better/slower AI models without UX penalty
- ✅ Retries possible if AI call fails

**Flow:**

1. Candidate submits answer → Saved to DB immediately
2. Return success, load next question
3. Background job evaluates answer (5-15 seconds)
4. Recruiter sees results when all evaluations complete

---

### Why Vercel AI SDK?

**Decision:** Vercel AI SDK for all AI operations

**Pros:**

- ✅ Multi-provider support (OpenAI, Anthropic, Gemini)
- ✅ Streaming responses
- ✅ Structured outputs (Zod schemas)
- ✅ Tool calling support
- ✅ Easy to swap models
- ✅ Built-in error handling

**Use Cases:**

- Question generation (structured output)
- Resume parsing (field extraction)
- Answer evaluation (scoring + feedback)
- Final summary generation

---

### Why Cloudflare R2 for File Storage?

**Decision:** Cloudflare R2 for resume storage

**Pros:**

- ✅ S3-compatible API (easy to use)
- ✅ Lower egress costs than AWS S3
- ✅ Global CDN for fast file access
- ✅ Built-in security features
- ✅ Simple bucket management

**Alternatives Rejected:**

- ❌ Local file storage: Not scalable, deployment issues
- ❌ AWS S3: Higher costs for egress
- ❌ Database BLOB storage: Poor performance for large files

---

### Why In-Memory Job Queue (not Redis/BullMQ)?

**Decision:** Simple in-memory queue for background evaluation

**Pros:**

- ✅ No external dependencies
- ✅ Simpler deployment
- ✅ Handles MVP scale (100s of evaluations)
- ✅ Can upgrade to Redis/BullMQ later if needed

**When to Add Redis Later:**

- Need persistent job queues (survive server restarts)
- Scale beyond 1000s of concurrent evaluations
- Want advanced job retry/scheduling features

---

## Cost Analysis

### AI Costs per Interview

```
Question Generation (one-time per interview):
- 6 questions: ~$0.05 (gpt-4o)

Per Candidate Evaluation:
- 2 MCQ: $0 (auto-graded)
- 2 Short Answer: ~$0.002 (gpt-4o-mini)
- 2 Code: ~$0.02 (gpt-4o)
- Final Summary: ~$0.02 (gpt-4o)

Total per candidate: ~$0.04
For 100 candidates: ~$4
```

**Optimization:**

- Use gpt-4o-mini for short answers
- Use gpt-4o for code (needs reasoning)
- Cache questions (reuse across candidates)

---

## Development Tools

### Runtime & Package Manager

- **Bun**: JavaScript runtime (faster than Node.js)
- **pnpm**: Package manager (efficient, fast)

### Development

- **TypeScript**: Type safety throughout
- **Drizzle Kit**: Database migrations
- **Zod**: Schema validation (with Vercel AI SDK)

### Deployment

- **Frontend**: Vercel / Netlify
- **Backend**: Railway / Render / Fly.io
- **Database**: Neon / Supabase (PostgreSQL hosting)
