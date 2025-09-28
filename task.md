# 🎯 Crisp Recruiter Flow Implementation Guide

## 📋 Implementation Progress Tracker

### ✅ Foundation Complete
- [x] Database schema with all required tables
- [x] Authentication system with JWT + cookies
- [x] Basic API structure with Hono + Drizzle
- [x] Role-based user system (candidate/recruiter)

### 🚧 Current Implementation Status

#### Phase 1: Core Infrastructure
- [ ] Recruiter authentication middleware
- [ ] Schema updates (add recruiterNotes to interview_sessions)
- [ ] Basic validation schemas

#### Phase 2: Question System
- [ ] Question generation endpoints with AI placeholders
- [ ] Question bank management (CRUD)
- [ ] Question regeneration with custom prompts

#### Phase 3: Interview Management
- [ ] Interview creation flow (3-step process)
- [ ] Interview CRUD operations
- [ ] Question-interview assignment system

#### Phase 4: Dashboard & Results
- [ ] Recruiter dashboard with stats
- [ ] Candidate results viewing
- [ ] Export functionality

---

## 🎭 Complete Recruiter Product Flow

### 🏠 DASHBOARD PAGE (Entry Point)
**URL:** `/recruiter/dashboard`

**What I see:**
- **Header**: Welcome back, [Recruiter Name] | Create Interview (button) | Logout
- **Stats Cards**: Total Interviews | Active Interviews | Total Candidates | Avg Score
- **Interview Table**:
```
| Interview Name | Role | Status | Candidates | Created | Actions |
|----------------|------|--------|------------|---------|---------|
| Frontend Dev   | React| Active | 12/5 done  | 2d ago  | View|Edit|Close |
| Backend Test   | Node | Draft  | 0/0        | 1w ago  | Edit|Delete   |
```

**Operations I can do:**
1. **View Interview** → Go to interview details page
2. **Create Interview** → Open creation modal
3. **Edit Interview** → Modify existing (only if draft/active)
4. **Clone Interview** → Copy to new interview
5. **Close Interview** → Stop accepting new candidates
6. **Delete Interview** → Remove completely (only drafts)
7. **Export Results** → Download CSV of all candidates

---

### 📊 INTERVIEW DETAILS PAGE
**URL:** `/recruiter/interviews/:id`

**What I see:**
- **Interview Info**: Name, Role, Status, Deadline, Public/Private, Created date
- **Quick Stats**: Total Candidates | Completed | Average Score | Top Score
- **Candidates Table**:
```
| Name | Email | Status | Score | Time Taken | Started | Actions |
|------|-------|--------|-------|------------|---------|---------|
| John | j@..  | Done   | 85%   | 4m 30s     | 2h ago  | View Details |
| Mary | m@..  | Progress| -    | 2m (ongoing)| 10m ago | View Progress|
```

**Operations I can do:**
1. **View Candidate Details** → Open candidate modal
2. **Export This Interview** → Download results for this interview only
3. **Share Interview Link** → Copy public link or email specific candidates
4. **Edit Interview** → Modify questions/settings (if no candidates started)
5. **Close Early** → Stop accepting new candidates before deadline
6. **Extend Deadline** → Give more time
7. **View Questions** → See all interview questions
8. **Add Candidates** → Assign more emails (private mode)

---

### 👤 CANDIDATE DETAILS MODAL
**Triggered from:** Interview details table

**What I see:**
- **Header**: Candidate name, email, score, completion status
- **Resume Section**: Download resume link, extracted fields
- **Answer Breakdown**:
```
Q1 (Easy MCQ): "What is React?"
Answer: "A JavaScript library" ✅ Correct (10/10 points)

Q2 (Medium): "Explain closures..."
Answer: [Their text answer]
AI Feedback: "Good understanding of scope, missing examples"
Keywords Found: 3/5 | AI Score: 7/10 | Total: 8/10

Q3 (Hard Code): "Implement debounce..."
Answer: [Their code]
AI Feedback: "Correct logic, good cleanup, minor syntax issue"
Score: 25/30
```

**Operations I can do:**
1. **Download Resume** → Get original uploaded file
2. **View Full Answer** → See complete text/code
3. **Manual Override Score** → Adjust AI score if needed
4. **Add Notes** → Private recruiter notes about candidate
5. **Flag Candidate** → Mark for follow-up
6. **Contact Candidate** → Send email (future feature)

---

### ✨ CREATE INTERVIEW FLOW

#### **Step 1: Basic Info Modal**
```
┌─ Create New Interview ─────────────────────┐
│ Interview Name: [Frontend Developer Test]  │
│ Job Role: [Full Stack Developer ▼]        │
│ Description: [Optional description...]      │
│                                            │
│ Candidate Access:                          │
│ ○ Public (Anyone can take)                 │
│ ○ Private (Assigned emails only)           │
│                                            │
│ Assigned Emails: (if Private selected)     │
│ [john@example.com, mary@...]              │
│ [+ Add Email] [Bulk Import CSV]            │
│                                            │
│ Deadline: [Dec 25, 2024 11:59 PM]         │
│                                            │
│ [Cancel] [Next: Add Questions]             │
└────────────────────────────────────────────┘
```

#### **Step 2: Question Selection Modal**
```
┌─ Add Questions (Step 2/3) ─────────────────┐
│                                            │
│ [🎯 Generate All Questions] (Primary btn)  │
│                                            │
│ ┌─ Easy Questions (MCQ) ────┐              │
│ │ Question 1: [Generated]   │ [Regenerate] │
│ │ Question 2: [From Bank ▼] │ [Browse]     │
│ └───────────────────────────┘              │
│                                            │
│ ┌─ Medium Questions (Short) ─┐              │
│ │ Question 1: [Loading...  ] │ [Regenerate] │
│ │ Question 2: [Select...   ] │ [Browse]     │
│ └───────────────────────────┘              │
│                                            │
│ ┌─ Hard Questions (Code) ────┐              │
│ │ Question 1: [Loading...  ] │ [Regenerate] │
│ │ Question 2: [Loading...  ] │ [Regenerate] │
│ └───────────────────────────┘              │
│                                            │
│ [Back] [Save & Preview]                    │
└────────────────────────────────────────────┘
```

#### **Step 3: Review & Publish**
```
┌─ Review Interview (Step 3/3) ──────────────┐
│ Interview: Frontend Developer Test         │
│ Role: Full Stack Developer                 │
│ Access: Public | Deadline: Dec 25, 2024   │
│                                            │
│ Questions Preview:                         │
│ ✅ Q1 (Easy): What is JSX? (20s, 10pts)   │
│ ✅ Q2 (Easy): React hooks? (20s, 10pts)   │
│ ✅ Q3 (Med): Explain closures (60s, 20pts)│
│ ✅ Q4 (Med): REST vs GraphQL (60s, 20pts) │
│ ✅ Q5 (Hard): Debounce hook (120s, 30pts) │
│ ✅ Q6 (Hard): Algorithm (120s, 30pts)     │
│                                            │
│ Total Duration: 6m 40s | Total Points: 120│
│                                            │
│ [Back] [Save as Draft] [Publish Interview]│
└────────────────────────────────────────────┘
```

---

### 🔄 ADDITIONAL OPERATIONS

#### **Question Bank Management**
**URL:** `/recruiter/questions`

**What I see:**
- **Filter Bar**: Type (MCQ/Short/Code) | Difficulty | Category | My Questions Only
- **Search**: Find questions by text content
- **Question Cards**: Preview of each question with stats (usage count, avg score)

**Operations:**
1. **Create New Question** → Manual question creation
2. **Edit Question** → Modify existing
3. **Delete Question** → Remove from bank (if not used in active interviews)
4. **Duplicate Question** → Clone and modify
5. **View Usage** → See which interviews use this question
6. **Import Questions** → Bulk upload from CSV/JSON

#### **Regenerate Question Dialog**
```
┌─ Regenerate Question ──────────────────────┐
│ Current Question:                          │
│ "What is the difference between let and    │
│  var in JavaScript?"                       │
│                                            │
│ Modification Request:                      │
│ [Make it focus on const keyword instead    │
│  and include examples]                     │
│                                            │
│ [Cancel] [Regenerate]                      │
└────────────────────────────────────────────┘
```

#### **Settings & Preferences**
**URL:** `/recruiter/settings`

**What I can configure:**
1. **Default Interview Settings**: Duration, points distribution
2. **Question Generation**: Preferred AI model, creativity level
3. **Notifications**: Email when candidates complete interviews
4. **Branding**: Company logo on interview pages
5. **API Keys**: AI provider configuration

---

## 🔗 Complete API Endpoints Mapping

### **Dashboard Data**
```http
GET /api/recruiter/dashboard
Response: {
  stats: { totalInterviews, activeInterviews, totalCandidates, avgScore },
  recentInterviews: Interview[],
  recentCandidates: Session[]
}
```

### **Interview Management**
```http
GET /api/recruiter/interviews                    # List with filters
POST /api/recruiter/interviews                   # Create new
GET /api/recruiter/interviews/:id                # Get details + candidates
PUT /api/recruiter/interviews/:id                # Update
DELETE /api/recruiter/interviews/:id             # Delete (draft only)
POST /api/recruiter/interviews/:id/clone         # Clone to new
POST /api/recruiter/interviews/:id/publish       # Draft → Published
POST /api/recruiter/interviews/:id/close         # Stop accepting
PUT /api/recruiter/interviews/:id/deadline       # Extend deadline
```

### **Question Generation**
```http
POST /api/recruiter/questions/generate-all       # Generate 6 questions
POST /api/recruiter/questions/regenerate         # Regenerate specific
GET /api/recruiter/questions                     # Question bank
POST /api/recruiter/questions                    # Save to bank
PUT /api/recruiter/questions/:id                 # Edit
DELETE /api/recruiter/questions/:id              # Delete
```

### **Candidate Management**
```http
GET /api/recruiter/interviews/:id/candidates     # List candidates
GET /api/recruiter/candidates/:sessionId         # Detailed view
PUT /api/recruiter/candidates/:sessionId/notes   # Add recruiter notes
PUT /api/recruiter/candidates/:sessionId/score   # Manual score override
POST /api/recruiter/interviews/:id/export        # Export to CSV
```

### **Advanced Features**
```http
POST /api/recruiter/interviews/:id/assign        # Add candidate emails
GET /api/recruiter/interviews/:id/link           # Get shareable link
POST /api/recruiter/interviews/:id/remind        # Send reminder emails
GET /api/recruiter/analytics/:id                 # Interview analytics
```

---

## ⚠️ Edge Cases & Error Scenarios

### **Question Generation Failures**
- **AI API down**: Show error, allow manual question entry
- **Invalid response**: Retry with different prompt
- **Partial generation**: Some questions succeed, some fail
- **Rate limiting**: Queue requests, show estimated wait time

### **Interview State Conflicts**
- **Edit after candidates started**: Lock interview, show warning
- **Simultaneous edits**: Optimistic locking with conflict resolution
- **Deadline passed**: Auto-close interview, notify recruiter
- **Delete with active sessions**: Prevent deletion, archive instead

### **Candidate Assignment Issues**
- **Invalid email format**: Validate before saving
- **Duplicate assignments**: Prevent, show existing candidates
- **Email bounces**: Track delivery status, flag failed sends
- **Access control**: Verify private interview access

---

## 🎯 Implementation Roadmap

### **Phase 1: Foundation (Week 1)**
1. **Recruiter Authentication Middleware**
   - Role validation middleware
   - Interview ownership verification
   - Error handling for unauthorized access

2. **Schema Updates**
   - Add `recruiterNotes` to interview_sessions table
   - Create migration file
   - Test database operations

3. **Basic CRUD Setup**
   - Interview creation endpoint
   - Question bank endpoints
   - Validation schemas with Zod

### **Phase 2: Core Features (Week 2)**
1. **Question Generation System**
   - AI integration placeholders
   - Question regeneration endpoints
   - Question bank management

2. **Interview Management**
   - Complete CRUD operations
   - Question assignment system
   - Status management (draft/published/closed)

### **Phase 3: Dashboard & Results (Week 3)**
1. **Recruiter Dashboard**
   - Statistics aggregation
   - Interview listing with filters
   - Recent activity tracking

2. **Candidate Results**
   - Detailed result viewing
   - Notes and scoring system
   - Export functionality

### **Phase 4: Advanced Features (Week 4)**
1. **Analytics & Reporting**
   - Interview performance metrics
   - Question effectiveness analysis
   - Export in multiple formats

2. **Polish & Optimization**
   - Error handling improvements
   - Performance optimizations
   - Edge case handling

---

## 🛠️ Development Guidelines

### **Code Standards**
- No unnecessary comments
- Follow existing route patterns (Hono RPC)
- Use Drizzle ORM consistently
- TypeScript strict mode
- Proper error handling

### **Implementation Strategy**
- Build from foundation up
- Small incremental steps
- Test each endpoint before moving forward
- Leave AI integration as placeholders initially
- Focus on data flow and validation first

### **Testing Approach**
- Manual testing after each endpoint
- Verify database operations
- Check TypeScript compilation
- Test error scenarios
- Validate API responses

---

## 📁 File Structure

```
server/
├── routes/
│   ├── auth.ts                 # ✅ Complete
│   └── recruiter.ts           # 🚧 To implement
├── middleware/
│   └── recruiter-auth.ts      # 🚧 To implement
├── db/
│   ├── schema.ts              # ✅ Complete (need notes field)
│   └── migrations/            # 🚧 Add recruiterNotes migration
├── utils/
│   ├── auth.ts                # ✅ Complete
│   ├── validation.ts          # 🚧 To implement
│   └── ai-placeholders.ts     # 🚧 To implement
└── types/
    └── recruiter.ts           # 🚧 To implement
```

---

## 🔧 Next Steps

1. **Start with middleware** - Create recruiter authentication
2. **Schema update** - Add recruiterNotes field
3. **Basic endpoints** - Implement one endpoint at a time
4. **Test thoroughly** - Verify each step before proceeding
5. **Iterate quickly** - Small commits, frequent validation

Ready to begin implementation with the foundation: **recruiter authentication middleware**!