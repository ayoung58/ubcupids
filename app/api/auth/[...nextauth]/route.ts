import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { NEXTAUTH_SECRET, isDevelopment } from "@/lib/env";

/**
 * NextAuth Configuration
 *
 * Using JWT session strategy (required for CredentialsProvider)
 *
 * Architecture decisions:
 * 1. JWT Session Strategy: Session data stored in encrypted JWT cookie
 *    - Pro: No database query on every request (faster)
 *    - Pro: Works with CredentialsProvider (required)
 *    - Con: Can't revoke sessions server-side (acceptable trade-off)
 *    - Con: JWT size limit ~4KB (our user data fits easily)
 *
 * 2. Hybrid Approach: JWT sessions + Prisma for user data
 *    - Sessions: Stored in JWT cookie (not database)
 *    - User data: Still in PostgreSQL via Prisma
 *    - Best of both worlds for credentials-based auth
 *
 * 3. Session stored in JWT but user verification on every authorize() call
 *    - Each login checks: user exists, email verified, password correct
 *    - Once logged in, session is valid until expiry
 */
export const authOptions: NextAuthOptions = {
  // ============================================
  // ADAPTER: Still use Prisma for user/account data
  // ============================================
  // Note: Adapter is only used for OAuth providers (not Credentials)
  // We keep it for future OAuth expansion (Google, etc.)
  adapter: PrismaAdapter(prisma),

  // ============================================
  // SESSION STRATEGY: JWT (REQUIRED FOR CREDENTIALS)
  // ============================================
  session: {
    strategy: "jwt", // Changed from 'database' to 'jwt'
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60, // Update JWT expiry every 24 hours
  },

  // ============================================
  // AUTHENTICATION PROVIDERS
  // ============================================
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@student.ubc.ca",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      /**
       * authorize() - Core authentication logic
       *
       * Called when user attempts to log in via signIn('credentials', {...})
       *
       * @param credentials - { email, password } from login form
       * @returns User object if valid, null if invalid
       *
       * Security checks performed:
       * 1. User exists in database
       * 2. Email has been verified
       * 3. Password matches hashed password in database
       *
       * IMPORTANT: This only runs during login
       * - Subsequent requests validate JWT token (no database query)
       * - JWT contains user.id, name, email (from jwt() callback)
       */
      async authorize(credentials) {
        // Validate that credentials exist
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing email or password");
          throw new Error("CredentialsSignin");
        }

        // Normalize email to prevent case sensitivity issues
        const email = credentials.email.toLowerCase().trim();

        // ============================================
        // RATE LIMITING: Check login attempts
        // ============================================
        const rateLimitResult = await checkRateLimit(email, "login-attempt", {
          maxAttempts: 5, // 5 attempts
          windowMinutes: 15, // per 15 minutes
        });

        if (!rateLimitResult.allowed) {
          console.log(`[Auth] Rate limit exceeded for: ${email}`);
          throw new Error("TooManyAttempts");
        }

        console.log(
          `[Auth] Rate limit check passed. Remaining: ${rateLimitResult.remaining}`
        );

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password: true,
            emailVerified: true,
            firstName: true,
            lastName: true,
          },
        });

        // Check 1: User exists and password is correct (combined for security)
        // We check both before revealing which is wrong to prevent user enumeration
        if (!user) {
          console.log(`[Auth] No user found for email: ${email}`);
          throw new Error("CredentialsSignin");
        }

        // Check password before checking verification status
        const isValidPassword = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          console.log(`[Auth] Invalid password for: ${email}`);
          throw new Error("CredentialsSignin");
        }

        // Check 2: Email has been verified
        // Critical: Prevents unverified accounts from logging in
        // We only reveal this AFTER confirming credentials are correct
        if (!user.emailVerified) {
          console.log(`[Auth] Email not verified for: ${email}`);
          throw new Error("EmailNotVerified");
        }

        // ============================================
        // SUCCESS: Reset rate limit on successful login
        // ============================================
        await prisma.rateLimit.deleteMany({
          where: {
            identifier: email,
            action: "login-attempt",
          },
        });

        // Success: Return user object (password excluded)
        console.log(`[Auth] Login successful for: ${email}`);
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        };
      },
    }),
  ],

  // ============================================
  // CUSTOM PAGES
  // ============================================
  pages: {
    signIn: "/login", // Custom login page
    error: "/login", // Redirect errors to login page
  },

  // ============================================
  // CALLBACKS: Customize JWT/session behavior
  // ============================================
  callbacks: {
    /**
     * jwt() callback - Runs when JWT is created or updated
     *
     * Called:
     * - After successful authorize() (user object available)
     * - On every request (to update/validate token)
     *
     * @param token - Existing JWT token
     * @param user - User object from authorize() (only on sign-in)
     * @returns Enhanced token with user.id
     *
     * Why we need this:
     * - Default JWT only has { name, email, picture }
     * - We need user.id to query their matches, questionnaire, etc.
     * - This adds id to JWT so it's available in session
     */
    async jwt({ token, user }) {
      // On sign-in (user object exists), add user.id to token
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * session() callback - Runs when session is accessed
     *
     * Called whenever:
     * - useSession() is called (client-side)
     * - getServerSession() is called (server-side)
     *
     * @param session - Default session object
     * @param token - JWT token with our custom id field
     * @returns Enhanced session with user.id
     *
     * This makes session.user.id available throughout the app
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // ============================================
  // SECURITY
  // ============================================
  secret: NEXTAUTH_SECRET,

  // Enable debug logs in development
  debug: isDevelopment(),
};

// Export NextAuth handlers for App Router
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
