# Crisp - Development Progress Notes

## Project Overview
AI-powered interview platform with two roles: **Recruiters** (create interviews) and **Candidates** (take interviews). Built with React frontend + Hono backend + PostgreSQL.

**Key Files to Read for Context:**
- `docs/01-project-overview.md` - Complete requirements
- `docs/02-tech-stack.md` - Architecture decisions
- `docs/04-interview-flow-persistence.md` - Timer system design
- `docs/03-question-evaluation-system.md` - AI evaluation approach
- `server/db/schema.ts` - Database structure
- `server/app.ts` - Route mounting
- `server/routes/candidate.ts` - Current candidate implementation

## Ground Rules (CRITICAL - FOLLOW ALWAYS)
1. **No comments in code** unless explicitly asked
2. **Start small, test each step** - validate before continuing
3. **Use 2025 docs** for any library - ask user for docs if type errors
4. **Manual test-driven** - let user test significant changes
5. **Check AI files** when implementing AI features
6. **Incremental approach** - one endpoint at a time
7. **TypeScript strict** - fix type errors immediately

## Current Status

### ✅ COMPLETED
**Recruiter System**: Fully functional (dashboard, interviews, questions, candidates)

**Candidate System - Phase 1 (Interview Access & Starting):**
1. **Authentication**: `candidate-auth.ts` middleware working
2. **Dashboard**: `GET /candidate/dashboard` - shows available interviews
3. **Resume Management**: Upload, AI extraction (PDF/DOCX), chatbot completion
4. **Resume Verification**: Complete conversational flow with regex extraction
5. **Interview Details**: `GET /interviews/:id/details` - access control, question summary
6. **Resume Check**: `GET /interviews/:id/resume-check` - validates resume requirements
7. **Start Interview**: `POST /interviews/:id/start` - creates session with questions
8. **Session Recovery**: `GET /interviews/active` - calculates timer state from server

### 🎯 ACTIVE SESSION
**Live Interview Session**: `dfa4d527-e18d-4647-986e-3442bdec5373`
- Started: Question 1/6 (MCQ, 20s limit)
- Timer: 11 seconds remaining (server-calculated)
- User: `swipeuser@gmail.com` (password: `11111111`)

## Key Implementation Notes

### Resume AI Extraction
- **Issue**: Vercel AI SDK models compatibility - Cerebras/Groq don't support file processing
- **Solution**: Use GPT-4o/Gemini models for file operations
- **Location**: `server/utils/ai-integration.ts:extractResumeData()`

### Chatbot Flow
- **Issue**: AI generateObject was returning schema instead of data
- **Solution**: Replaced with deterministic regex extraction
- **Location**: `server/utils/ai-integration.ts:processChatbotMessage()`

### Session Management
- **Timer Logic**: Server timestamps as source of truth, client calculates countdown
- **Anti-cheat**: All time validation happens server-side
- **Cross-device**: Session recovery works perfectly via server state

## Next Phase: Taking the Interview (Phase 2)

### 🔄 TODO - Answer Submission System
1. **Answer Endpoint**: `POST /interviews/:sessionId/answers`
   - Validate session token & timing
   - Save answer, update question index
   - Return next question or completion
2. **Timer Validation**: Server-side anti-cheat logic
3. **Auto-submission**: Handle time expiry scenarios
4. **Session State**: Cross-device persistence

### Key Requirements
- **Server validates ALL timestamps** (prevent cheating)
- **Atomic operations** (answer save + progress update)
- **Background evaluation** (don't block user flow)
- **Session locking** (prevent concurrent access)

## Database Schema Key Points
- `interview_sessions`: Tracks progress, timestamps, locks
- `answers`: Stores responses with evaluation status
- `resumes`: AI extraction + manual completion support
- **Unique constraints**: Prevent duplicate sessions/answers

## AI Integration
- **Question Generation**: Working (recruiters)
- **Resume Extraction**: Working with file processing models
- **Evaluation System**: Ready for Phase 3 (MCQ auto-grade, AI for short/code)

## Error Patterns to Avoid
1. **Model Compatibility**: Always check if model supports required features
2. **Type Safety**: Fix TS errors immediately, don't ignore
3. **JSON Parsing**: Always wrap in try-catch for request bodies
4. **Database Returns**: Check array length before accessing [0]
5. **Timer Logic**: Never trust client timestamps

## Testing Approach
**Manual curl testing** with saved cookies works perfectly. User credentials and session are ready for continuing development.

## Project Structure
```
server/
├── routes/candidate.ts    # Current work - Phase 1 complete
├── routes/recruiter.ts    # Fully functional
├── middleware/            # Auth working
├── utils/ai-integration.ts # Resume + chatbot working
└── db/schema.ts          # Complete schema

frontend/ (not started)
docs/ (comprehensive planning)
```

Continue from Phase 2: Answer submission system. Session is live and ready for testing answer flow.