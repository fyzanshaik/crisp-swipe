# Crisp - AI-Powered Interview Assistant

## Project Overview

**Goal:** Build a React app that works as an AI-powered interview assistant for Swipe Internship Assignment.

### Core Requirements

#### Two-Tab Interface

- **Interviewee Tab (Chat)**: Candidate takes the interview
- **Interviewer Tab (Dashboard)**: Recruiter creates interviews and monitors candidates

Both tabs stay synced with real-time or periodic updates.

---

## User Roles & Flows

### Recruiter Flow

1. **Register/Login** as Recruiter
2. **Create Interview**
   - Give it a name/title
   - Set job role (Full Stack React/Node)
   - Add description
3. **Generate Questions** (AI-powered)
   - AI generates 6 questions: 2 Easy (MCQ) → 2 Medium (Short Answer) → 2 Hard (Code)
   - Review and edit questions
   - Reprompt specific questions if needed
   - Save to question bank
4. **Publish Interview**
   - **Public Mode**: Anyone (registered candidates) can access
   - **Private Mode**: Only assigned candidate emails can access
   - Set deadline
5. **Monitor Dashboard**
   - See all created interviews
   - Track candidate progress (not started/in progress/completed)
   - View individual results with AI feedback
   - Search/filter/sort candidates

### Candidate Flow

1. **Register/Login** as Candidate
2. **Dashboard**: See assigned/public interviews
3. **Start Interview**
   - Upload resume (PDF required, DOCX optional)
   - System extracts: Name, Email, Phone
   - If fields missing → Chatbot collects them
4. **Take Interview** (6 questions)
   - 2 Easy (MCQ, 20s each)
   - 2 Medium (Short Answer, 60s each)
   - 2 Hard (Code, 120s each)
   - Timer auto-submits when expired
   - Answers saved immediately
5. **Submit**: "Submitted! Check results later"
6. **Background**: AI evaluates answers asynchronously
7. **View Results**: Final score + AI summary on dashboard

---

## Key Features

### Resume Handling

- **First Interview**: Upload required
- **Subsequent Interviews**: Option to "Use previous resume" OR upload new
- **Extraction**: AI extracts Name, Email, Phone from PDF/DOCX
- **Validation**: Checks for missing fields before starting interview

### Interview System

- **Question Types**:
  - MCQ (Auto-graded, instant)
  - Short Answer (Hybrid: Keywords + AI)
  - Code (AI-evaluated, no execution)
- **Pre-generated Questions**: Recruiter generates and reviews before publishing
- **Question Bank**: Reusable questions, grows organically during testing
- **Consistent Evaluation**: All candidates get same questions

### Timer & Persistence

- **Server as Source of Truth**: All timestamps stored in PostgreSQL
- **Client Timer**: Calculates countdown locally for smooth UX
- **Pause/Resume**: "Welcome Back" modal restores progress
- **Cross-device**: Resume from any browser/device
- **Anti-cheat**: Server validates all timestamps

### Evaluation System

- **MCQ**: Exact match, instant scoring
- **Short Answer**: 50% keyword match + 50% AI semantic evaluation
- **Code**: AI evaluates logic, syntax, approach (no execution)
- **Final Summary**: AI generates holistic assessment with hiring recommendation

### Data Persistence

- **PostgreSQL**: All interview data, answers, timestamps (source of truth)
- **IndexedDB**: TanStack Query cache (survives refresh, fast UI)
- **Zustand**: Ephemeral state (timers, UI state)
- **Redis** (Optional later): AI response caching

---

## Publishing Modes

### Public Interview

- Any registered candidate can access
- Shows on all candidate dashboards
- No specific assignment needed

### Private Interview

- Only assigned candidate emails can access
- Recruiter manually adds candidate emails
- Candidates see only their assigned interviews

---

## Deliverables

1. ✅ Public GitHub repo + README
2. ✅ Live demo (Vercel/Netlify)
3. ✅ 2-5 minute demo video
4. ✅ Submit form: https://forms.gle/Yx5HGCQzHFmHF1wM6

---

## Notes from Assignment

- "We kept a few things ambiguous intentionally. Choose the best possible path to complete the assignment."
- Encouraged to use AI APIs wherever possible, with no restrictions
- Must be willing to relocate to Hyderabad for 6-month internship
- Must be able to start at least by December
