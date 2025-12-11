"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ArrowLeft, Loader2 } from "lucide-react";

/**
 * Sign Out Confirmation Page
 *
 * Custom sign-out page that allows users to:
 * - Confirm sign-out with a clear button
 * - Cancel and return to dashboard without using browser back button
 */

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        redirect: true,
        callbackUrl: "/login?signedout=true",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign Out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-slate-600">
            Are you sure you want to sign out?
          </p>

          {/* Sign Out Button */}
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="destructive"
            className="w-full gap-2"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Yes, Sign Out
              </>
            )}
          </Button>

          {/* Cancel / Back to Dashboard */}
          <Link href="/dashboard" className="block">
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={isSigningOut}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
