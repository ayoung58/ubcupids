import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Email Verification API Endpoint (POST only - Code-based)
 *
 * POST /api/auth/verify-email
 *
 * ⚠️ CRITICAL SECURITY FIX:
 * This endpoint now uses 6-digit codes instead of links to prevent email
 * scanners from auto-verifying accounts.
 *
 * The Problem:
 * - Email security scanners (Microsoft Safe Links, Gmail, corporate filters)
 *   automatically click ALL links in emails to check for malware
 * - Link-based verification was being auto-triggered by these scanners
 * - This caused automatic verification without user action
 * - SECURITY RISK: Attacker could register with victim's email, scanner
 *   verifies it, attacker logs in → Account takeover
 *
 * The Solution:
 * - User receives email with 6-digit code (e.g., 123456)
 * - User visits /verify-email page
 * - User manually enters the 6-digit code
 * - User clicks "Verify Email" button
 * - Frontend sends POST to this endpoint with code
 * - API verifies code and sets emailVerified
 * - Email scanners can't enter codes, only click links
 *
 * Flow:
 * 1. User receives email with 6-digit code
 * 2. User visits /verify-email page
 * 3. User enters code in form
 * 4. User clicks "Verify Email" button
 * 5. Frontend sends POST request to this endpoint
 * 6. API verifies code and updates emailVerified
 * 7. User redirected to login
 *
 * Request body:
 * {
 *   code: string (6-digit numeric code)
 * }
 *
 * Response:
 * - 200: { success: true, message: "Email verified" }
 * - 400: { error: "Invalid or expired code" }
 * - 500: { error: "Server error" }
 */

/**
 * GET handler - Disabled (no longer used with code-based verification)
 */
export async function GET(request: NextRequest) {
  console.log(`[Verify GET] Redirecting to verification page`);

  return NextResponse.redirect(new URL("/verify-email", request.url));
}

/**
 * POST handler - Secure code verification
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. PARSE REQUEST BODY
    // ============================================
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      console.log("[Verify POST] Missing or invalid code in request body");
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      console.log(`[Verify POST] Invalid code format: ${code}`);
      return NextResponse.json(
        { error: "Verification code must be 6 digits" },
        { status: 400 }
      );
    }

    // ============================================
    // 2. FIND VERIFICATION CODE IN DATABASE
    // ============================================
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: code },
    });

    if (!verificationToken) {
      console.log(`[Verify POST] Code not found: ${code}`);
      return NextResponse.json(
        {
          error:
            "Invalid or expired verification code. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. CHECK IF CODE HAS EXPIRED
    // ============================================
    const now = new Date();
    if (verificationToken.expires < now) {
      console.log(
        `[Verify POST] Code expired for: ${verificationToken.identifier}`
      );

      // Delete expired code
      await prisma.verificationToken.delete({
        where: { token: code },
      });

      return NextResponse.json(
        {
          error:
            "This verification code has expired. Please request a new one.",
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

      // Delete orphaned code
      await prisma.verificationToken.delete({
        where: { token: code },
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

      // Delete code (no longer needed)
      await prisma.verificationToken.delete({
        where: { token: code },
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
    console.log(`  Code: ${code}`);
    console.log(`  IP: ${ip}`);
    console.log(`  User-Agent: ${userAgent.substring(0, 80)}...`);

    // ============================================
    // 7. DELETE VERIFICATION CODE (one-time use)
    // ============================================
    await prisma.verificationToken.delete({
      where: { token: code },
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
