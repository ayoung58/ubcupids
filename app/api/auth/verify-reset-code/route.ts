import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Verify Password Reset Code API
 *
 * POST /api/auth/verify-reset-code
 *
 * Verifies the 6-digit password reset code and marks it as verified.
 * This is step 2 in the password reset flow (after email submission).
 *
 * Flow:
 * 1. User receives 6-digit code via email
 * 2. User enters code on forgot-password page
 * 3. Frontend sends POST to this endpoint with code
 * 4. API verifies code is valid and not expired
 * 5. Returns success → user can proceed to reset password page
 *
 * Request body:
 * {
 *   code: string (6-digit numeric code)
 * }
 *
 * Response:
 * - 200: { success: true, message: "Code verified", email: string }
 * - 400: { error: "Invalid or expired code" }
 * - 500: { error: "Server error" }
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. PARSE REQUEST BODY
    // ============================================
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      console.log("[VerifyResetCode] Missing or invalid code in request body");
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      console.log(`[VerifyResetCode] Invalid code format: ${code}`);
      return NextResponse.json(
        { error: "Reset code must be 6 digits" },
        { status: 400 },
      );
    }

    // ============================================
    // 2. FIND RESET CODE IN DATABASE
    // ============================================
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: code },
    });

    if (!resetToken) {
      console.log(`[VerifyResetCode] Code not found: ${code}`);
      return NextResponse.json(
        {
          error: "Invalid or expired reset code. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // ============================================
    // 3. CHECK IF CODE HAS EXPIRED
    // ============================================
    const now = new Date();
    if (resetToken.expires < now) {
      console.log(`[VerifyResetCode] Code expired for: ${resetToken.email}`);

      // Delete expired code
      await prisma.passwordResetToken.delete({
        where: { token: code },
      });

      return NextResponse.json(
        {
          error: "This reset code has expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // ============================================
    // 4. CHECK IF CODE ALREADY USED
    // ============================================
    if (resetToken.used) {
      console.log(`[VerifyResetCode] Code already used: ${resetToken.email}`);
      return NextResponse.json(
        {
          error:
            "This reset code has already been used. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // ============================================
    // 5. VERIFY USER EXISTS
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      console.log(`[VerifyResetCode] User not found: ${resetToken.email}`);

      // Delete orphaned code
      await prisma.passwordResetToken.delete({
        where: { token: code },
      });

      return NextResponse.json(
        { error: "User account not found" },
        { status: 400 },
      );
    }

    // ============================================
    // 6. CODE IS VALID - RETURN SUCCESS
    // ============================================
    // Note: We don't mark it as used yet - that happens when password is actually reset

    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    console.log(
      `[VerifyResetCode] ✅ Code verified successfully: ${user.email}`,
    );
    console.log(`  Code: ${code}`);
    console.log(`  IP: ${ip}`);

    return NextResponse.json(
      {
        success: true,
        message: "Code verified successfully",
        email: user.email,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[VerifyResetCode] Unexpected error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
