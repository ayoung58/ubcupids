import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Gets current user session in Server Components
 *
 * Works with JWT strategy:
 * - Session data comes from encrypted JWT cookie (not database)
 * - No database query needed (faster)
 * - Returns null if user not authenticated
 *
 * Usage in Server Components:
 * ```typescript
 * import { getCurrentUser } from '@/lib/get-session';
 *
 * export default async function DashboardPage() {
 *   const session = await getCurrentUser();
 *
 *   if (!session) {
 *     redirect('/login');
 *   }
 *
 *   return <div>Hello {session.user.name}</div>;
 * }
 * ```
 */
export async function getCurrentUser() {
  return await getServerSession(authOptions);
}
