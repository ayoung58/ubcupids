import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Protected Route Middleware
 *
 * Protects routes that require authentication:
 * - /dashboard (and all sub-routes)
 * - /questionnaire
 * - /matches
 * - /submit-proof
 *
 * How it works:
 * 1. NextAuth checks if user has valid session (JWT cookie)
 * 2. If authenticated → Allow access
 * 3. If not authenticated → Redirect to /login
 *
 * Public routes (not protected):
 * - /
 * - /login
 * - /register
 * - /verify-email
 * - /resend-verification
 * - /verification-pending
 * - /api/* (API routes handle their own auth)
 */

export default withAuth(
  function middleware(req) {
    // This function runs for protected routes
    // User is already authenticated if we reach here
    //
    // Note: 'req' parameter is intentionally unused in this simple case
    // It's available if you need to inspect the request (URL, headers, etc.)
    // For example, you could add role-based access control:
    //
    // const token = await getToken({ req });
    // if (req.nextUrl.pathname.startsWith('/admin') && token?.role !== 'admin') {
    //   return NextResponse.redirect(new URL('/dashboard', req.url));
    // }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Determine if user is authorized to access the route
      authorized: ({ token }) => {
        // token exists if user is logged in
        // token is the JWT payload (contains user.id, email, name)
        return !!token;
      },
    },
    pages: {
      signIn: "/login", // Redirect here if not authenticated
    },
  }
);

/**
 * Matcher Configuration
 *
 * Specifies which routes this middleware applies to
 *
 * Protected routes:
 * - /dashboard/:path* → Dashboard and all sub-pages (e.g., /dashboard/settings)
 * - /questionnaire → Questionnaire form
 * - /matches → Match results page
 * - /submit-proof → Receipt upload for prize draw
 *
 * Why these specific routes:
 * - Dashboard: Main authenticated area
 * - Questionnaire: Contains personal data, must be authenticated
 * - Matches: Shows sensitive matching results
 * - Submit-proof: Requires authenticated user to link uploads
 *
 * Routes NOT matched (public):
 * - / (home page)
 * - /login, /register (auth pages)
 * - /verify-email, /resend-verification (email verification)
 * - /api/* (API routes handle their own authentication)
 */
export const config = {
  matcher: ["/dashboard/:path*", "/questionnaire", "/matches", "/submit-proof"],
};
