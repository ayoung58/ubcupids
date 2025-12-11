import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Forgot Password API
 *
 * POST /api/auth/forgot-password
 *
 * Sends password reset link to user's email
 * Rate limited: 3 attempts per hour
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // RATE LIMITING: 3 attempts per hour
    // ============================================
    const rateLimitResult = await checkRateLimit(
      normalizedEmail,
      "forgot-password",
      {
        maxAttempts: 3,
        windowMinutes: 60,
      }
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // ============================================
    // FIND USER
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    // Security: Always return success (don't reveal if email exists)
    if (!user) {
      console.log(`[ForgotPassword] User not found: ${normalizedEmail}`);
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // ============================================
    // DELETE OLD RESET TOKENS
    // ============================================
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // ============================================
    // GENERATE RESET TOKEN
    // ============================================
    const token = crypto.randomBytes(32).toString("hex");

    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1-hour expiry

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires,
      },
    });

    console.log(`[ForgotPassword] Reset token created for: ${normalizedEmail}`);

    // ============================================
    // SEND RESET EMAIL
    // ============================================
    try {
      await sendPasswordResetEmail(user.email, user.firstName, token);
      console.log(`[ForgotPassword] Reset email sent to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error("[ForgotPassword] Failed to send email:", emailError);

      return NextResponse.json(
        {
          error: "Failed to send password reset email. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ForgotPassword] Unexpected error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}