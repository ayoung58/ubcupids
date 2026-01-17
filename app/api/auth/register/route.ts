import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  isValidUBCEmail,
  validatePassword,
  normalizeEmail,
} from "@/lib/auth";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import {
  SIGNUP_DEADLINE,
  MAX_MATCH_USERS,
  MAX_CUPID_USERS,
} from "@/lib/matching/config";

/**
 * Registration API Endpoint
 *
 * POST /api/auth/register
 *
 * Request body:
 * {
 *   email: string,
 *   password: string,
 *   firstName: string,
 *   lastName: string,
 *   major?: string,
 *   acceptedTerms: boolean
 * }
 *
 * Response codes:
 * - 201: User created, verification email sent
 * - 400: Invalid input (bad email, weak password, terms not accepted)
 * - 409: Email already registered
 * - 500: Server error (database or email service failure)
 *
 * Security measures:
 * - UBC email validation (student.ubc.ca or alumni.ubc.ca only)
 * - Password strength validation
 * - Terms acceptance required
 * - Email normalization (lowercase, trimmed)
 * - Password hashing (bcrypt, 12 rounds)
 * - Verification token (random 32 bytes, 24-hour expiry)
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. CHECK SIGNUP DEADLINE
    // ============================================
    const now = new Date();
    if (now > SIGNUP_DEADLINE) {
      return NextResponse.json(
        {
          error: "Sign-ups have closed for 2026",
          hint: "Registration is no longer available. Please check back next year.",
        },
        { status: 403 }
      );
    }

    // ============================================
    // 2. PARSE REQUEST BODY
    // ============================================
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      age,
      major,
      campus,
      okMatchingDifferentCampus,
      preferredCandidateEmail,
      acceptedTerms,
      accountType,
    } = body;

    const isCupid = accountType === "cupid";

    // ============================================
    // 3. VALIDATE REQUIRED FIELDS
    // ============================================
    const missingFields: string[] = [];

    if (!email) missingFields.push("Email");
    if (!password) missingFields.push("Password");
    if (!firstName) missingFields.push("First Name");
    if (!lastName) missingFields.push("Last Name");

    // Age is only required for Match accounts
    if (!isCupid) {
      if (!age) missingFields.push("Age");
    }

    if (missingFields.length > 0) {
      const fieldList = missingFields.join(", ");
      const errorMessage =
        missingFields.length === 1
          ? `Missing required field: ${fieldList}`
          : `Missing required fields: ${fieldList}`;

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Validate age range for match accounts
    if (!isCupid && age) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
        return NextResponse.json(
          { error: "Age must be between 16 and 100" },
          { status: 400 }
        );
      }
    }

    // ============================================
    // 4. VALIDATE TERMS ACCEPTANCE
    // ============================================
    if (!acceptedTerms) {
      return NextResponse.json(
        { error: "Please accept the Terms and Conditions" },
        { status: 400 }
      );
    }

    // ============================================
    // 4.5. CHECK USER CAP (excluding test users)
    // ============================================
    const currentUserCount = await prisma.user.count({
      where: {
        isTestUser: false,
        ...(isCupid ? { isCupid: true } : { isBeingMatched: true }),
      },
    });

    const maxUsers = isCupid ? MAX_CUPID_USERS : MAX_MATCH_USERS;
    const accountTypeName = isCupid ? "Cupids" : "Match candidates";

    if (currentUserCount >= maxUsers) {
      return NextResponse.json(
        {
          error: `Maximum number of ${accountTypeName.toLowerCase()} reached`,
          hint: `We've reached the maximum capacity of ${maxUsers} ${accountTypeName.toLowerCase()} for 2026. Registration is currently closed for this account type.`,
        },
        { status: 403 }
      );
    }

    // ============================================
    // 5. NORMALIZE EMAIL
    // ============================================
    const normalizedEmail = normalizeEmail(email);

    // ============================================
    // 6. VALIDATE UBC EMAIL
    // ============================================
    if (!isValidUBCEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          error:
            "Invalid email. Only @student.ubc.ca and @alumni.ubc.ca emails are accepted.",
          hint: "Make sure you're using your UBC student or alumni email address.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 7. VALIDATE PASSWORD STRENGTH
    // ============================================
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: "Password does not meet requirements",
          hint: "At least 8 characters long and includes uppercase letters, lowercase letters, and numbers.",
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 8. CHECK IF EMAIL ALREADY EXISTS
    // ============================================
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        isCupid: true,
        isBeingMatched: true,
      },
    });

    if (existingUser) {
      // Check what account type they're trying to create
      const isTryingToCreateCupid = accountType === "cupid";
      const isTryingToCreateMatch = accountType === "match";

      // Determine what they already have
      const hasCupidAccount = existingUser.isCupid;
      const hasMatchAccount = existingUser.isBeingMatched;

      // Provide specific error messages for dual-account scenarios
      if (isTryingToCreateCupid && hasCupidAccount) {
        return NextResponse.json(
          {
            error: "There is already a Cupid account with that email",
            hint: "Please log in to access your existing Cupid account.",
          },
          { status: 409 }
        );
      }

      if (isTryingToCreateMatch && hasMatchAccount) {
        return NextResponse.json(
          {
            error: "There is already a Match account with that email",
            hint: "Please log in to access your existing Match account.",
          },
          { status: 409 }
        );
      }

      // If they have one account type and are trying to create the other
      if (isTryingToCreateCupid && hasMatchAccount && !hasCupidAccount) {
        return NextResponse.json(
          {
            error: "An account with this email already exists",
            hint: "If you already have a Match account and would like a Cupid account, please log in and create a Cupid account through your profile.",
          },
          { status: 409 }
        );
      }

      if (isTryingToCreateMatch && hasCupidAccount && !hasMatchAccount) {
        return NextResponse.json(
          {
            error: "An account with this email already exists",
            hint: "If you already have a Cupid account and would like a Match account, please log in and create a Match account through your profile.",
          },
          { status: 409 }
        );
      }

      // Fallback for any other case (shouldn't happen with current logic)
      return NextResponse.json(
        {
          error: "An account with this email already exists",
          hint: 'Try logging in or use the "Forgot Password" option if needed.',
        },
        { status: 409 }
      );
    }

    // ============================================
    // 8. HASH PASSWORD
    // ============================================
    const hashedPassword = await hashPassword(password);

    // ============================================
    // 8.5. VALIDATE PREFERRED CANDIDATE EMAIL (if provided)
    // ============================================
    let validatedPreferredEmail: string | null = null;
    if (isCupid && preferredCandidateEmail && preferredCandidateEmail.trim()) {
      const normalizedPreferredEmail = normalizeEmail(
        preferredCandidateEmail.trim()
      );

      // Check if it's a valid UBC email
      if (!isValidUBCEmail(normalizedPreferredEmail)) {
        return NextResponse.json(
          {
            error: "Preferred candidate email must be a valid UBC email",
            hint: "Please use a @student.ubc.ca or @alumni.ubc.ca email address.",
          },
          { status: 400 }
        );
      }

      // Check if the preferred candidate exists
      const preferredCandidate = await prisma.user.findUnique({
        where: { email: normalizedPreferredEmail },
        select: { id: true, isBeingMatched: true },
      });

      if (!preferredCandidate) {
        return NextResponse.json(
          {
            error: "Preferred candidate email not found",
            hint: "Please make sure the user has registered an account.",
          },
          { status: 400 }
        );
      }

      if (!preferredCandidate.isBeingMatched) {
        return NextResponse.json(
          {
            error: "This user is not participating in matching",
            hint: "The preferred candidate must have a Match account.",
          },
          { status: 400 }
        );
      }

      // Check if another cupid already has this preferred candidate
      const existingCupid = await prisma.user.findFirst({
        where: {
          preferredCandidateEmail: normalizedPreferredEmail,
        },
        select: { id: true },
      });

      if (existingCupid) {
        return NextResponse.json(
          {
            error:
              "There is already a cupid that prefers to match this candidate!",
          },
          { status: 400 }
        );
      }

      validatedPreferredEmail = normalizedPreferredEmail;
    }

    // ============================================
    // 9. CREATE USER (emailVerified = null)
    // ============================================
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: isCupid ? null : parseInt(age),
        major: major?.trim() || null,
        campus: isCupid ? "Vancouver" : campus || "Vancouver",
        okMatchingDifferentCampus: isCupid
          ? true
          : (okMatchingDifferentCampus ?? true),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        cupidDisplayName: `${firstName.trim()} ${lastName.trim()}`, // Default to full name
        emailVerified: null, // Will be set when user clicks verification link
        acceptedTerms: new Date(), // Record timestamp of acceptance
        isCupid: isCupid,
        isBeingMatched: !isCupid, // Cupids are not being matched by default
        preferredCandidateEmail: validatedPreferredEmail,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    console.log(`[Register] User created: ${user.email} (ID: ${user.id})`);

    // ============================================
    // 10. GENERATE VERIFICATION TOKEN
    // ============================================
    // Generate cryptographically secure random token (32 bytes = 64 hex chars)
    const token = crypto.randomBytes(32).toString("hex");

    // Token expires in 24 hours
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    // Store token in database
    await prisma.verificationToken.create({
      data: {
        identifier: user.email, // Email address
        token: token,
        expires: expires,
      },
    });

    console.log(`[Register] Verification token created for: ${user.email}`);

    // ============================================
    // 11. SEND VERIFICATION EMAIL
    // ============================================
    try {
      await sendVerificationEmail(user.email, user.firstName || "Cupid", token);
      console.log(`[Register] Verification email sent to: ${user.email}`);
    } catch (emailError) {
      console.error(
        "[Register] Failed to send verification email:",
        emailError
      );

      // User created but email failed - this is recoverable
      // They can request another verification email later
      // Don't fail registration completely
      return NextResponse.json(
        {
          success: true,
          message:
            "Account created, but verification email failed to send. Please try again later.",
          userId: user.id,
          emailSent: false,
        },
        { status: 201 }
      );
    }

    // ============================================
    // 12. SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message:
          "Account created! Check your email inbox and spam folder to verify your account. In order to receive emails more easily, please whitelist support@ubcupids.org",
        userId: user.id,
        emailSent: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Register] Unexpected error:", error);

    // Don't expose internal error details to client
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
        // In development, include error for debugging
        ...(process.env.NODE_ENV === "development" && {
          debug: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}
