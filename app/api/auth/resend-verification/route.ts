import { NextRequest, NextResponse } from "next/server";
import { resendVerificationEmail } from "@/lib/email";

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
 * - 500: Server error
 *
 * Rate limiting: Should be implemented in middleware (Phase 3.5)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Attempt to resend verification email
    try {
      await resendVerificationEmail(normalizedEmail);

      return NextResponse.json(
        { message: "Verification email sent successfully" },
        { status: 200 }
      );
    } catch (error: unknown) {
      // Handle specific errors from resendVerificationEmail
      const errorMessage = error instanceof Error ? error.message : "";
      
      if (errorMessage === "User not found") {
        return NextResponse.json(
          { error: "No account found with this email address" },
          { status: 404 }
        );
      }

      if (errorMessage === "Email already verified") {
        return NextResponse.json(
          { error: "This email is already verified. Please sign in" },
          { status: 400 }
        );
      }

      // Generic error
      throw error;
    }
  } catch (error) {
    console.error("[Resend Verification] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
