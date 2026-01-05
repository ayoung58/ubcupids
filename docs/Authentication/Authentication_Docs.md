UBCupids Authentication System Documentation
Last Updated: December 2024
Authentication Library: NextAuth.js v5 (with JWT strategy)
Database: PostgreSQL via Prisma ORM
Status: ✅ Production-ready for MVP

# Table of Contents

Architecture Overview
Technology Stack
Database Schema
Authentication Flow
Security Features
API Endpoints
File Structure
Key Design Decisions
Future Enhancements
Developer Guide

Architecture Overview
UBCupids uses NextAuth.js with JWT session strategy for authentication. This architecture was chosen for:

Compatibility with Credentials Provider (email/password login)
Serverless deployment on Vercel (no persistent session storage needed)
Fast performance (no database query on every request)

Key Components
┌─────────────────────────────────────────────────────────────┐
│ Authentication System │
├─────────────────────────────────────────────────────────────┤
│ │
│ User Registration → Email Verification → Login → Dashboard │
│ │
│ ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│ │ Rate Limit │ │ JWT Session │ │ Protected │ │
│ │ (Database) │ │ (30 days) │ │ Routes │ │
│ └──────────────┘ └──────────────┘ └─────────────────┘ │
│ │
│ Password Reset ← Forgot Password Email ← Rate Limited │
│ │
└─────────────────────────────────────────────────────────────┘

Technology Stack

| Component        | Technology        | Version | Rationale                                 |
| ---------------- | ----------------- | ------- | ----------------------------------------- |
| Auth Framework   | NextAuth.js       | 5.x     | Industry standard, serverless-ready       |
| Session Storage  | JWT               | N/A     | Required for Credentials provider         |
| Password Hashing | bcryptjs          | 2.x     | Timing-safe, 12 salt rounds               |
| Database         | PostgreSQL (Neon) | 16.x    | ACID compliance, relational data          |
| ORM              | Prisma            | 6.x     | Type-safe queries, migrations             |
| Email Service    | Resend            | Latest  | React Email templates, 3K/month free      |
| Rate Limiting    | Database-backed   | Custom  | Persist across refreshes, no Redis needed |

Database Schema
Core Authentication Tables
prisma// User account with authentication fields
model User {
id String @id @default(cuid())
email String @unique
password String // bcrypt hashed
emailVerified DateTime? // NULL until verified

// Profile
firstName String
lastName String
major String?
acceptedTerms DateTime // GDPR compliance

// Relations
accounts Account[]
sessions Session[]

createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
}

// NextAuth required models
model Account { /_ OAuth providers (future) _/ }
model Session { /_ Not used with JWT strategy _/ }

// Email verification tokens (24-hour expiry)
model VerificationToken {
identifier String // Email address
token String @unique
expires DateTime

@@unique([identifier, token])
}

// Password reset tokens (1-hour expiry)
model PasswordResetToken {
id String @id @default(cuid())
email String
token String @unique
expires DateTime
used Boolean @default(false) // One-time use

@@index([email])
@@index([token])
}

// Server-side rate limiting (bypasses client manipulation)
model RateLimit {
identifier String // Email or IP
action String // 'login-attempt', 'resend-verification', 'forgot-password'
attempts Int @default(1)
expiresAt DateTime

@@unique([identifier, action])
@@index([expiresAt])
}

```

---

## Authentication Flow

### 1. Registration Flow
```

User fills form → Client validates → POST /api/auth/register
↓
Server validates (@student.ubc.ca or @alumni.ubc.ca)
↓
Password hashed (bcrypt, 12 rounds)
↓
User created (emailVerified = NULL)
↓
Verification token generated (crypto.randomBytes(32))
↓
Email sent via Resend (24-hour expiry)
↓
User clicks link → GET /verify-email?token=xxx
↓
Token validated → emailVerified = NOW()
↓
Token deleted (one-time use) → Redirect to /login?verified=true

```

**Key Files**:
- `app/api/auth/register/route.ts` - Registration endpoint
- `app/verify-email/route.ts` - Email verification
- `emails/VerificationEmail.tsx` - React Email template

---

### 2. Login Flow
```

User enters credentials → signIn('credentials', {...})
↓
Rate limit check (5 attempts / 15 minutes)
↓
User lookup in database
↓
Password verification (bcrypt.compare)
↓
Email verified check
↓
JWT token generated (30-day expiry)
↓
Session cookie set → Redirect to /dashboard
Key Files:

app/api/auth/[...nextauth]/route.ts - NextAuth configuration
components/auth/LoginForm.tsx - Login UI
lib/auth.ts - Password utilities

JWT Contents:
typescript{
id: "user_cuid",
email: "user@student.ubc.ca",
name: "First Last",
iat: 1234567890, // Issued at
exp: 1237159890 // Expires (30 days later)
}

```

---

### 3. Password Reset Flow
```

User clicks "Forgot password?" → /forgot-password
↓
Enters email → POST /api/auth/forgot-password
↓
Rate limit check (3 attempts / hour)
↓
User lookup (don't reveal if exists)
↓
Reset token generated (1-hour expiry)
↓
Email sent with reset link
↓
User clicks link → /reset-password?token=xxx
↓
Token validated → User enters new password
↓
Password hashed → User updated → Token marked as used
↓
Redirect to /login?reset=success

```

**Key Files**:
- `app/api/auth/forgot-password/route.ts` - Request reset
- `app/api/auth/reset-password/route.ts` - Perform reset
- `emails/PasswordResetEmail.tsx` - Email template

---

### 4. Sign-Out Flow (Custom Implementation)
```

User clicks "Logout" → /signout (confirmation page)
↓
User confirms → signOut({ callbackUrl: '/login?signedout=true' })
↓
JWT cookie cleared → Redirect to login
↓
Success message displayed
Why custom sign-out page:

NextAuth's default confirmation page has poor UX (full-screen button)
Custom page allows "Cancel" action (return to dashboard)
Consistent with app's design language

Key Files:

app/signout/page.tsx - Custom confirmation UI

Security Features
✅ Implemented
FeatureImplementationRationalePassword Hashingbcrypt (12 rounds)Industry standard, timing-safeEmail VerificationRequired before loginPrevents fake accountsUBC Email OnlyRegex validationCommunity trust (students/alumni only)Rate LimitingDatabase-backed5 login attempts/15min, 3 resets/hourToken Expiry24h (verify), 1h (reset)Limits attack windowOne-Time TokensDeleted/marked after usePrevents replay attacksCSRF ProtectionNextAuth built-inAutomatic with JWT strategySession Expiry30 days, refreshed dailyBalance security/convenience
⚠️ Not Implemented (MVP Scope)
FeatureStatusReason DeferredAccount LockoutSkippedRate limiting sufficient for MVPRemember MeSkipped30-day session already generousOAuth (Google)FutureAdds complexity, UBC email validation harder2FA/MFAFutureNot critical for dating appPassword ComplexityBasicRequires 8 chars, 1 upper, 1 lower, 1 number

API Endpoints
Authentication Endpoints
typescript// Registration
POST /api/auth/register
Body: { email, password, firstName, lastName, major?, acceptedTerms }
Response: 201 Created | 400 Validation Error | 409 Email Exists

// Login (handled by NextAuth)
POST /api/auth/signin
Body: { email, password }
Response: JWT cookie set | 401 Unauthorized

// Logout (handled by NextAuth)
GET /api/auth/signout
Response: Clears JWT cookie

// Resend Verification
POST /api/auth/resend-verification
Body: { email }
Response: 200 Success | 429 Rate Limited

// Forgot Password
POST /api/auth/forgot-password
Body: { email }
Response: 200 Success (always, security) | 429 Rate Limited

// Reset Password
POST /api/auth/reset-password
Body: { token, password }
Response: 200 Success | 400 Invalid Token
Protected Routes (Middleware)
typescript// Protected by middleware.ts
/dashboard/\*
/questionnaire
/matches
/submit-proof

// Unauthenticated redirects to /login

```

---

## File Structure
```

ubcupids/
├── app/
│ ├── (auth)/ # Auth pages (public)
│ │ ├── login/page.tsx # Login page with error handling
│ │ ├── register/page.tsx # Registration page
│ │ ├── forgot-password/page.tsx # Request password reset
│ │ ├── reset-password/page.tsx # Reset password form
│ │ ├── resend-verification/page.tsx
│ │ ├── verification-pending/page.tsx
│ │ └── signout/page.tsx # Custom sign-out confirmation
│ │
│ ├── (dashboard)/ # Protected pages
│ │ └── dashboard/page.tsx # Main dashboard
│ │
│ ├── api/
│ │ └── auth/
│ │ ├── [...nextauth]/route.ts # NextAuth config
│ │ ├── register/route.ts # Registration API
│ │ ├── resend-verification/route.ts
│ │ ├── forgot-password/route.ts
│ │ └── reset-password/route.ts
│ │
│ └── verify-email/route.ts # Email verification (not in api/)
│
├── components/
│ ├── auth/
│ │ ├── LoginForm.tsx # Login form with error handling
│ │ ├── RegisterForm.tsx # Registration form with validation
│ │ ├── ForgotPasswordForm.tsx
│ │ ├── ResetPasswordForm.tsx
│ │ └── ResendVerificationForm.tsx
│ │
│ └── ui/ # shadcn/ui components
│ ├── button.tsx
│ ├── input.tsx
│ ├── card.tsx
│ ├── alert.tsx
│ └── ...
│
├── emails/ # React Email templates
│ ├── VerificationEmail.tsx
│ └── PasswordResetEmail.tsx
│
├── lib/
│ ├── auth.ts # Password hashing, validation
│ ├── email.ts # Email sending utilities
│ ├── rate-limit.ts # Database-backed rate limiting
│ ├── get-session.ts # Server-side session helper
│ └── prisma.ts # Prisma client singleton
│
├── middleware.ts # Protected route middleware
│
├── prisma/
│ └── schema.prisma # Database schema
│
└── types/
└── next-auth.d.ts # NextAuth TypeScript types

Key Design Decisions

1. JWT vs Database Sessions
   Decision: JWT session strategy
   Rationale:

Required for Credentials Provider (NextAuth limitation)
No database query on every request (faster, cheaper)
Serverless-friendly (Vercel deployment)

Trade-off: Can't revoke sessions server-side (acceptable for 30-day expiry)

2. Email Verification Before Login
   Decision: Block login until email verified
   Rationale:

Prevents spam/fake accounts
Ensures only real UBC students
Validates working email for match notifications

Implementation:
typescript// In authorize() function
if (!user.emailVerified) {
throw new Error("EmailNotVerified");
}

3. Database-Backed Rate Limiting
   Decision: Store rate limits in PostgreSQL (not in-memory)
   Rationale:

Persists across server restarts
Can't be bypassed with page refresh
No Redis/caching layer needed (simpler architecture)

Performance: Negligible overhead for 500-5000 users

4. UBC Email Restriction
   Decision: Only @student.ubc.ca and @alumni.ubc.ca
   Rationale:

Excludes faculty/staff (@ubc.ca)
Targets student demographic
Easier to verify legitimacy

Regex:
typescript/^[a-zA-Z0-9._%+-]+@(student\.ubc\.ca|alumni\.ubc\.ca)$/i

5. Custom Sign-Out Flow
   Decision: Custom confirmation page (/signout) instead of NextAuth default
   Rationale:

NextAuth's default UX is poor (full-screen button)
Custom page allows "Cancel" action
Better matches app design

Implementation: Client-side signOut() call, not form POST

6. Password Requirements
   Decision: Moderate complexity (8 chars, 1 upper, 1 lower, 1 number)
   Rationale:

Balance security and usability
No special characters (NIST 2020 guidelines)
Length matters more than complexity

Validation:
typescript/^(?=._[a-z])(?=._[A-Z])(?=.\*\d).{8,}$/

Future Enhancements
High Priority (Post-MVP)

OAuth Integration (Google, GitHub)

Effort: 4-6 hours
Why: Easier sign-up, fewer password resets
Challenge: Validating @student.ubc.ca with OAuth
Solution: Check hd claim (hosted domain) in Google OAuth

Account Deletion (GDPR Compliance)

Effort: 2-3 hours
Files: app/settings/page.tsx, app/api/user/delete/route.ts
Requirements: Cascade delete (matches, uploads, questionnaire)

Admin Dashboard

Effort: 8-10 hours
Features: View users, verify emails manually, delete spam accounts
Auth: Role-based access control (add role field to User model)

Medium Priority

Email Preferences

Effort: 3-4 hours
Feature: Opt out of match notifications (keep account active)
Implementation: Add emailPreferences JSON field to User

Session Management (View active sessions)

Effort: 4-5 hours
Challenge: JWT sessions aren't stored in database
Workaround: Track last login timestamp, show "Last active" date

Security Logs (Failed login attempts, password changes)

Effort: 2-3 hours
Implementation: New SecurityLog model with Prisma

Low Priority

Remember Me (90-day session)

Effort: 1-2 hours
Implementation: Checkbox on login extends JWT expiry

Account Lockout (After 5 failed attempts)

Effort: 2-3 hours (already designed, just skipped for MVP)
Files: lib/account-lockout.ts already exists

2FA/MFA (Authenticator app)

Effort: 10-12 hours
Library: @simplewebauthn/server or TOTP

Developer Guide
Getting Started
Prerequisites:

Node.js 20+ LTS
PostgreSQL database (Neon recommended)
Resend account (free tier)

Setup:
bash# Install dependencies
npm install

# Set up environment variables

cp .env.example .env

# Fill in: DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, etc.

# Run migrations

npx prisma migrate dev

# Generate Prisma Client

npx prisma generate

# Start dev server

npm run dev

Adding a New Protected Route
Step 1: Add route to middleware matcher
typescript// middleware.ts
export const config = {
matcher: [
'/dashboard/:path*',
'/questionnaire',
'/matches',
'/submit-proof',
'/new-protected-route', // ADD HERE
],
};
Step 2: Create page component
typescript// app/new-protected-route/page.tsx
import { getCurrentUser } from '@/lib/get-session';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
const session = await getCurrentUser();

if (!session?.user) {
redirect('/login');
}

return <div>Protected content for {session.user.name}</div>;
}

Accessing User Session
Server Components (recommended):
typescriptimport { getCurrentUser } from '@/lib/get-session';

export default async function ServerPage() {
const session = await getCurrentUser();

if (!session) {
return <div>Not logged in</div>;
}

return <div>Hello {session.user.name}</div>;
}
Client Components:
typescript'use client';

import { useSession } from 'next-auth/react';

export function ClientComponent() {
const { data: session, status } = useSession();

if (status === 'loading') return <div>Loading...</div>;
if (!session) return <div>Not logged in</div>;

return <div>Hello {session.user.name}</div>;
}
API Routes:
typescriptimport { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
const session = await getServerSession(authOptions);

if (!session) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Access session.user.id, session.user.email, etc.
}

Adding a New Rate-Limited Endpoint
Example: Rate-limit profile updates
typescriptimport { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Check rate limit
const rateLimitResult = await checkRateLimit(
session.user.email,
'profile-update',
{
maxAttempts: 10, // 10 updates
windowMinutes: 60, // per hour
}
);

if (!rateLimitResult.allowed) {
return NextResponse.json(
{ error: rateLimitResult.message },
{ status: 429 }
);
}

// Proceed with update...
}

Testing Authentication Locally
Create test user:
bashnpx tsx scripts/create-test-user.ts

# Creates: test@student.ubc.ca / Test1234

View database:
bashnpx prisma studio

# Opens GUI at http://localhost:5555

Test email flow (without real email):

Register user
Copy verification token from Prisma Studio
Manually construct URL: http://localhost:3000/verify-email?token=xxx
Click link to verify

Common Issues & Solutions
Issue: "EmailNotVerified" error during login
Solution: Check emailVerified field in Prisma Studio. Manually set to NOW() for testing.
Issue: Rate limit not resetting
Solution: Check RateLimit table expiry. Delete row manually or wait for expiration.
Issue: JWT cookie not clearing on sign-out
Solution: Use custom /signout page (already implemented), not form POST.
Issue: Middleware redirecting unexpectedly
Solution: Check middleware.ts matcher patterns. Public routes should NOT be in matcher.

Environment Variables Reference
bash# Database
DATABASE_URL="postgresql://user:pass@host/db"

# NextAuth

NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000" # Dev
NEXTAUTH_URL="https://ubcupids.org" # Prod

# Email (Resend)

RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="UBCupids <noreply@ubcupids.org>"

# App URL (for email links)

NEXT_PUBLIC_APP_URL="http://localhost:3000" # Dev
NEXT_PUBLIC_APP_URL="https://ubcupids.org" # Prod

# Node Environment

NODE_ENV="development" # Dev
NODE_ENV="production" # Prod

Summary for AI Assistants
Current State: Authentication is fully functional with registration, email verification, login, password reset, and protected routes. All core security features (rate limiting, email verification, password hashing) are implemented.
Architecture: NextAuth.js with JWT sessions, PostgreSQL for user data, Resend for emails. Custom sign-out flow, database-backed rate limiting.
Key Files:

app/api/auth/[...nextauth]/route.ts - NextAuth config
lib/auth.ts - Password utilities
lib/rate-limit.ts - Rate limiting
middleware.ts - Protected routes

Future Work: OAuth, admin dashboard, account deletion, 2FA (low priority).
Build on this: Use getCurrentUser() for session checks, add routes to middleware.ts matcher, use checkRateLimit() for new rate-limited endpoints.

End of Documentation
