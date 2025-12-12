# Password Reset System Documentation

## Overview

The UBCupids application implements a secure password reset system with multiple layers of protection against abuse.

## Architecture

### Components

- **Forgot Password Page** (`/forgot-password`) - User requests reset
- **Reset Password Page** (`/reset-password`) - User sets new password
- **Email Service** (`lib/email.ts`) - Sends reset emails
- **Database Models** - `PasswordResetToken` for token storage
- **Rate Limiting** (`lib/rate-limit.ts`) - Prevents abuse

### Database Schema

```prisma
model PasswordResetToken {
  id         String   @id @default(cuid())
  email      String
  token      String   @unique
  expires    DateTime
  used       Boolean  @default(false)

  createdAt  DateTime @default(now())

  @@index([email])
  @@index([token])
}
```

## Security Features

### 1. Rate Limiting

**Forgot Password Endpoint** (`/api/auth/forgot-password`):

- **Limit**: 3 requests per hour per email
- **Purpose**: Prevents email spam and brute force attacks
- **Implementation**: Database-backed tracking using `RateLimit` model

**Reset Password Endpoint** (`/api/auth/reset-password`):

- **No rate limiting**: Users can attempt password resets unlimited times
- **Reason**: Since tokens are one-time use, failed attempts don't enable abuse
- **Protection**: Token expiry and one-time use provide sufficient security

### 2. Token Security

- **Generation**: 32-byte cryptographically secure random hex string
- **Storage**: Hashed in database with unique constraint
- **Expiry**: 1 hour from creation
- **One-time Use**: Token marked as `used: true` after successful reset
- **URL Encoding**: Tokens are URL-encoded in emails to prevent corruption
- **Pre-validation**: Page checks token status before showing form

### 3. Email Security

- **No Token Revelation**: Emails never reveal if account exists
- **Secure Links**: Reset URLs include encoded tokens
- **Expiration Notices**: Clear expiry information in emails

## User Flow

### 1. Request Password Reset

```
User visits /forgot-password
Enters email address
System validates email format
Checks rate limit (3/hour)
If valid:
  - Deletes any existing tokens for email
  - Generates new 32-byte hex token
  - Stores token with 1-hour expiry
  - Sends email with reset link
Returns success message (doesn't reveal if email exists)
```

### 2. Receive Reset Email

```
Email contains:
- Personalized greeting
- Reset password button/link
- Copy-paste fallback link
- 1-hour expiry notice
- Support contact info

Link format: /reset-password?token=<url-encoded-token>
```

### 3. Reset Password

```
User clicks link → /reset-password?token=...
Page validates token exists, not expired, and not used
If invalid/expired/used: Shows appropriate error message with login link
If valid: Shows password reset form
User enters new password (client + server validation)
System:
  - Validates password strength
  - Updates user password (hashed)
  - Marks token as used
  - Returns success message
```

## Error Handling

### Forgot Password Errors

- **Rate Limited**: "Too many reset requests. Try again in X minutes."
- **Email Format**: Client-side validation
- **Server Error**: Generic error message

### Reset Password Errors

- **Invalid Token**: "Invalid reset link" (caught on page load)
- **Expired Token**: "Reset link has expired" (caught on page load)
- **Used Token**: "The reset link has already been used" (caught on page load)
- **Weak Password**: Detailed validation errors
- **Server Error**: Generic error message

## Implementation Details

### Token Generation

```typescript
const token = crypto.randomBytes(32).toString("hex");
// Result: 64-character hex string (URL-safe)
```

### URL Construction

```typescript
const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
```

### Search Params Handling (Next.js 15+)

```typescript
export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams; // searchParams is now a Promise
  const { token: rawToken } = params;
  const token = rawToken ? decodeURIComponent(rawToken) : undefined;

  // Validate token status on page load
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
    // Show appropriate error message
    return <ErrorMessage />;
  }

  return <ResetPasswordForm token={token} />;
}
```

## Security Considerations

### Attack Vectors Mitigated

1. **Brute Force**: Rate limiting on forgot password endpoint
2. **Token Guessing**: 32-byte random tokens (2^256 possibilities)
3. **Replay Attacks**: One-time use tokens with upfront validation
4. **Timing Attacks**: Consistent response times
5. **Email Enumeration**: Generic success messages
6. **URL Truncation**: URL encoding prevents corruption

### Best Practices Implemented

- Cryptographically secure token generation
- Short token expiry (1 hour)
- Database-backed rate limiting
- Proper error handling without information leakage
- URL encoding for safe transmission
- Transactional database updates

## Testing Scenarios

### Happy Path

1. User requests reset → receives email → clicks link → resets password → success

### Error Cases

1. Invalid token → "Invalid reset link" error
2. Expired token → "Reset link expired" error
3. Used token → "Already used" error
4. Rate limited → "Too many attempts" error
5. Weak password → validation errors

### Edge Cases

1. Multiple concurrent requests
2. Token URL encoding issues
3. Email client link handling
4. Network timeouts during reset

## Maintenance Notes

### Token Cleanup

- Expired tokens are deleted when encountered
- Consider periodic cleanup job for old tokens
- Used tokens remain in DB for audit purposes

### Rate Limit Tuning

- Monitor abuse patterns
- Adjust limits based on legitimate usage
- Consider per-IP additional limiting for severe abuse

### Email Delivery

- Monitor email delivery rates
- Handle bounce notifications
- Consider email verification for better deliverability</content>
  <parameter name="filePath">PASSWORD_RESET_DOCS.md
