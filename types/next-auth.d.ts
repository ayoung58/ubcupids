import { DefaultSession } from "next-auth";

/**
 * Extend NextAuth default session type to include user.id
 *
 * - Default NextAuth session: { user: { name, email, image } }
 * - We need: { user: { id, name, email, image } }
 * - This allows: session.user.id in components
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
