"use server";

import { signOut } from "next-auth/react";

/**
 * Server Action: Sign Out User
 *
 * Called from client components via form action
 * Signs user out and redirects to home page
 */
export async function signOutAction() {
  // Sign out using NextAuth (clears JWT cookie)
  await signOut({
    redirect: true,
    callbackUrl: "/?signedout=true", // Redirect to home with success param
  });
}
