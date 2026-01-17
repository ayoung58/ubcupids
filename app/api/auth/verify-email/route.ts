import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Email Verification API Endpoint (POST only - Security Fix)
 *
 * POST /api/auth/verify-email
 *
 * ⚠️ CRITICAL SECURITY FIX:
 * This endpoint now ONLY accepts POST requests to prevent email scanners
 * from auto-verifying accounts.
 *
 * The Problem:
 * - Email security scanners (Microsoft Safe Links, Gmail, corporate filters)
 *   automatically click ALL links in emails to check for malware
 * - GET-based verification links were being auto-clicked by these scanners
 * - This caused automatic verification without user action
 * - SECURITY RISK: Attacker could register with victim's email, scanner
 *   verifies it, attacker logs in → Account takeover
 *
 * The Solution:
 * - User clicks email link → lands on /verify-email page (GET renders HTML)
 * - Page shows "Verify Email" button (requires user interaction)
 * - User clicks button → sends POST to this endpoint with token
 * - Email scanners won't click buttons, only follow links
 *
 * Flow:
 * 1. User receives email with link: /verify-email?token=xxx
 * 2. User clicks link → page.tsx renders with button
 * 3. User clicks "Verify Email" button
 * 4. Frontend sends POST request to this endpoint
 * 5. API verifies token and sets emailVerified
 * 6. User redirected to login
 *
 * Request body:
 * {
 *   token: string
 * }
 *
 * Response:
 * - 200: { success: true, message: "Email verified" }
 * - 400: { error: "Invalid or expired token" }
 * - 500: { error: "Server error" }
 */

/**
 * GET handler - Disabled for security
 *
 * Previously, GET requests would auto-verify emails.
 * Now, GET just returns an error to prevent scanner exploitation.
 */
export async function GET(request: NextRequest) {
  console.log(
    `[Verify GET] ⚠️  Attempted GET verification blocked - use POST instead`
  );

  return NextResponse.redirect(
    new URL("/login?error=verification_method_changed", request.url)
  );
}

/**
 * POST handler - Secure verification
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. PARSE REQUEST BODY
    // ============================================
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      console.log("[Verify POST] Missing or invalid token in request body");
      return NextResponse.json(
        { error: "Invalid verification link" },
        { status: 400 }
      );
    }

    // ============================================
    // 2. FIND VERIFICATION TOKEN IN DATABASE
    // ============================================
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      console.log(
        `[Verify POST] Token not found: ${token.substring(0, 10)}...`
      );
      return NextResponse.json(
        {
          error:
            "Invalid or expired verification link. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. CHECK IF TOKEN HAS EXPIRED
    // ============================================
    const now = new Date();
    if (verificationToken.expires < now) {
      console.log(
        `[Verify POST] Token expired for: ${verificationToken.identifier}`
      );

      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.json(
        {
          error:
            "This verification link has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. FIND USER BY EMAIL
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      console.log(
        `[Verify POST] User not found: ${verificationToken.identifier}`
      );

      // Delete orphaned token
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.json(
        { error: "User account not found" },
        { status: 400 }
      );
    }

    // ============================================
    // 5. CHECK IF EMAIL ALREADY VERIFIED
    // ============================================
    if (user.emailVerified) {
      console.log(`[Verify POST] Email already verified: ${user.email}`);

      // Delete token (no longer needed)
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Email already verified. You can log in now.",
          alreadyVerified: true,
        },
        { status: 200 }
      );
    }

    // ============================================
    // 6. VERIFY EMAIL (Set emailVerified timestamp)
    // ============================================
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Log detailed information for security auditing
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.log(`[Verify POST] ✅ Email verified successfully: ${user.email}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Token: ${token.substring(0, 10)}...`);
    console.log(`  IP: ${ip}`);
    console.log(`  User-Agent: ${userAgent.substring(0, 80)}...`);

    // ============================================
    // 7. DELETE VERIFICATION TOKEN (one-time use)
    // ============================================
    await prisma.verificationToken.delete({
      where: { token },
    });

    // ============================================
    // 8. SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully! You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Verify POST] Unexpected error:", error);

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
