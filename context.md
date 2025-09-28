# Project Context: Crisp Swipe - Recruiter Frontend Implementation

## 📋 Project Overview
**Project:** AI-powered interview platform with recruiter dashboard
**Current Focus:** Implementing recruiter UI flow with 3-step interview creation modal
**Tech Stack:** React 18, TypeScript, TanStack Router, TanStack Query, shadcn/ui, Tailwind CSS
**Backend:** Hono.js with PostgreSQL, Drizzle ORM, JWT auth

## 🎯 Current Status & Issues

### ✅ **Completed Features:**
1. **Recruiter Dashboard** - Fully functional with:
   - Real-time stats (interviews, candidates, completion rates)
   - Interview table with actions (view, edit, clone, delete, close)  
   - Optimistic updates for smooth UX
   - Modal-based interactions (no navigation away from dashboard)
   - Split into modular, memoized components

2. **Dashboard Components** (all memoized and optimized):
   - `StatCard` - Dashboard metrics display
   - `InterviewRow` - Individual interview table rows  
   - `DeleteConfirmDialog` - Delete confirmation with shadcn Dialog
   - `ViewInterviewModal` - Interview details in modal
   - `EditInterviewModal` - Edit interview with publish functionality

### ⚠️ **Current Issue:**
**3-Step Interview Creation Modal** is not working despite complete implementation.

**Problem:** User reports "its not working" after complete redesign to fix:
- Wrong flow structure (was all-in-one, needed separate steps)
- API Zod error for missing technologies array
- UI re-rendering on every text input 
- Non-responsive design not fitting screen

## 🏗️ Technical Architecture

### **File Structure Created:**
```
frontend/src/
├── components/recruiter/
│   ├── types.ts                           # Shared interfaces
│   ├── stat-card.tsx                     # ✅ Working
│   ├── interview-row.tsx                 # ✅ Working  
│   ├── delete-confirm-dialog.tsx         # ✅ Working
│   ├── view-interview-modal.tsx          # ✅ Working
│   ├── edit-interview-modal.tsx          # ✅ Working
│   ├── index.ts                          # Barrel exports
│   └── create-interview/
│       ├── types.ts                      # ❓ Form data interfaces + job role mapping
│       ├── create-interview-modal.tsx    # ❓ Main container with state management
│       ├── step1-basic-info.tsx          # ❓ Basic info form (title, role, description)
│       ├── step2-question-selection.tsx  # ❓ AI question generation
│       ├── step3-metadata.tsx            # ❓ Access settings & publish options
│       └── index.ts                      # ❓ Clean exports
├── lib/hooks/
│   └── use-debounce.ts                   # ❓ Performance optimization hook
└── routes/_authenticated/recruiter/
    └── dashboard.tsx                     # ✅ Main dashboard with modal integration
```

### **Key Components Integration:**
```typescript
// Dashboard imports and uses all components:
import {
  StatCard,
  InterviewRow, 
  DeleteConfirmDialog,
  ViewInterviewModal,
  EditInterviewModal,
  CreateInterviewModal,  // ❓ Not working
  type Interview,
  type InterviewsData
} from "@/components/recruiter";
```

## 📝 Detailed Implementation

### **3-Step Modal Flow (Current Implementation):**

#### **Step 1: Basic Info** (`step1-basic-info.tsx`)
- Interview Title (required, max 100 chars)
- Job Role dropdown (10 predefined options)
- Description (optional, max 500 chars) 
- Debounced inputs to prevent re-renders
- Character counters and validation
- Next button disabled until required fields filled

#### **Step 2: Question Generation** (`step2-question-selection.tsx`) 
- AI question generation using `recruiterApi.generateQuestions()`
- Job role mapped to technologies array to fix Zod error:
  ```typescript
  const JOB_ROLE_TECHNOLOGIES = {
    'Full Stack Developer': ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    'Frontend Developer': ['React', 'TypeScript', 'CSS', 'HTML'],
    // ... etc
  }
  ```
- Individual question cards with regenerate/remove actions
- Question statistics (Easy/Medium/Hard breakdown, total time/points)
- Validation requires at least 1 question

#### **Step 3: Metadata** (`step3-metadata.tsx`)
- Candidate Access: Public (anyone) vs Private (assigned emails)
- Email assignment with validation for private interviews
- Optional deadline with future date validation  
- Final summary and publish options (Draft vs Live)
- Form validation before submission

### **API Integration:**
```typescript
// Create interview workflow:
const handleCreateInterview = async (publishImmediately: boolean) => {
  // 1. Create interview
  const createdInterview = await recruiterApi.createInterview(interviewData);
  
  // 2. Assign questions
  await recruiterApi.assignQuestions(createdInterview.id, questionsToAssign);
  
  // 3. Publish if requested  
  if (publishImmediately) {
    await recruiterApi.publishInterview(createdInterview.id);
  }
};
```

### **Performance Optimizations Applied:**
1. **Debouncing** - `useDebounce` hook for text inputs (300ms title, 500ms description)
2. **Memoization** - All components wrapped with `memo()`
3. **Callback optimization** - All handlers use `useCallback()`
4. **Responsive design** - Modal max-width 2xl, max-height 95vh with scrolling

## 🔧 Backend API Requirements

### **Endpoints Used:**
- `POST /api/recruiter/interviews` - Create interview
- `POST /api/recruiter/questions/generate-all` - Generate questions (requires technologies array)
- `POST /api/recruiter/questions/regenerate` - Regenerate single question
- `POST /api/recruiter/interviews/{id}/assign-questions` - Assign questions to interview
- `POST /api/recruiter/interviews/{id}/publish` - Publish interview

### **Known API Requirements:**
```typescript
// generateQuestions API expects:
{
  jobRole: string,
  technologies: string[], // THIS WAS THE ZOD ERROR - now fixed with mapping
  customPrompt?: string
}
```

## 🎨 UI/UX Design

### **Modal Design:**
- **Progress bar** at top showing step completion (0% → 50% → 100%)
- **Responsive layout** - max-width 2xl, fits on smaller screens
- **Step navigation** with Back/Next/Cancel buttons
- **Validation feedback** - real-time error messages
- **Loading states** - spinners and disabled buttons during API calls

### **Theme Integration:**
- Uses shadcn/ui components with proper theme variables
- Dark/light mode compatible
- Consistent with existing dashboard design
- Proper contrast ratios for accessibility

## 🚨 Current Problem Analysis

**User Feedback:** "its not working"

**Possible Issues:**
1. **Import/Export Problems** - Module resolution issues
2. **API Errors** - Despite fixing Zod error, may have other API issues
3. **State Management** - Form state not persisting between steps
4. **Validation Logic** - Step validation preventing progression
5. **Modal Integration** - CreateInterviewModal not opening from dashboard
6. **TypeScript Errors** - Type mismatches preventing compilation
7. **Hook Dependencies** - useDebounce or other custom hooks not working

**Files to Check:**
- Console errors in browser dev tools
- Network tab for API call failures  
- React dev tools for component state
- TypeScript compilation errors
- Import/export chain from dashboard to modal components

## 📋 TODO List Status

### ✅ **Completed:**
- Recruiter dashboard redesign with modern UI
- Real data fetching and display
- Interview table with all CRUD operations
- Modal-based interactions (view, edit, delete)
- Dashboard component splitting and memoization
- Performance optimization with useCallback
- Theme fixes for proper contrast
- 3-step modal structure implementation
- API integration with proper technologies mapping
- Debouncing for text inputs
- Responsive design implementation

### ❓ **Current Issue:**
- 3-step interview creation modal not functioning despite complete implementation

### 🔮 **Pending Next Steps:**
- Build interview details page
- Build candidate details modal

## 💡 Debugging Steps for Next Session

### **Immediate Actions:**
1. **Check browser console** for JavaScript/TypeScript errors
2. **Verify API calls** in network tab when clicking "Generate All Questions"
3. **Test modal opening** - does CreateInterviewModal open when clicking "Create Interview"?
4. **Check imports** - verify all imports resolve correctly
5. **Validate step progression** - can user navigate between steps?
6. **Test API integration** - does question generation actually work?

### **Common Issues to Look For:**
- Missing exports in `index.ts` files
- TypeScript compilation errors
- useDebounce hook implementation issues
- TanStack Query cache invalidation problems
- Form validation preventing step progression
- API endpoint URL mismatches
- Authentication/authorization issues

### **Files to Examine First:**
1. Browser dev tools console
2. `frontend/src/components/recruiter/create-interview/create-interview-modal.tsx`
3. `frontend/src/components/recruiter/create-interview/types.ts`
4. `frontend/src/lib/hooks/use-debounce.ts`
5. Network requests to `/api/recruiter/questions/generate-all`

## 🎯 Success Criteria

**Modal should:**
1. Open when "Create Interview" button clicked on dashboard
2. Progress through 3 steps with proper validation
3. Generate questions via AI without errors
4. Create interview and refresh dashboard data
5. Show success toast and close modal

**When working properly, user should be able to:**
- Click "Create Interview" → Modal opens to Step 1
- Fill title + job role → "Next" becomes enabled
- Click Next → Step 2 loads with question generation
- Click "Generate All Questions" → 6 questions appear
- Click Next → Step 3 loads with access settings
- Configure settings → Click "Publish Now" or "Save Draft"
- Modal closes → Dashboard refreshes with new interview

This context should provide complete information for picking up exactly where we left off and debugging the non-working 3-step modal implementation.
