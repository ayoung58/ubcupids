import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/resend-verification
 *
 * Resends verification email to users who:
 * - Didn't receive original email
 * - Email went to spam
 * - Verification link expired
 *
 * Request body:
 * {
 *   email: string
 * }
 *
 * Responses:
 * - 200: Email sent successfully
 * - 400: Invalid email or already verified
 * - 404: User not found
 * - 429: Too many requests (rate limited)
 * - 500: Server error
 *
 * Rate limiting: 3 attempts per 15 minutes (server-side, database-backed)
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. PARSE REQUEST BODY
    // ============================================
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // 2. CHECK RATE LIMIT (SERVER-SIDE)
    // ============================================
    const rateLimitResult = await checkRateLimit(
      normalizedEmail,
      "resend-verification",
      {
        maxAttempts: 3,
        windowMinutes: 15,
      }
    );

    if (!rateLimitResult.allowed) {
      console.log(`[Resend] Rate limit exceeded for: ${normalizedEmail}`);
      return NextResponse.json(
        {
          error: rateLimitResult.message,
          resetAt: rateLimitResult.resetAt.toISOString(),
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    console.log(
      `[Resend] Rate limit check passed. Remaining: ${rateLimitResult.remaining}`
    );

    // ============================================
    // 3. FIND USER
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
      },
    });

    // Keep existing error handling for user not found
    if (!user) {
      console.log(`[Resend] User not found: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    // ============================================
    // 4. CHECK IF ALREADY VERIFIED
    // ============================================
    if (user.emailVerified) {
      console.log(`[Resend] Email already verified: ${normalizedEmail}`);
      return NextResponse.json(
        {
          error: "This email is already verified. Please sign in",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 5. DELETE OLD VERIFICATION TOKENS
    // ============================================
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    console.log(`[Resend] Deleted old tokens for: ${normalizedEmail}`);

    // ============================================
    // 6. GENERATE NEW VERIFICATION CODE
    // ============================================
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: code,
        expires: expires,
      },
    });

    console.log(
      `[Resend] New verification code created for: ${normalizedEmail}`
    );

    // ============================================
    // 7. SEND VERIFICATION EMAIL
    // ============================================
    try {
      await sendVerificationEmail(user.email, user.firstName, code);
      console.log(`[Resend] Verification email sent to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error("[Resend] Failed to send verification email:", emailError);

      return NextResponse.json(
        {
          error: "Failed to send verification email. Please try again later.",
        },
        { status: 500 }
      );
    }

    // ============================================
    // 8. SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent! Check your inbox.",
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Resend Verification] Error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          debug: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}
