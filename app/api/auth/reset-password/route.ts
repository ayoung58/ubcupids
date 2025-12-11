import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/auth";

/**
 * Reset Password API
 *
 * POST /api/auth/reset-password
 *
 * Validates token and updates password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDATE PASSWORD STRENGTH
    // ============================================
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: "Password does not meet requirements",
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // ============================================
    // FIND RESET TOKEN
    // ============================================
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      console.log(
        `[ResetPassword] Invalid token: ${token.substring(0, 10)}...`
      );
      console.log(`[ResetPassword] Token not found in database`);

      // Let's also check what tokens do exist
      const allTokens = await prisma.passwordResetToken.findMany({
        select: { token: true, email: true, expires: true, used: true },
      });
      console.log(`[ResetPassword] Total tokens in DB: ${allTokens.length}`);
      allTokens.slice(0, 5).forEach((t, i) => {
        console.log(
          `[ResetPassword] Token ${i}: ${t.token.substring(0, 10)}... Email: ${t.email} Used: ${t.used}`
        );
      });

      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if token expired
    if (resetToken.expires < new Date()) {
      console.log(`[ResetPassword] Expired token for: ${resetToken.email}`);

      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if token already used
    if (resetToken.used) {
      console.log(`[ResetPassword] Token already used: ${resetToken.email}`);
      return NextResponse.json(
        {
          error:
            "This reset link has already been used. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // FIND USER
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      console.log(`[ResetPassword] User not found: ${resetToken.email}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ============================================
    // HASH NEW PASSWORD
    // ============================================
    const hashedPassword = await hashPassword(password);

    // ============================================
    // UPDATE PASSWORD
    // ============================================
    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
      }),
    ]);

    console.log(
      `[ResetPassword] Password updated successfully for: ${user.email}`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ResetPassword] Unexpected error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
