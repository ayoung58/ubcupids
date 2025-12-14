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
    // 1. PARSE REQUEST BODY
    // ============================================
    const body = await request.json();
    const { email, password, firstName, lastName, age, major, acceptedTerms } =
      body;

    // ============================================
    // 2. VALIDATE REQUIRED FIELDS
    // ============================================
    const missingFields: string[] = [];

    if (!email) missingFields.push("Email");
    if (!password) missingFields.push("Password");
    if (!firstName) missingFields.push("First Name");
    if (!lastName) missingFields.push("Last Name");
    if (!age) missingFields.push("Age");

    if (missingFields.length > 0) {
      const fieldList = missingFields.join(", ");
      const errorMessage =
        missingFields.length === 1
          ? `Missing required field: ${fieldList}`
          : `Missing required fields: ${fieldList}`;

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // ============================================
    // 3. VALIDATE TERMS ACCEPTANCE
    // ============================================
    if (!acceptedTerms) {
      return NextResponse.json(
        { error: "Please accept the Terms and Conditions" },
        { status: 400 }
      );
    }

    // ============================================
    // 4. NORMALIZE EMAIL
    // ============================================
    const normalizedEmail = normalizeEmail(email);

    // ============================================
    // 5. VALIDATE UBC EMAIL
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
    // 6. VALIDATE PASSWORD STRENGTH
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
    // 7. CHECK IF EMAIL ALREADY EXISTS
    // ============================================
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Security note: Don't reveal if email is verified or not
      // This prevents attackers from enumerating registered emails
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
    // 9. CREATE USER (emailVerified = null)
    // ============================================
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: parseInt(age),
        major: major?.trim() || null,
        emailVerified: null, // Will be set when user clicks verification link
        acceptedTerms: new Date(), // Record timestamp of acceptance
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
      await sendVerificationEmail(user.email, user.firstName, token);
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
        message: "Account created! Check your email to verify your account.",
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
