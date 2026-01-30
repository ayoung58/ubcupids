import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
      },
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 },
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

    if (!user) {
      console.log(`[ForgotPassword] User not found: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "No user found with that email address" },
        { status: 404 },
      );
    }

    // ============================================
    // DELETE OLD RESET TOKENS
    // ============================================
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // ============================================
    // GENERATE 6-DIGIT RESET CODE
    // ============================================
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1-hour expiry

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token: code,
        expires,
      },
    });

    console.log(`[ForgotPassword] Reset code created for: ${normalizedEmail}`);

    // ============================================
    // SEND RESET EMAIL WITH CODE
    // ============================================
    try {
      await sendPasswordResetEmail(user.email, user.firstName, code);
      console.log(`[ForgotPassword] Reset email sent to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error("[ForgotPassword] Failed to send email:", emailError);

      return NextResponse.json(
        {
          error: "Failed to send password reset email. Please try again later.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder! In order to receive emails more easily, please whitelist support@ubcupids.org",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[ForgotPassword] Unexpected error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
