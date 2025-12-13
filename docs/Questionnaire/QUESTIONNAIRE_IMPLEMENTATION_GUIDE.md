# UBCupids Questionnaire Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Database Schema](#database-schema)
4. [File Structure](#file-structure)
5. [Implementation Phases](#implementation-phases)
6. [Testing Checklist](#testing-checklist)
7. [Future Enhancements](#future-enhancements)

---

## Overview

### Project Context

**UBCupids** is a Valentine's Day matching service for UBC students launching February 2026. Students:

- Register with UBC emails
- Complete a 60-question compatibility questionnaire
- Receive 1-3 matches from both an algorithm and human "Cupids"
- Matching happens in two batches (Feb 1 & 7)
- Optional prize draws for dates that happen

### Current State

✅ Authentication system fully implemented (NextAuth.js, email verification, protected routes)  
✅ Dashboard exists with link to `/questionnaire`  
📋 **Need to implement:** 60-question questionnaire across 7 sections (Section 0-6)

### Questionnaire Requirements

**Content Requirements:**

- 60 questions across 7 sections (Basic Info, Icebreakers, What I'm Like, What I'm Looking For in a Person, What I'm Looking For in a Relationship, Dealbreakers, Open-Ended)
- Pre-questionnaire agreement screen
- Multiple question types: single-choice, multi-choice, text, textarea, ranking, scale
- Questions must be easily editable without code changes

**Functional Requirements:**

- Users can save drafts (partial responses)
- Users can edit responses before submission
- Users can submit final questionnaire (locks responses)
- Confirmation dialog before submission
- Progress tracking
- Optional question importance rating system
- Read-only view after submission

**Technical Requirements:**

- Clean, accessible, polished UI/UX
- Industry-standard form implementation
- Proper validation and error handling
- Mobile-responsive design
- Performance optimization

---

## Architecture Decisions

### 1. Question Storage: JSON Configuration File

**Decision:** Store all question content in `src/data/questionnaire-config.json`

**Rationale:**

- ✅ **Easy editing:** Non-technical editing - change question text without touching code
- ✅ **Version control:** Track question changes in Git
- ✅ **AI-friendly:** Easy for AI assistants to parse and modify
- ✅ **Flexibility:** Add/remove questions without database migrations
- ✅ **Type safety:** Can generate TypeScript types from JSON schema

**Structure:**

```json
{
  "sections": [
    {
      "id": "section-0",
      "title": "Basic Info & Matching Criteria",
      "description": "This helps us understand who you are and who you're looking for.",
      "questions": [
        {
          "id": "q0.1",
          "type": "single-choice",
          "text": "What's your gender identity?",
          "required": true,
          "options": [
            { "value": "man", "label": "Man" },
            { "value": "woman", "label": "Woman" },
            { "value": "non-binary", "label": "Non-binary" },
            {
              "value": "self-describe",
              "label": "Prefer to self-describe",
              "hasTextInput": true
            }
          ]
        }
      ]
    }
  ]
}
```

**Question Type Mappings:**

- Radio buttons → `"type": "single-choice"`
- Checkboxes → `"type": "multi-choice"`
- Short text → `"type": "text"`
- Long text → `"type": "textarea"`
- Drag-to-rank → `"type": "ranking"`
- Slider → `"type": "scale"`

---

### 2. Database Schema

**Decision:** Single `QuestionnaireResponse` row per user with JSON fields

**Rationale:**

- ✅ **Performance:** 1 database query instead of 60+ rows
- ✅ **Atomic updates:** Save all responses at once
- ✅ **Flexibility:** Add/remove questions without schema changes
- ✅ **Draft support:** Easy to track completion state
- ✅ **PostgreSQL JSONB:** Efficient querying and indexing

**Schema Design:**

```prisma
model QuestionnaireResponse {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  responses   Json     // All answers: { "q0.1": "man", "q1": "pizza", ... }
  importance  Json?    // Importance ratings: { "q1": "dealbreaker", "q5": "very-important" }

  isSubmitted Boolean  @default(false)  // false = draft, true = locked
  submittedAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([isSubmitted])
}
```

**Why this approach:**

- **Draft Mode:** `isSubmitted = false` allows editing
- **Locked Mode:** `isSubmitted = true` prevents further changes
- **Importance Optional:** Separate JSON field for optional feature
- **Timestamps:** Track creation and submission times
- **Cascade Delete:** Remove responses when user deleted

---

### 3. State Management

**Decision:** React state + API endpoints (no external state library)

**Rationale:**

- ✅ **Simplicity:** No Redux/Zustand needed for single-page form
- ✅ **Auto-save:** Debounced saves to API on change
- ✅ **Local state:** Fast UI updates, sync with server
- ✅ **Next.js patterns:** Server Components + Client Components

**State Flow:**

1. Server Component loads initial data (SSR)
2. Client Component manages form state
3. Auto-save debounced on input changes
4. Manual save button for explicit saves
5. Submit locks the questionnaire

---

### 4. UI Component Strategy

**Decision:** shadcn/ui components + custom wrappers

**Rationale:**

- ✅ **Accessibility:** ARIA-compliant out of the box
- ✅ **Customization:** Copy/paste into codebase, fully customizable
- ✅ **Consistency:** Matches existing auth UI
- ✅ **Type safety:** Full TypeScript support

**Components Needed:**

- ✅ Already installed: `button`, `card`, `checkbox`, `input`, `label`
- 📦 Need to add: `radio-group`, `textarea`, `progress`, `alert-dialog`, `slider`, `select`

---

## Database Schema

### Update to Prisma Schema

**Changes Required:**

1. **Add `QuestionnaireResponse` model** (new)
2. **Update `User` model** to add relation

```prisma
// Add to User model
model User {
  // ... existing fields ...
  questionnaireResponse QuestionnaireResponse?
}

// Add new model
model QuestionnaireResponse {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  responses   Json     // Stores all answers: { "q0.1": "man", "q1": "pizza", ... }
  importance  Json?    // Stores importance ratings: { "q1": "dealbreaker", "q5": "very-important", ... }

  isSubmitted Boolean  @default(false)  // false = draft, true = locked
  submittedAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([isSubmitted])
}
```

**Migration Command:**

```bash
npx prisma migrate dev --name add_questionnaire_response
npx prisma generate
```

---

## File Structure

```
app/
├── (dashboard)/
│   └── questionnaire/
│       ├── page.tsx                         # Main questionnaire page (Server Component wrapper)
│       └── _components/
│           ├── QuestionnaireForm.tsx        # Client Component - Main form container
│           ├── PreQuestionnaireAgreement.tsx # Agreement screen before questions
│           ├── SectionRenderer.tsx          # Renders one section with questions
│           ├── QuestionRenderer.tsx         # Renders individual question by type
│           ├── ProgressBar.tsx              # Shows % completion (sticky top)
│           ├── SubmitConfirmDialog.tsx      # "Are you sure?" popup
│           └── ImportanceRating.tsx         # Optional importance selector
│
├── api/
│   └── questionnaire/
│       ├── route.ts                         # GET - Fetch user's responses
│       ├── save/
│       │   └── route.ts                    # POST - Save draft (allows editing)
│       └── submit/
│           └── route.ts                    # POST - Submit final (locks responses)
│
src/
├── data/
│   └── questionnaire-config.json           # Question content (easily editable)
│
├── lib/
│   ├── questionnaire-utils.ts              # Helper functions (validation, progress)
│   └── questionnaire-types.ts              # TypeScript types/interfaces
│
components/
└── ui/
    ├── radio-group.tsx                     # shadcn/ui (single-choice)
    ├── checkbox.tsx                        # ✅ Already exists
    ├── textarea.tsx                        # shadcn/ui (multi-line text)
    ├── slider.tsx                          # shadcn/ui (scale questions)
    ├── progress.tsx                        # shadcn/ui (progress bar)
    ├── alert-dialog.tsx                    # shadcn/ui (submit confirmation)
    └── select.tsx                          # shadcn/ui (dropdown options)
```

---

## Implementation Phases

### Phase 1: Database & Types Setup (30 min)

**Tasks:**

1. Update `prisma/schema.prisma` with new models
2. Run migration: `npx prisma migrate dev --name add_questionnaire_response`
3. Create TypeScript types in `src/lib/questionnaire-types.ts`

**Types to Create:**

```typescript
export type QuestionType =
  | "single-choice"
  | "multi-choice"
  | "text"
  | "textarea"
  | "ranking"
  | "scale";

export interface QuestionOption {
  value: string;
  label: string;
  hasTextInput?: boolean; // For "Other: ___" options
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: QuestionOption[];
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface QuestionnaireConfig {
  agreement: {
    title: string;
    description: string;
    points: string[];
    agreementText: string;
  };
  sections: Section[];
}

export type ResponseValue = string | string[] | number;
export type Responses = Record<string, ResponseValue>;
export type ImportanceLevel =
  | "dealbreaker"
  | "very-important"
  | "somewhat-important"
  | "not-important";
export type ImportanceRatings = Record<string, ImportanceLevel>;
```

**✅ Checkpoint:**

- Prisma migration successful
- Types file created
- No TypeScript errors

---

### Phase 2: Question Configuration File (1-2 hours)

**Tasks:**

1. Create `src/data/` directory
2. Create `questionnaire-config.json` with all 60 questions
3. Create utility functions in `src/lib/questionnaire-utils.ts`

**JSON Structure Example:**

```json
{
  "agreement": {
    "title": "Welcome to UBCupids! 🏹",
    "description": "Before you begin, here's what you're signing up for:",
    "points": [
      "This questionnaire takes about 20 minutes",
      "Your responses are private and only used for matching",
      "You'll be matched with 1-3 people based on compatibility",
      "Matches will be revealed on February 1st, 2026"
    ],
    "agreementText": "I understand and agree to participate thoughtfully"
  },
  "sections": [
    {
      "id": "section-0",
      "title": "Basic Info & Matching Criteria",
      "description": "This helps us understand who you are and who you're looking for.",
      "questions": [
        {
          "id": "q0.1",
          "type": "single-choice",
          "text": "What's your gender identity?",
          "required": true,
          "options": [
            { "value": "man", "label": "Man" },
            { "value": "woman", "label": "Woman" },
            { "value": "non-binary", "label": "Non-binary" },
            {
              "value": "self-describe",
              "label": "Prefer to self-describe",
              "hasTextInput": true
            }
          ]
        }
        // ... more questions
      ]
    }
    // ... more sections
  ]
}
```

**Utility Functions:**

```typescript
// src/lib/questionnaire-utils.ts
import questionnaireConfig from "@/data/questionnaire-config.json";
import { QuestionnaireConfig, Responses } from "./questionnaire-types";

export function getQuestionnaireConfig(): QuestionnaireConfig {
  return questionnaireConfig as QuestionnaireConfig;
}

export function validateResponses(responses: Responses): string[] {
  const config = getQuestionnaireConfig();
  const errors: string[] = [];

  config.sections.forEach((section) => {
    section.questions.forEach((question) => {
      if (question.required && !responses[question.id]) {
        errors.push(`Question "${question.text}" is required`);
      }
    });
  });

  return errors;
}

export function calculateProgress(responses: Responses): number {
  const config = getQuestionnaireConfig();
  const totalQuestions = config.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
  const answeredQuestions = Object.keys(responses).length;
  return Math.round((answeredQuestions / totalQuestions) * 100);
}

export function getTotalQuestions(): number {
  const config = getQuestionnaireConfig();
  return config.sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
}
```

**✅ Checkpoint:**

- All 60 questions in JSON format
- Utility functions created
- Config loads without errors
- Progress calculation works

---

### Phase 3: API Routes (45 min)

**Tasks:**

1. Create `app/api/questionnaire/route.ts` (GET)
2. Create `app/api/questionnaire/save/route.ts` (POST)
3. Create `app/api/questionnaire/submit/route.ts` (POST)

**GET /api/questionnaire** - Fetch user's responses

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await prisma.questionnaireResponse.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    responses: response?.responses || {},
    importance: response?.importance || {},
    isSubmitted: response?.isSubmitted || false,
    submittedAt: response?.submittedAt || null,
  });
}
```

**POST /api/questionnaire/save** - Save draft

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveSchema = z.object({
  responses: z.record(z.union([z.string(), z.array(z.string()), z.number()])),
  importance: z
    .record(
      z.enum([
        "dealbreaker",
        "very-important",
        "somewhat-important",
        "not-important",
      ])
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already submitted
  const existing = await prisma.questionnaireResponse.findUnique({
    where: { userId: session.user.id },
  });

  if (existing?.isSubmitted) {
    return NextResponse.json(
      { error: "Questionnaire already submitted and cannot be edited" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validatedData = saveSchema.parse(body);

  await prisma.questionnaireResponse.upsert({
    where: { userId: session.user.id },
    update: {
      responses: validatedData.responses,
      importance: validatedData.importance || {},
      updatedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      responses: validatedData.responses,
      importance: validatedData.importance || {},
      isSubmitted: false,
    },
  });

  return NextResponse.json({ success: true });
}
```

**POST /api/questionnaire/submit** - Submit final

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { validateResponses } from "@/lib/questionnaire-utils";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { responses, importance } = body;

  // Validate all required questions are answered
  const errors = validateResponses(responses);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Please answer all required questions", details: errors },
      { status: 400 }
    );
  }

  await prisma.questionnaireResponse.upsert({
    where: { userId: session.user.id },
    update: {
      responses,
      importance: importance || {},
      isSubmitted: true,
      submittedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      responses,
      importance: importance || {},
      isSubmitted: true,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
```

**✅ Checkpoint:**

- All three API routes created
- Test with Postman/Thunder Client
- Authorization working
- Data saves to database

---

### Phase 4: UI Components Setup (30 min)

**Tasks:**

1. Install missing shadcn/ui components
2. Verify existing components still work

**Install Commands:**

```bash
npx shadcn@latest add radio-group
npx shadcn@latest add textarea
npx shadcn@latest add progress
npx shadcn@latest add alert-dialog
npx shadcn@latest add slider
npx shadcn@latest add select
```

**✅ Checkpoint:**

- All components installed
- No build errors
- Components render in isolation

---

### Phase 5: Question Rendering Components (2 hours)

**Tasks:**

1. Create `QuestionRenderer.tsx` - handles all question types
2. Create `SectionRenderer.tsx` - renders a section with multiple questions
3. Create `ProgressBar.tsx` - sticky progress indicator
4. Create `SubmitConfirmDialog.tsx` - confirmation popup

**QuestionRenderer.tsx** - Core component

```typescript
// Handles rendering different question types
// Supports: single-choice, multi-choice, text, textarea, scale
// Handles "Other: ___" text inputs for options
// Disabled state for read-only view
```

**SectionRenderer.tsx** - Section wrapper

```typescript
// Renders section title & description
// Maps through questions and renders each one
// Passes onChange handler to questions
```

**ProgressBar.tsx** - Progress tracking

```typescript
// Sticky position at top of page
// Shows percentage and visual progress bar
// Updates as user answers questions
```

**SubmitConfirmDialog.tsx** - Final submission warning

```typescript
// AlertDialog with clear warning
// "You will not be able to edit responses"
// Cancel and Confirm buttons
```

**✅ Checkpoint:**

- All question types render correctly
- Progress bar updates on change
- Dialog opens and closes
- Components are responsive

---

### Phase 6: Main Questionnaire Page (1.5 hours)

**Tasks:**

1. Create `PreQuestionnaireAgreement.tsx` - agreement screen
2. Create `QuestionnaireForm.tsx` - main form logic
3. Create `app/(dashboard)/questionnaire/page.tsx` - page wrapper

**Flow:**

1. User lands on page → Load existing responses
2. If not agreed → Show `PreQuestionnaireAgreement`
3. If agreed → Show `QuestionnaireForm`
4. Form auto-saves on input debounce (3 seconds)
5. Manual "Save Draft" button available
6. "Submit" button enabled when 100% complete
7. After submit → Redirect to dashboard

**State Management:**

```typescript
const [responses, setResponses] = useState<Responses>({});
const [importance, setImportance] = useState<ImportanceRatings>({});
const [isSubmitted, setIsSubmitted] = useState(false);
const [hasAgreed, setHasAgreed] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);
```

**Auto-save Logic:**

```typescript
// Debounce saves by 3 seconds
useEffect(() => {
  if (!hasAgreed || isSubmitted) return;

  const timeoutId = setTimeout(() => {
    handleSaveDraft();
  }, 3000);

  return () => clearTimeout(timeoutId);
}, [responses, importance]);
```

**✅ Checkpoint:**

- Agreement screen shows first
- Questions load from config
- Responses save to database
- Progress updates correctly
- Submit locks the form
- Read-only mode works

---

### Phase 7: Polish & Accessibility (1 hour)

**Tasks:**

1. Add loading states and skeletons
2. Add error handling and toast notifications
3. Improve mobile responsiveness
4. Add keyboard navigation
5. Test accessibility with screen reader
6. Add helpful microcopy ("Auto-saved at 2:34 PM")

**Accessibility Checklist:**

- ✅ All form inputs have labels
- ✅ Required fields marked with asterisk
- ✅ Error messages associated with inputs
- ✅ Keyboard navigation works (Tab, Enter, Space)
- ✅ Focus indicators visible
- ✅ Color contrast meets WCAG AA
- ✅ Screen reader announces form state changes

**✅ Checkpoint:**

- Form works on mobile
- No accessibility violations
- Error messages clear
- Loading states smooth

---

## Testing Checklist

### Functional Testing

**Draft Mode:**

- [ ] User can access `/questionnaire` from dashboard
- [ ] Agreement screen shows on first visit
- [ ] Questions render from JSON config
- [ ] Single-choice questions work (radio buttons)
- [ ] Multi-choice questions work (checkboxes)
- [ ] Text inputs work (short text)
- [ ] Textareas work (long text)
- [ ] Progress bar updates as questions answered
- [ ] Auto-save works (responses saved every 3 seconds)
- [ ] Manual "Save Draft" button works
- [ ] User can leave and return (responses persist)
- [ ] User can edit any response before submitting

**Submit Mode:**

- [ ] "Submit" button disabled until 100% complete
- [ ] Submit confirmation dialog appears
- [ ] Cancel button keeps form editable
- [ ] Confirm button locks responses
- [ ] Success message appears
- [ ] User redirected to dashboard
- [ ] Re-visiting shows read-only view
- [ ] All edit buttons hidden when submitted

**Edge Cases:**

- [ ] Refreshing page doesn't lose data
- [ ] Multiple tabs don't conflict
- [ ] Network errors handled gracefully
- [ ] Validation catches missing required fields
- [ ] "Other: \_\_\_" text inputs save correctly
- [ ] Multi-select preserves order

**API Testing:**

- [ ] GET `/api/questionnaire` returns user's data
- [ ] GET returns empty object for new users
- [ ] POST `/api/questionnaire/save` saves draft
- [ ] POST save rejects if already submitted
- [ ] POST `/api/questionnaire/submit` validates required fields
- [ ] POST submit locks questionnaire
- [ ] Unauthorized requests return 401

**UI/UX Testing:**

- [ ] Form responsive on mobile (320px+)
- [ ] Progress bar visible and sticky
- [ ] Long question text wraps properly
- [ ] Buttons have appropriate sizes (44px touch targets)
- [ ] Focus states visible
- [ ] Error messages clear and helpful
- [ ] Loading states present

---

## Future Enhancements

### Phase 8: Question Importance Feature (Optional)

**User Story:** "As a user, I want to mark which questions matter most to me, so my matches are weighted toward my priorities."

**Updated Design (per user feedback):**

All questions have importance buttons displayed by default. Users can optionally click to change importance for any question they care about. All questions default to "Somewhat Important" (✓) unless changed.

**Implementation:**

1. Display importance button row next to/below each question
2. Four button options: 🔥 Dealbreaker, ⭐ Very Important, ✓ Somewhat Important (default), ~ Not Important
3. Buttons styled as toggle buttons (active state shows selection)
4. Store in `importance` JSON field (only store non-default values to save space)
5. Make it optional - users can skip and leave as default
6. Mention in pre-questionnaire agreement that users can optionally mark question importance

**UI Design:**

```
[Question text here]
( ) Option 1
( ) Option 2
(•) Option 3  ← selected

How important is this to you?
[🔥] [⭐] [✓] [~]  ← Buttons (default: ✓ Somewhat Important)
Dealbreaker | Very | Somewhat | Not Important
```

**Implementation Details:**

- Component: `ImportanceRating.tsx`
- Props: `questionId`, `value`, `onChange`, `disabled`
- Default state: "somewhat-important" (don't store in DB unless changed)
- Visual feedback: Active button has different color/border
- Mobile-friendly: Large touch targets (44px minimum)
- Accessible: Keyboard navigation, ARIA labels
- Optional: Tooltip explaining what each level means

**Pre-Questionnaire Agreement Update:**

Add to the agreement points:

- "You can optionally mark which questions matter most to you (using importance buttons) to fine-tune your matches"

---

### Phase 9: Advanced Features (Future)

**Conditional Questions:**

- Show/hide questions based on previous answers
- Example: If "I don't drink" → skip alcohol-related questions

**Question Branching:**

- Different question flows based on user type
- Example: Undergrad vs. Grad student questions

**Progress Saving with Sections:**

- "Save and continue later" after each section
- Email reminder if incomplete after 3 days

**Analytics Dashboard (Admin):**

- Track completion rates per section
- Identify questions users skip most
- A/B test question wording

**AI-Generated Questions:**

- Allow AI to suggest personalized follow-up questions
- Based on interesting/unique responses

---

## Technical Notes

### Performance Optimizations

1. **JSON Config Loading:** Imported at build time (static), no runtime fetch
2. **Database Queries:** Single query with JSONB indexing
3. **Auto-save Debouncing:** Prevents excessive API calls
4. **React Memoization:** Use `useMemo` for config parsing
5. **Code Splitting:** Dynamic imports for heavy components

### Security Considerations

1. **Authorization:** Every API route checks session
2. **Validation:** Zod schema validates all inputs
3. **Rate Limiting:** Consider adding to prevent spam saves
4. **XSS Prevention:** React escapes user input by default
5. **CSRF Protection:** NextAuth handles tokens

### Maintenance

**Changing Questions:**

1. Edit `src/data/questionnaire-config.json`
2. Update question text, options, or add new questions
3. Commit to Git
4. Deploy (no database migration needed)

**Viewing User Responses:**

```sql
-- In database GUI or CLI
SELECT
  u.email,
  qr.responses,
  qr."isSubmitted",
  qr."submittedAt"
FROM "QuestionnaireResponse" qr
JOIN "User" u ON u.id = qr."userId"
WHERE qr."isSubmitted" = true;
```

---

## Support & Troubleshooting

### Common Issues

**Issue:** Questions not loading  
**Solution:** Check `questionnaire-config.json` for syntax errors (trailing commas, missing quotes)

**Issue:** Responses not saving  
**Solution:** Check browser console for API errors, verify authentication

**Issue:** Progress stuck at 99%  
**Solution:** One question likely not saving correctly, check for validation errors

**Issue:** Can't submit even at 100%  
**Solution:** Verify all required questions have non-empty values

---

## Conclusion

This implementation guide provides a complete roadmap for building the UBCupids questionnaire. The architecture prioritizes:

- **Maintainability:** Easy to edit questions without code changes
- **User Experience:** Auto-save, progress tracking, clear submission flow
- **Scalability:** JSON-based, can handle 100+ questions
- **Accessibility:** WCAG-compliant, keyboard navigation
- **Flexibility:** Support for future features (importance ratings, conditional logic)

The modular design allows iterative implementation and testing at each phase. Each checkpoint ensures the system works before moving to the next phase.

**Estimated Total Implementation Time:** 8-10 hours across 7 phases

**Next Steps:** Begin Phase 1 - Database & Types Setup
