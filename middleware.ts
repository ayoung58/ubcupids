import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**

Protected Route Middleware
Protects routes that require authentication:
- /dashboard (and all sub-routes)
- /questionnaire
- /matches
- /submit-proof

How it works:

NextAuth checks if user has valid session (JWT cookie)
- If authenticated → Allow access
- If not authenticated → Redirect to /login

Public routes (not protected):
/
/login
/register
/verify-email
/resend-verification
/verification-pending
/api/* (API routes handle their own auth)
*/

export default withAuth(
  function middleware(req) {
    // This function runs for protected routes
    // User is already authenticated if we reach here
    return NextResponse.next();
  },
  {
    callbacks: {
      // Determine if user is authorized to access the route
      authorized: ({ token }) => {
        // token exists if user is logged in
        return !!token;
      },
    },
    pages: {
      signIn: "/login", // Redirect here if not authenticated
    },
  }
);
