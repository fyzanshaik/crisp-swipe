# API Endpoints Structure

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.crisp-interview.com/api
```

---

## Authentication

### POST /api/auth/register

**Register new user (candidate or recruiter)**

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "candidate" // or "recruiter"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "candidate"
  },
  "token": "jwt_token_here"
}
```

---

### POST /api/auth/login

**Login existing user**

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "candidate"
  },
  "token": "jwt_token_here"
}
```

---

### GET /api/auth/me

**Get current user profile**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "candidate",
  "createdAt": "2025-09-27T10:00:00Z"
}
```

---

## Resume Management

### POST /api/resumes/upload

**Upload and process resume with AI verification**

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request:**

```
FormData:
- file: <pdf/docx file>
```

**Response (201) - Fully Verified:**

```json
{
  "resume_id": "uuid",
  "file_name": "resume.pdf",
  "verification_result": {
    "is_resume": true,
    "status": "verified",
    "verified_data": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "verification_method": "ai_only",
    "message": "✅ Resume verified successfully! You can now start interviews."
  }
}
```

**Response (201) - Needs Manual Input:**

```json
{
  "resume_id": "uuid",
  "file_name": "resume.pdf", 
  "verification_result": {
    "is_resume": true,
    "status": "needs_manual",
    "extracted_data": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": null
    },
    "missing_fields": ["phone"],
    "chat_session_id": "chat-uuid",
    "chat_message": "I found your resume and extracted your name (John Doe) and email (john@example.com), but I couldn't find your phone number. Please provide your phone number:"
  }
}
```

**Response (400) - Not a Resume:**

```json
{
  "error": {
    "code": "NOT_RESUME",
    "message": "This doesn't appear to be a resume. Please upload your CV/resume as a PDF file.",
    "document_type": "invoice"
  }
}
```

---

### POST /api/resumes/:id/chat

**Chatbot manual input for missing resume fields**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "chat_session_id": "chat-uuid",
  "user_message": "+1-555-123-4567"
}
```

**Response (200) - Verification Successful:**

```json
{
  "chat_session_id": "chat-uuid",
  "ai_message": "Perfect! Let me verify all your information:",
  "verification_attempt": {
    "final_data": {
      "name": "John Doe",
      "email": "john@example.com", 
      "phone": "+15551234567"
    },
    "is_verified": true,
    "verification_method": "ai_plus_manual",
    "message": "✅ Your resume is now verified! You can start the interview."
  }
}
```

**Response (200) - Validation Failed:**

```json
{
  "chat_session_id": "chat-uuid", 
  "ai_message": "The phone number format doesn't look quite right. Please provide a valid phone number (e.g., +1-555-123-4567):",
  "verification_attempt": {
    "is_verified": false,
    "retry_count": 1,
    "max_retries": 3,
    "error": "Invalid phone format"
  }
}
```

**Response (400) - Max Retries Reached:**

```json
{
  "error": {
    "code": "MAX_RETRIES_REACHED",
    "message": "Unable to verify resume after multiple attempts. Please try uploading a different resume.",
    "retry_count": 3
  }
}
```

---

### GET /api/resumes/user-resumes

**Get user's verified resumes**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "resumes": [
    {
      "id": "resume-1",
      "file_name": "john-resume-v1.pdf",
      "extracted_name": "John Doe",
      "extracted_email": "john@example.com", 
      "extracted_phone": "+1234567890",
      "verification_method": "ai_only",
      "uploaded_at": "2025-09-27T10:00:00Z",
      "verified_at": "2025-09-27T10:00:15Z"
    },
    {
      "id": "resume-2", 
      "file_name": "john-updated-resume.pdf",
      "extracted_name": "John Doe",
      "extracted_email": "john.doe@example.com",
      "extracted_phone": "+1555123456",
      "verification_method": "ai_plus_manual",
      "uploaded_at": "2025-09-28T15:00:00Z",
      "verified_at": "2025-09-28T15:02:30Z"
    }
  ]
}
```

---

### DELETE /api/resumes/:id

**Delete a resume**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

**Response (409) - Resume In Use:**

```json
{
  "error": {
    "code": "RESUME_IN_USE",
    "message": "Cannot delete resume - it's being used in active interview sessions"
  }
}
```

---

### GET /api/resumes/latest

**Get user's most recent resume**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "id": "uuid",
  "fileName": "resume.pdf",
  "extractedData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "uploadedAt": "2025-09-27T10:00:00Z"
}
```

---

## Questions (Recruiter Only)

### GET /api/questions/bank

**Browse existing questions in question bank**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

```
?difficulty=easy&category=React&type=mcq&limit=20&offset=0
```

**Response (200):**

```json
{
  "questions": [
    {
      "id": "q-uuid-1",
      "type": "mcq",
      "difficulty": "easy",
      "category": "React",
      "question_text": "What is useState used for?",
      "options": ["State management", "Side effects", "Context", "Routing"],
      "correct_answer": "State management",
      "time_limit": 20,
      "points": 10,
      "created_at": "2025-09-27T10:00:00Z"
    }
    // ... more questions
  ],
  "total": 45,
  "categories": ["React", "Node.js", "JavaScript", "Database"],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

### POST /api/questions/generate

**Generate 6 questions using AI**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "role": "Full Stack Developer",
  "technologies": ["React", "Node.js", "PostgreSQL"],
  "count": {
    "easy": 2,
    "medium": 2,
    "hard": 2
  },
  "existing_questions": ["q-uuid-1", "q-uuid-2"]
}
```

**Response (200):**

```json
{
  "questions": [
    {
      "type": "mcq",
      "difficulty": "easy", 
      "category": "React",
      "question_text": "What is useState used for?",
      "options": ["State management", "Side effects", "Context", "Routing"],
      "correct_answer": "State management",
      "time_limit": 20,
      "points": 10
    },
    {
      "type": "short_answer",
      "difficulty": "medium",
      "category": "JavaScript",
      "question_text": "Explain closures in JavaScript",
      "expected_keywords": ["scope", "function", "variable", "lexical"],
      "min_words": 30,
      "max_words": 100,
      "time_limit": 60,
      "points": 20
    }
    // ... 4 more questions
  ],
  "total_estimated_time": 400
}
```

---

### POST /api/questions/:id/edit

**Edit/regenerate a specific question**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "current_question": {
    "type": "short_answer",
    "difficulty": "medium",
    "question_text": "Explain React hooks",
    "expected_keywords": ["useState", "useEffect", "lifecycle"],
    "time_limit": 60,
    "points": 20
  },
  "edit_prompt": "Make it more focused on async/await and Promises"
}
```

**Response (200):**

```json
{
  "question": {
    "type": "short_answer",
    "difficulty": "medium",
    "category": "JavaScript",
    "question_text": "Explain async/await and how it relates to Promises in JavaScript",
    "expected_keywords": ["async", "await", "promise", "asynchronous", "callback"],
    "min_words": 30,
    "max_words": 120,
    "time_limit": 60,
    "points": 20
  }
}
```

---

### POST /api/questions

**Save question to bank**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "type": "mcq",
  "difficulty": "easy",
  "category": "React",
  "questionText": "What is useState?",
  "options": ["...", "...", "...", "..."],
  "correctAnswer": "...",
  "timeLimit": 20,
  "points": 10
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "type": "mcq",
  "difficulty": "easy",
  // ... all fields
  "createdAt": "2025-09-27T10:00:00Z"
}
```

---

### GET /api/questions

**Get question bank with filters**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Params:**

```
?difficulty=medium
&category=React
&type=mcq
&limit=20
&offset=0
```

**Response (200):**

```json
{
  "questions": [
    {
      "id": "uuid",
      "type": "mcq",
      "difficulty": "medium"
      // ... question fields
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

## Interviews (Recruiter)

### POST /api/interviews

**Create new interview**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "title": "Frontend Developer Interview",
  "description": "Interview for senior frontend position",
  "job_role": "Full Stack Developer",
  "is_public": false,
  "assigned_emails": ["candidate1@example.com", "candidate2@example.com"],
  "deadline": "2025-10-15T23:59:59Z"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "title": "Frontend Developer Interview",
  "status": "draft",
  "createdAt": "2025-09-27T10:00:00Z"
}
```

---

### POST /api/interviews/:id/assign-questions

**Assign questions to interview**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "question_ids": ["q-uuid-1", "q-uuid-2", "q-uuid-3", "q-uuid-4", "q-uuid-5", "q-uuid-6"],
  "points_override": {
    "q-uuid-1": 15,
    "q-uuid-3": 25
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "assigned_questions": [
    {
      "question_id": "q-uuid-1",
      "order_index": 0,
      "points": 15
    },
    {
      "question_id": "q-uuid-2", 
      "order_index": 1,
      "points": 10
    }
    // ... 4 more
  ],
  "total_estimated_time": 420
}
```

---

### PUT /api/interviews/:id/publish

**Publish interview**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "id": "uuid",
  "title": "Frontend Developer Interview",
  "status": "published",
  "publishedAt": "2025-09-27T10:00:00Z"
}
```

---

### GET /api/interviews

**Get all interviews created by recruiter**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Params:**

```
?status=published
&limit=20
&offset=0
```

**Response (200):**

```json
{
  "interviews": [
    {
      "id": "uuid",
      "title": "Frontend Developer Interview",
      "jobRole": "Full Stack Developer",
      "status": "published",
      "totalCandidates": 15,
      "completedCandidates": 8,
      "createdAt": "2025-09-27T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

### GET /api/interviews/:id

**Get interview details with questions**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "id": "uuid",
  "title": "Frontend Developer Interview",
  "description": "...",
  "jobRole": "Full Stack Developer",
  "isPublic": false,
  "assignedEmails": ["..."],
  "deadline": "2025-10-15T23:59:59Z",
  "status": "published",
  "questions": [
    {
      "id": "uuid",
      "orderIndex": 0,
      "points": 10,
      "question": {
        "type": "mcq",
        "questionText": "..."
        // ... full question
      }
    }
    // ... 5 more
  ],
  "createdAt": "2025-09-27T10:00:00Z"
}
```

---

### GET /api/interviews/:id/candidates

**Get all candidates for interview (Recruiter Dashboard)**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Params:**

```
?status=completed
&sortBy=score
&order=desc
&search=john
```

**Response (200):**

```json
{
  "candidates": [
    {
      "sessionId": "uuid",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "completed",
      "finalScore": 95,
      "percentage": 79.17,
      "completedAt": "2025-09-27T11:30:00Z",
      "aiSummary": "Strong technical skills..."
    }
  ],
  "total": 15
}
```

---

### GET /api/interviews/:id/candidates/:sessionId

**Get detailed candidate results**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "session": {
    "id": "uuid",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "finalScore": 95,
    "percentage": 79.17,
    "aiSummary": "Strong technical skills...",
    "startedAt": "2025-09-27T11:00:00Z",
    "completedAt": "2025-09-27T11:30:00Z"
  },
  "answers": [
    {
      "question": {
        "questionText": "What is useState?",
        "type": "mcq",
        "difficulty": "easy"
      },
      "answerText": "State management hook",
      "score": 10,
      "timeTaken": 15,
      "feedback": {
        "overall_feedback": "Correct!"
      }
    }
    // ... 5 more answers
  ]
}
```

---

## Interviews (Candidate)

### GET /api/candidate/interviews

**Get available interviews for candidate**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "interviews": [
    {
      "id": "uuid",
      "title": "Frontend Developer Interview",
      "jobRole": "Full Stack Developer",
      "deadline": "2025-10-15T23:59:59Z",
      "status": "available", // available | completed | expired
      "session": {
        "status": "not_started" // or "in_progress" | "completed"
      }
    }
  ]
}
```

---

### GET /api/interviews/:id/resume-check

**Check if user can start interview (has verified resume)**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "can_start_interview": true,
  "existing_resumes": [
    {
      "id": "resume-1",
      "file_name": "john-resume-v1.pdf",
      "extracted_name": "John Doe",
      "extracted_email": "john@example.com", 
      "extracted_phone": "+1234567890",
      "uploaded_at": "2025-09-27T10:00:00Z",
      "is_verified": true
    }
  ],
  "needs_upload": false
}
```

**Response (200) - No verified resumes:**

```json
{
  "can_start_interview": false,
  "existing_resumes": [],
  "needs_upload": true,
  "message": "Please upload and verify your resume before starting the interview"
}
```

---

### POST /api/interviews/:id/start

**Start interview with verified resume (creates session with locking)**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "resume_id": "uuid"
}
```

**Response (200):**

```json
{
  "session_id": "uuid",
  "session_token": "unique-session-token",
  "started_at": "2025-09-27T11:00:00Z",
  "locked_until": "2025-09-27T14:00:00Z",
  "questions": [
    {
      "id": "uuid",
      "type": "mcq",
      "question_text": "...",
      "options": ["...", "...", "...", "..."],
      "time_limit": 20
    }
    // ... 5 more (without answers!)
  ],
  "time_limits": [20, 20, 60, 60, 120, 120],
  "server_time": "2025-09-27T11:00:00.523Z"
}
```

**Response (409) - Already in progress:**

```json
{
  "error": {
    "code": "INTERVIEW_IN_PROGRESS", 
    "message": "Interview already in progress in another session",
    "active_session_id": "existing-session-uuid"
  }
}
```

**Response (400) - No verified resume:**

```json
{
  "error": {
    "code": "NO_VERIFIED_RESUME",
    "message": "Cannot start interview - no verified resume provided"
  }
}
```

---

### GET /api/interviews/active

**Check for active interview session**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "activeSession": {
    "id": "uuid",
    "interviewId": "uuid",
    "startedAt": "2025-09-27T11:00:00Z",
    "currentQuestionIndex": 2,
    "questions": [/* all questions */],
    "timeLimits": [20, 20, 60, 60, 120, 120],
    "answers": [/* previously submitted answers */],
    "serverTime": "2025-09-27T11:03:45.123Z"
  }
}
// or
{
  "activeSession": null
}
```

---

### POST /api/interviews/:sessionId/answers

**Submit answer to question**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "session_token": "unique-session-token",
  "question_index": 0,
  "answer": "useState",
  "submitted_at": "2025-09-27T11:00:18Z",
  "time_expired": false
}
```

**Response (200):**

```json
{
  "success": true,
  "nextQuestionIndex": 1,
  "nextQuestion": {
    "id": "uuid",
    "type": "mcq",
    "questionText": "...",
    "options": ["...", "...", "...", "..."],
    "timeLimit": 20
  },
  "timeLimit": 20,
  "serverTime": "2025-09-27T11:00:18.523Z"
}
// or if completed
{
  "success": true,
  "completed": true,
  "message": "Interview completed! Results will be available soon."
}
```

---

### GET /api/interviews/:sessionId/results

**Get interview results (after completion)**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "session": {
    "id": "uuid",
    "finalScore": 95,
    "maxScore": 120,
    "percentage": 79.17,
    "aiSummary": "Strong technical skills with good problem-solving ability...",
    "completedAt": "2025-09-27T11:30:00Z"
  },
  "answers": [
    {
      "question": {
        "questionText": "What is useState?",
        "type": "mcq",
        "difficulty": "easy"
      },
      "answerText": "useState",
      "score": 10,
      "feedback": "Correct!",
      "timeTaken": 15
    }
    // ... 5 more
  ]
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // optional additional context
  }
}
```

### Common Error Codes

**400 Bad Request:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

**401 Unauthorized:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden:**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  }
}
```

**404 Not Found:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**409 Conflict:**

```json
{
  "error": {
    "code": "INTERVIEW_IN_PROGRESS",
    "message": "Interview already in progress in another session"
  }
}
```

**422 Unprocessable Entity:**

```json
{
  "error": {
    "code": "INVALID_SUBMISSION_TIME",
    "message": "Answer submitted outside allowed time window"
  }
}
```

**500 Internal Server Error:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong on our end"
  }
}
```

---

## Rate Limiting

### Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633024800
```

### Limits

- Authentication endpoints: 5 requests/minute
- Question generation: 10 requests/hour
- Other endpoints: 100 requests/minute

### Rate Limit Exceeded (429)

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## Pagination

### Query Parameters

```
?limit=20      // Items per page (default: 20, max: 100)
&offset=0      // Skip N items (default: 0)
```

### Response Format

```json
{
  "data": [
    /* items */
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Filtering & Sorting

### Common Query Parameters

**Filtering:**

```
?status=completed
&difficulty=medium
&category=React
&search=javascript
```

**Sorting:**

```
?sortBy=score         // Field to sort by
&order=desc           // asc or desc (default: desc)
```

**Combined Example:**

```
GET /api/interviews/123/candidates?status=completed&sortBy=score&order=desc&limit=20
```

---

## WebSocket Events (Future Enhancement)

### Connection

```javascript
const socket = io("wss://api.crisp-interview.com", {
  auth: { token: jwtToken },
});
```

### Events

**Recruiter subscribes to interview:**

```javascript
socket.emit("subscribe:interview", { interviewId: "uuid" });
```

**Candidate status update:**

```javascript
socket.on("candidate:started", (data) => {
  // { candidateId, candidateName, startedAt }
});

socket.on("candidate:completed", (data) => {
  // { candidateId, candidateName, score, percentage, completedAt }
});
```

**Real-time progress:**

```javascript
socket.on("candidate:progress", (data) => {
  // { candidateId, currentQuestion, questionsCompleted }
});
```

---

## Hono Route Structure

### Implementation Example

```typescript
import { Hono } from "hono";
import { jwt } from "hono/jwt";

const app = new Hono();

// Middleware
const authMiddleware = jwt({
  secret: process.env.JWT_SECRET!,
});

const recruiterOnly = async (c, next) => {
  const user = c.get("jwtPayload");
  if (user.role !== "recruiter") {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Recruiter only" } },
      403,
    );
  }
  await next();
};

// Auth routes
const auth = new Hono();
auth.post("/register", registerHandler);
auth.post("/login", loginHandler);
auth.get("/me", authMiddleware, getMeHandler);

// Resume routes
const resumes = new Hono();
resumes.use("/*", authMiddleware);
resumes.post("/upload", uploadResumeHandler);
resumes.get("/latest", getLatestResumeHandler);

// Question routes (recruiter only)
const questions = new Hono();
questions.use("/*", authMiddleware, recruiterOnly);
questions.post("/generate", generateQuestionsHandler);
questions.post("/regenerate", regenerateQuestionHandler);
questions.post("/", createQuestionHandler);
questions.get("/", getQuestionsHandler);

// Interview routes
const interviews = new Hono();
interviews.use("/*", authMiddleware);

// Recruiter endpoints
interviews.post("/", recruiterOnly, createInterviewHandler);
interviews.put("/:id/publish", recruiterOnly, publishInterviewHandler);
interviews.get("/", recruiterOnly, getRecruiterInterviewsHandler);
interviews.get("/:id", getInterviewDetailsHandler);
interviews.get("/:id/candidates", recruiterOnly, getCandidatesHandler);
interviews.get(
  "/:id/candidates/:sessionId",
  recruiterOnly,
  getCandidateDetailsHandler,
);

// Candidate endpoints
const candidate = new Hono();
candidate.use("/*", authMiddleware);
candidate.get("/interviews", getCandidateInterviewsHandler);

interviews.post("/:id/start", startInterviewHandler);
interviews.get("/active", getActiveSessionHandler);
interviews.post("/:sessionId/answers", submitAnswerHandler);
interviews.get("/:sessionId/results", getResultsHandler);

// Mount routes
app.route("/api/auth", auth);
app.route("/api/resumes", resumes);
app.route("/api/questions", questions);
app.route("/api/interviews", interviews);
app.route("/api/candidate", candidate);

export default app;
```

---

## Request/Response Flow Examples

### Complete Interview Flow (API Calls)

**1. Candidate Login**

```
POST /api/auth/login
→ Receive JWT token
```

**2. Check Available Interviews**

```
GET /api/candidate/interviews
→ See list of assigned/public interviews
```

**3. Start Interview**

```
POST /api/interviews/abc-123/start
→ Create session, receive questions
```

**4. Submit Answers (6 times)**

```
POST /api/interviews/session-456/answers
{ questionIndex: 0, answer: "useState" }
→ Receive next question

POST /api/interviews/session-456/answers
{ questionIndex: 1, answer: "useEffect" }
→ Receive next question

... (repeat for all 6 questions)

POST /api/interviews/session-456/answers
{ questionIndex: 5, answer: "function debounce..." }
→ { completed: true }
```

**5. View Results**

```
GET /api/interviews/session-456/results
→ Final score, AI summary, detailed feedback
```

---

### Recruiter Flow (API Calls)

**1. Login**

```
POST /api/auth/login
→ JWT token
```

**2. Generate Questions**

```
POST /api/questions/generate
{ role: "Full Stack", technologies: ["React", "Node"] }
→ 6 generated questions
```

**3. Save Questions**

```
POST /api/questions
{ type: "mcq", questionText: "...", ... }
→ Question saved with ID
```

**4. Create Interview**

```
POST /api/interviews
{
  title: "Frontend Interview",
  questionIds: ["q1", "q2", "q3", "q4", "q5", "q6"],
  assignedEmails: ["candidate@example.com"]
}
→ Interview created
```

**5. Publish Interview**

```
PUT /api/interviews/abc-123/publish
→ Status: published
```

**6. Monitor Candidates**

```
GET /api/interviews/abc-123/candidates
→ List of candidates with scores
```

**7. View Detailed Results**

```
GET /api/interviews/abc-123/candidates/session-456
→ Full chat history, scores, AI feedback
```

---

## Authentication Flow

### JWT Payload Structure

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "candidate",
  "iat": 1633024800,
  "exp": 1633111200
}
```

### Token Expiry

- Access Token: 24 hours
- Refresh Token (future): 7 days

### Middleware Implementation

```typescript
import { jwt } from "hono/jwt";

app.use(
  "/api/*",
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
);

// Access user data in handlers
app.get("/api/protected", (c) => {
  const payload = c.get("jwtPayload");
  const userId = payload.userId;
  const role = payload.role;
  // ...
});
```
