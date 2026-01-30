import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Resend Password Reset Code API
 *
 * POST /api/auth/resend-reset-code
 *
 * Resends password reset code to users who:
 * - Didn't receive original email
 * - Email went to spam
 * - Reset code expired
 *
 * Request body:
 * {
 *   email: string
 * }
 *
 * Responses:
 * - 200: Code sent successfully
 * - 400: Invalid email
 * - 404: User not found
 * - 429: Too many requests (rate limited)
 * - 500: Server error
 *
 * Rate limiting: 3 resend attempts per 15 minutes (server-side, database-backed)
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
      "resend-reset-code",
      {
        maxAttempts: 3,
        windowMinutes: 15,
      },
    );

    if (!rateLimitResult.allowed) {
      console.log(
        `[ResendResetCode] Rate limit exceeded for: ${normalizedEmail}`,
      );
      return NextResponse.json(
        {
          error: rateLimitResult.message,
          resetAt: rateLimitResult.resetAt.toISOString(),
        },
        { status: 429 }, // 429 Too Many Requests
      );
    }

    console.log(
      `[ResendResetCode] Rate limit check passed. Remaining: ${rateLimitResult.remaining}`,
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
      },
    });

    if (!user) {
      console.log(`[ResendResetCode] User not found: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 },
      );
    }

    // ============================================
    // 4. DELETE OLD RESET CODES
    // ============================================
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    console.log(`[ResendResetCode] Deleted old codes for: ${normalizedEmail}`);

    // ============================================
    // 5. GENERATE NEW RESET CODE
    // ============================================
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1-hour expiry

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token: code,
        expires: expires,
      },
    });

    console.log(
      `[ResendResetCode] New reset code created for: ${normalizedEmail}`,
    );

    // ============================================
    // 6. SEND RESET EMAIL
    // ============================================
    try {
      await sendPasswordResetEmail(user.email, user.firstName, code);
      console.log(`[ResendResetCode] Reset email sent to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error("[ResendResetCode] Failed to send email:", emailError);

      return NextResponse.json(
        {
          error: "Failed to send reset email. Please try again later.",
        },
        { status: 500 },
      );
    }

    // ============================================
    // 7. SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: "Reset code sent! Check your inbox.",
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt.toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[ResendResetCode] Error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          debug: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 },
    );
  }
}
