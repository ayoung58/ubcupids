import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/auth";

/**
 * Reset Password API
 *
 * POST /api/auth/reset-password
 *
 * Validates code and updates password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, password } = body;

    if (!code || !password) {
      return NextResponse.json(
        { error: "Code and password are required" },
        { status: 400 },
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Invalid reset code format" },
        { status: 400 },
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
        { status: 400 },
      );
    }

    // ============================================
    // FIND RESET CODE
    // ============================================
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: code },
    });

    if (!resetToken) {
      console.log(`[ResetPassword] Invalid code: ${code}`);
      console.log(`[ResetPassword] Code not found in database`);

      return NextResponse.json(
        { error: "Invalid or expired reset code. Please request a new one." },
        { status: 400 },
      );
    }

    // Check if code expired
    if (resetToken.expires < new Date()) {
      console.log(`[ResetPassword] Expired code for: ${resetToken.email}`);

      // Delete expired code
      await prisma.passwordResetToken.delete({
        where: { token: code },
      });

      return NextResponse.json(
        { error: "Reset code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Check if code already used
    if (resetToken.used) {
      console.log(`[ResetPassword] Code already used: ${resetToken.email}`);
      return NextResponse.json(
        {
          error:
            "This reset code has already been used. Please request a new one.",
        },
        { status: 400 },
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
      // Mark code as used
      prisma.passwordResetToken.update({
        where: { token: code },
        data: { used: true },
      }),
    ]);

    console.log(
      `[ResetPassword] Password updated successfully for: ${user.email}`,
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[ResetPassword] Unexpected error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
