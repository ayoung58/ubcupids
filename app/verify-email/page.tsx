import { Suspense } from "react";
import VerifyEmailContent from "./VerifyEmailContent";

/**
 * Email Verification Page
 *
 * SECURITY FIX: Prevents email scanners from auto-verifying accounts
 *
 * Problem:
 * - Email security scanners (Microsoft Safe Links, Google, etc.) automatically
 *   click links in emails to check for malware/phishing
 * - GET-based verification links were being auto-clicked
 * - This allowed account takeover: register with victim's email, scanner
 *   verifies it, attacker logs in
 *
 * Solution:
 * - User clicks email link → lands on THIS page
 * - Page shows "Verify Email" button
 * - User must click button → sends POST request to verify
 * - Scanners won't click buttons, only follow links
 *
 * Flow:
 * 1. User clicks link in email → GET /verify-email?token=xxx
 * 2. This page loads, shows button
 * 3. User clicks "Verify Email" button
 * 4. POST /api/auth/verify-email with token
 * 5. Email verified, redirect to login
 */
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-slate-600">Loading...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
