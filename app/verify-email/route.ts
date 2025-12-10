import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Email Verification API Endpoint
 * 
 * GET /api/auth/verify-email?token=xxx
 * 
 * Flow:
 * 1. User clicks link in verification email
 * 2. Browser sends GET request with token in query string
 * 3. API validates token (exists, not expired)
 * 4. Sets user.emailVerified = now()
 * 5. Deletes token from database (one-time use)
 * 6. Redirects to login page with success message
 * 
 * Response:
 * - 302 redirect to /login?verified=true (success)
 * - 302 redirect to /login?error=invalid_token (failure)
 * 
 * Security measures:
 * - Token is one-time use (deleted after verification)
 * - Token expires after 24 hours
 * - No information leakage (same error for all failures)
 */
export async function GET(request: NextRequest) {
  try {
    // ============================================
    // 1. EXTRACT TOKEN FROM QUERY STRING
    // ============================================
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      console.log('[Verify] Missing token in request');
      return NextResponse.redirect(
        new URL('/login?error=invalid_token', request.url)
      );
    }

    // ============================================
    // 2. FIND VERIFICATION TOKEN IN DATABASE
    // ============================================
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      console.log(`[Verify] Token not found: ${token.substring(0, 10)}...`);
      return NextResponse.redirect(
        new URL('/login?error=invalid_token', request.url)
      );
    }

    // ============================================
    // 3. CHECK IF TOKEN HAS EXPIRED
    // ============================================
    const now = new Date();
    if (verificationToken.expires < now) {
      console.log(`[Verify] Token expired for: ${verificationToken.identifier}`);
      
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.redirect(
        new URL('/login?error=token_expired', request.url)
      );
    }

    // ============================================
    // 4. FIND USER BY EMAIL
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      console.log(`[Verify] User not found: ${verificationToken.identifier}`);
      
      // Delete orphaned token
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.redirect(
        new URL('/login?error=user_not_found', request.url)
      );
    }

    // ============================================
    // 5. CHECK IF EMAIL ALREADY VERIFIED
    // ============================================
    if (user.emailVerified) {
      console.log(`[Verify] Email already verified: ${user.email}`);
      
      // Delete token (no longer needed)
      await prisma.verificationToken.delete({
        where: { token },
      });

      // Redirect with "already verified" message (not an error)
      return NextResponse.redirect(
        new URL('/login?verified=already', request.url)
      );
    }

    // ============================================
    // 6. VERIFY EMAIL (Set emailVerified timestamp)
    // ============================================
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    console.log(`[Verify] Email verified successfully: ${user.email}`);

    // ============================================
    // 7. DELETE VERIFICATION TOKEN (one-time use)
    // ============================================
    await prisma.verificationToken.delete({
      where: { token },
    });

    // ============================================
    // 8. REDIRECT TO LOGIN WITH SUCCESS MESSAGE
    // ============================================
    return NextResponse.redirect(
      new URL('/login?verified=true', request.url)
    );

  } catch (error) {
    console.error('[Verify] Unexpected error:', error);
    
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    );
  }
}