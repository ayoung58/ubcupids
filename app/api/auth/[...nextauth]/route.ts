import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

/**
 * NextAuth Configuration
 * 
 * Architecture decisions:
 * 1. Prisma Adapter: Stores sessions in PostgreSQL (not JWT-only)
 *    - Pro: Can revoke sessions server-side
 *    - Pro: Works with Credentials provider
 *    - Con: Extra database queries (negligible for 500 users)
 * 
 * 2. Credentials Provider: Email + password authentication
 *    - Pro: Full control over authentication logic
 *    - Pro: Can enforce email verification before login
 *    - Con: No OAuth (not needed for UBC-only app)
 * 
 * 3. Database Session Strategy: Session stored in Session table
 *    - Pro: Secure (server controls session validity)
 *    - Con: Requires database lookup on each request (cached by NextAuth)
 */
export const authOptions: NextAuthOptions = {
  // ADAPTER: Connects NextAuth to Database
  adapter: PrismaAdapter(prisma),

  // SESSION STRATEGY
  session: {
    strategy: 'database', // Store sessions in PostgreSQL (required for Credentials provider)
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60, // Update session expiry every 24 hours
  },

  // AUTHENTICATION PROVIDERS
  providers: [
    CredentialsProvider({
      // Provider ID (used in signIn('credentials'))
      id: 'credentials',
      name: 'Email and Password',

      // Form fields shown on default NextAuth sign-in page
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email', 
          placeholder: 'you@student.ubc.ca' 
        },
        password: { 
          label: 'Password', 
          type: 'password' 
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
       * - NextAuth standard: null = invalid credentials
       */
      async authorize(credentials) {
        // Validate that credentials exist
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing email or password');
          return null;
        }

        // Normalize email to prevent case sensitivity issues
        const email = credentials.email.toLowerCase().trim();

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

        // Check 1: User exists
        if (!user) {
          console.log(`[Auth] No user found for email: ${email}`);
          return null;
        }

        // Check 2: Email has been verified
        // Critical: Prevents unverified accounts from logging in
        if (!user.emailVerified) {
          console.log(`[Auth] Email not verified for: ${email}`);
          // Return null with custom error (handle this in the client)
          return null;
        }

        // Check 3: Password is correct
        const isValidPassword = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          console.log(`[Auth] Invalid password for: ${email}`);
          return null;
        }

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


  // CUSTOM PAGES 
  pages: {
    signIn: '/login',     // Custom login page
    error: '/login',      // Redirect errors to login page
    // newUser: '/questionnaire', // Redirect after first sign-in (Phase 2)
  },

  // CALLBACKS: Customize session/JWT behavior
  callbacks: {
    /**
     * session() callback - Adds user data to session object
     * 
     * Called whenever session is accessed (getServerSession, useSession)
     * 
     * @param session - Default session object { user: { name, email, image }, expires }
     * @param user - User object from database (available with database strategy)
     * @returns Enhanced session with user ID
     * 
     * Why we need this:
     * - Default session only has { name, email, image }
     * - We need user.id to query their matches, questionnaire, etc.
     */
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  // SECURITY
  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug logs in development
  debug: process.env.NODE_ENV === 'development',
};

// Export NextAuth handlers for App Router
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };