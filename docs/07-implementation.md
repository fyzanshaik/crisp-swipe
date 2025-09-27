# Implementation Timeline & Roadmap

---

## Phase 1: Foundation & Setup (Day 1-2)

### Day 1: Project Setup

**Backend:**

- [ ] Initialize Bun + Hono project
- [ ] Setup Drizzle ORM + PostgreSQL connection
- [ ] Create database schema (all tables)
- [ ] Run initial migration
- [ ] Setup JWT authentication middleware
- [ ] Create auth endpoints (register, login, me)

**Frontend:**

- [ ] Initialize Vite + React + TypeScript
- [ ] Setup TanStack Router
- [ ] Setup TanStack Query + IndexedDB persistence
- [ ] Setup Zustand store
- [ ] Install & configure Tailwind + shadcn/ui
- [ ] Create basic layout components

**Testing:**

- [ ] Test auth flow (register → login → protected route)
- [ ] Verify database connection and migrations

**Time Estimate:** 6-8 hours

---

### Day 2: Core Authentication & UI Foundation

**Backend:**

- [ ] Password hashing (bcrypt)
- [ ] JWT token generation & validation
- [ ] Role-based middleware (recruiter/candidate)
- [ ] Error handling middleware

**Frontend:**

- [ ] Login/Register pages
- [ ] Protected route wrapper
- [ ] Auth context/hooks
- [ ] Role-based navigation
- [ ] Recruiter dashboard skeleton
- [ ] Candidate dashboard skeleton

**Testing:**

- [ ] Test role-based access control
- [ ] Test token persistence & refresh on page reload

**Time Estimate:** 6-8 hours

---

## Phase 2: Question System (Day 2-3)

### Day 2 (continued): AI Question Generation

**Backend:**

- [ ] Vercel AI SDK setup
- [ ] POST /api/questions/generate endpoint
- [ ] Structured output schemas (Zod)
- [ ] Question generation prompts (MCQ, Short Answer, Code)
- [ ] POST /api/questions/regenerate endpoint
- [ ] POST /api/questions (save to bank)
- [ ] GET /api/questions (with filters)

**Frontend:**

- [ ] Question generation UI
- [ ] Review & edit questions interface
- [ ] Regenerate individual question
- [ ] Question bank browser
- [ ] Filter/search questions

**Testing:**

- [ ] Generate 6 questions for Full Stack role
- [ ] Verify all question types (MCQ, Short Answer, Code)
- [ ] Test regeneration with feedback

**Time Estimate:** 4-6 hours

---

### Day 3: Interview Creation Flow

**Backend:**

- [ ] POST /api/interviews endpoint
- [ ] PUT /api/interviews/:id/publish endpoint
- [ ] GET /api/interviews (recruiter's interviews)
- [ ] GET /api/interviews/:id (with questions)
- [ ] Validation for question assignment

**Frontend:**

- [ ] Create interview form
- [ ] Select/generate questions
- [ ] Publishing modes (public/private)
- [ ] Assign candidate emails
- [ ] Set deadline
- [ ] Interview list view (recruiter)
- [ ] Interview detail view

**Testing:**

- [ ] Create interview with 6 questions
- [ ] Publish as public
- [ ] Publish as private with assigned emails
- [ ] Verify question order

**Time Estimate:** 6-8 hours

---

## Phase 3: Interview Flow & Timer System (Day 3-4)

### Day 3 (continued): Resume Upload & Parsing

**Backend:**

- [ ] File upload middleware (multipart/form-data)
- [ ] Resume storage (filesystem or cloud)
- [ ] AI-based field extraction (name, email, phone)
- [ ] POST /api/resumes/upload endpoint
- [ ] GET /api/resumes/latest endpoint

**Frontend:**

- [ ] Resume upload component
- [ ] Drag & drop file upload
- [ ] Show extracted fields
- [ ] Missing field collection form
- [ ] Reuse previous resume option

**Testing:**

- [ ] Upload PDF resume
- [ ] Upload DOCX resume
- [ ] Verify field extraction accuracy
- [ ] Test missing field collection flow

**Time Estimate:** 4-5 hours

---

### Day 4: Interview Session & Timer

**Backend:**

- [ ] POST /api/interviews/:id/start endpoint
- [ ] Create interview_session record
- [ ] Return questions (without answers)
- [ ] GET /api/interviews/active endpoint
- [ ] Calculate elapsed time & remaining time
- [ ] Server-side timestamp validation

**Frontend:**

- [ ] Start interview button
- [ ] Interview question display
- [ ] Timer component (countdown)
- [ ] Zustand timer state management
- [ ] Auto-submit on timer expiry
- [ ] Progress indicator (Question X of 6)

**Testing:**

- [ ] Start interview, verify timer starts
- [ ] Test timer accuracy (countdown)
- [ ] Test auto-submit when timer expires
- [ ] Refresh page mid-interview, verify timer resumes correctly

**Time Estimate:** 6-8 hours

---

### Day 4 (continued): Answer Submission & Resume

**Backend:**

- [ ] POST /api/interviews/:sessionId/answers endpoint
- [ ] Save answer to database
- [ ] Validate question index & timestamp
- [ ] Update session progress
- [ ] Return next question or completion
- [ ] Queue background evaluation job

**Frontend:**

- [ ] Answer input (based on question type)
- [ ] Submit answer button
- [ ] Move to next question
- [ ] "Welcome Back" modal for resume
- [ ] Calculate remaining time on resume
- [ ] Handle time expired while away

**Testing:**

- [ ] Submit all 6 answers
- [ ] Verify server validates timestamps
- [ ] Refresh mid-interview, verify resume works
- [ ] Test cross-device resume (different browser)

**Time Estimate:** 4-6 hours

---

## Phase 4: Evaluation System (Day 4-5)

### Day 5: Background Evaluation

**Backend:**

- [ ] Background job queue setup (BullMQ or simple queue)
- [ ] MCQ auto-grading function
- [ ] Short answer evaluation (keyword + AI)
- [ ] Code evaluation (AI-based)
- [ ] Update answer with score & feedback
- [ ] Check if all answers evaluated
- [ ] Trigger final summary generation

**Frontend:**

- [ ] "Evaluating..." UI state
- [ ] Poll for evaluation completion (optional)
- [ ] Show "Check results later" message

**Testing:**

- [ ] Complete interview, verify background evaluation
- [ ] Check MCQ auto-grading (instant)
- [ ] Check short answer hybrid evaluation
- [ ] Check code AI evaluation
- [ ] Verify all scores saved correctly

**Time Estimate:** 6-8 hours

---

### Day 5 (continued): Final Summary Generation

**Backend:**

- [ ] Generate final summary with AI
- [ ] Calculate total score & percentage
- [ ] Hiring recommendation (Strong Hire/Hire/Maybe/No Hire)
- [ ] Update session with final results
- [ ] GET /api/interviews/:sessionId/results endpoint

**Frontend:**

- [ ] Results page (candidate view)
- [ ] Score display (with percentage)
- [ ] AI summary display
- [ ] Detailed feedback per question
- [ ] Strengths & improvements

**Testing:**

- [ ] Complete interview, wait for evaluation
- [ ] View results page
- [ ] Verify AI summary quality
- [ ] Check detailed feedback per question

**Time Estimate:** 4-5 hours

---

## Phase 5: Dashboards & Results (Day 5-6)

### Day 6: Recruiter Dashboard

**Backend:**

- [ ] GET /api/interviews/:id/candidates endpoint
- [ ] Sorting (by score, completion time)
- [ ] Filtering (by status)
- [ ] Search (by name/email)
- [ ] GET /api/interviews/:id/candidates/:sessionId endpoint (detailed view)

**Frontend:**

- [ ] Recruiter dashboard layout
- [ ] Interview list with stats
- [ ] Candidate list (sortable table)
- [ ] Search bar & filters
- [ ] Detailed candidate view (modal or page)
- [ ] Chat history display
- [ ] Score breakdown per question
- [ ] Export results (optional)

**Testing:**

- [ ] Create multiple interviews
- [ ] Have multiple candidates complete interviews
- [ ] Test sorting by score
- [ ] Test search functionality
- [ ] View detailed candidate results

**Time Estimate:** 6-8 hours

---

### Day 6 (continued): Candidate Dashboard

**Backend:**

- [ ] GET /api/candidate/interviews endpoint
- [ ] Filter by status (available/completed/expired)
- [ ] Check interview eligibility (public or assigned)

**Frontend:**

- [ ] Candidate dashboard layout
- [ ] Assigned/public interview cards
- [ ] Status badges (upcoming/available/completed/expired)
- [ ] "Start Interview" button
- [ ] Completed interview results
- [ ] Interview deadline display

**Testing:**

- [ ] View available interviews as candidate
- [ ] Start interview from dashboard
- [ ] Complete interview, see it in completed section
- [ ] Test expired interview handling

**Time Estimate:** 4-5 hours

---

## Phase 6: Polish & Deployment (Day 6-7)

### Day 7: Error Handling & Edge Cases

**Backend:**

- [ ] Comprehensive error handling
- [ ] Validation errors (Zod)
- [ ] Database error handling
- [ ] AI API error handling & retries
- [ ] Rate limiting (optional)

**Frontend:**

- [ ] Error boundaries
- [ ] Toast notifications (success/error)
- [ ] Loading states (skeletons)
- [ ] Empty states
- [ ] 404 page
- [ ] Network error handling

**Testing:**

- [ ] Test all error scenarios
- [ ] Test offline behavior
- [ ] Test API failures
- [ ] Test validation errors

**Time Estimate:** 4-5 hours

---

### Day 7 (continued): Responsive Design & UX

**Frontend:**

- [ ] Mobile responsive design
- [ ] Tablet layout
- [ ] Accessibility (keyboard navigation, ARIA labels)
- [ ] Smooth animations/transitions
- [ ] Consistent spacing & typography
- [ ] Dark mode (optional)

**Testing:**

- [ ] Test on mobile devices
- [ ] Test on different screen sizes
- [ ] Keyboard navigation test
- [ ] Screen reader test (basic)

**Time Estimate:** 3-4 hours

---

### Day 7 (evening): Deployment

**Backend:**

- [ ] Setup PostgreSQL on cloud (Neon/Supabase/Railway)
- [ ] Environment variables configuration
- [ ] Deploy to Railway/Render/Fly.io
- [ ] Test production API

**Frontend:**

- [ ] Environment variables (API URL)
- [ ] Build optimization
- [ ] Deploy to Vercel/Netlify
- [ ] Connect to production API

**Database:**

- [ ] Run production migrations
- [ ] Seed demo data (optional)

**Testing:**

- [ ] End-to-end test in production
- [ ] Test recruiter flow (create interview)
- [ ] Test candidate flow (take interview)
- [ ] Performance check

**Time Estimate:** 2-3 hours

---

## Day 7 (final): Documentation & Demo

### README.md

- [ ] Project overview
- [ ] Tech stack
- [ ] Setup instructions (local)
- [ ] Environment variables
- [ ] Database setup
- [ ] Running the app
- [ ] API documentation link
- [ ] Screenshots

### Demo Video (2-5 minutes)

- [ ] Script preparation
- [ ] Record recruiter flow:
  - Login
  - Generate questions
  - Create interview
  - Publish interview
  - Monitor candidates
- [ ] Record candidate flow:
  - Login
  - Upload resume
  - Take interview
  - View results
- [ ] Record recruiter viewing results
- [ ] Edit & compress video
- [ ] Upload to YouTube/Loom

### Submission

- [ ] GitHub repo link
- [ ] Live demo URL
- [ ] Demo video URL
- [ ] Submit form: https://forms.gle/Yx5HGCQzHFmHF1wM6

**Time Estimate:** 3-4 hours

---

## Total Time Estimate: 60-75 hours (6-7 days of full-time work)

---

## Critical Path (Minimum Viable Product)

If time is constrained, focus on this critical path:

### Must-Have (MVP):

1. ✅ Auth (login/register)
2. ✅ Question generation (AI)
3. ✅ Create interview
4. ✅ Upload resume & extract fields
5. ✅ Take interview (6 questions with timers)
6. ✅ Submit answers
7. ✅ Evaluation (AI)
8. ✅ Results page (candidate)
9. ✅ Recruiter dashboard (view candidates & scores)
10. ✅ Deployment

### Nice-to-Have (If Time Permits):

- Question bank browser
- Regenerate specific questions
- Detailed candidate view with chat history
- Search/filter on dashboards
- Export results
- Real-time updates (Socket.io)
- Dark mode

### Can Skip for MVP:

- Redis caching
- Rate limiting
- Refresh tokens
- Email notifications
- Advanced analytics

---

## Risk Mitigation

### Potential Blockers:

1. **AI API Rate Limits:** Use gpt-4o-mini where possible, cache responses
2. **Resume Parsing Accuracy:** Have manual field collection as fallback
3. **Timer Sync Issues:** Always trust server timestamp, validate on backend
4. **Deployment Issues:** Test deployment early (Day 5-6)
5. **Complex UI:** Use shadcn/ui for pre-built components

### Mitigation Strategies:

- Test AI integration early (Day 2)
- Build incrementally, test frequently
- Have fallback plans (e.g., manual question entry if AI fails)
- Use established libraries (TanStack, Hono) to avoid custom bugs
- Deploy to staging environment before final deployment

---

## Daily Checklist

### Every Day:

- [ ] Git commit regularly (feature branches)
- [ ] Test new features immediately
- [ ] Update README with setup instructions
- [ ] Document any blockers/decisions
- [ ] Keep demo video script notes

### End of Each Phase:

- [ ] Integration test (frontend + backend)
- [ ] Code review/cleanup
- [ ] Update project status
- [ ] Plan next phase

---

## Success Metrics

### Technical:

- ✅ All core features working
- ✅ No critical bugs
- ✅ Responsive design
- ✅ 90%+ API uptime
- ✅ < 3s page load time

### User Experience:

- ✅ Smooth interview flow (no hiccups)
- ✅ Accurate timer & resume functionality
- ✅ Clear AI feedback
- ✅ Intuitive dashboards

### Demo Quality:

- ✅ Professional demo video
- ✅ Clean, bug-free live demo
- ✅ Comprehensive README
- ✅ Well-documented code
