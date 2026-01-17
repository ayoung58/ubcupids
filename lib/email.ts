import { Resend } from "resend";
import VerificationEmail from "@/emails/VerificationEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import { RESEND_API_KEY, RESEND_FROM_EMAIL, NEXT_PUBLIC_APP_URL } from "./env";

/**
 * Resend client configuration
 *
 * Resend is used for transactional emails:
 * - Email verification
 * - Match notifications (Phase 3)
 * - Password reset (Post-MVP)
 *
 * Free tier: 3,000 emails/month (sufficient for MVP)
 *
 * Setup requirements:
 * - RESEND_API_KEY in .env
 * - RESEND_FROM_EMAIL in .env (defaults to onboarding@resend.dev for testing)
 * - For production: Verify custom domain in Resend dashboard
 */
const resend = new Resend(RESEND_API_KEY);

/**
 * Sends email verification code to new user
 *
 * @param email - User's email address
 * @param firstName - User's first name (for personalization)
 * @param code - 6-digit verification code
 *
 * Email contains:
 * - Personalized greeting
 * - 6-digit verification code
 * - Code expiry notice (24 hours)
 * - Support contact info
 *
 * Throws error if email fails to send (caller should handle)
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string | null,
  code: string
): Promise<void> {
  try {
    // Send email using React Email component
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL || "UBCupids <support@ubcupids.org>",
      to: email,
      subject: "Verify your UBCupids account",
      react: VerificationEmail({
        firstName,
        verificationCode: code,
      }),
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(
      `[Email] Verification email sent successfully. Email ID: ${data?.id}`
    );
  } catch (error) {
    console.error(
      "[Email] Unexpected error sending verification email:",
      error
    );
    throw error;
  }
}

/**
 * Resends verification email if user didn't receive it
 *
 * Use cases:
 * - Email went to spam
 * - Code expired (24 hours)
 * - User accidentally deleted email
 *
 * Security: Rate limit this endpoint to prevent abuse
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  // Find user by email
  const { prisma } = await import("@/lib/prisma");

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email already verified");
  }

  // Delete old verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Generate new 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  // Create new verification code (stored in token field)
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: code,
      expires: expires,
    },
  });

  // Send email with code
  await sendVerificationEmail(user.email, user.firstName, code);
}

/**
 * Sends password reset link to user
 *
 * @param email - User's email address
 * @param firstName - User's first name
 * @param token - Password reset token
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string | null,
  token: string
): Promise<void> {
  const resetUrl = `${NEXT_PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL || "UBCupids <onboarding@resend.dev>",
      to: email,
      subject: "Reset your UBCupids password",
      react: PasswordResetEmail({
        firstName,
        resetUrl,
      }),
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(
      `[Email] Password reset email sent successfully. Email ID: ${data?.id}`
    );
  } catch (error) {
    console.error(
      "[Email] Unexpected error sending password reset email:",
      error
    );
    throw error;
  }
}
