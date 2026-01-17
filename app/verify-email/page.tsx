import { Suspense } from "react";
import VerifyEmailContent from "./VerifyEmailContent";

/**
 * Email Verification Page
 *
 * SECURITY FIX: Uses code-based verification instead of link-based
 *
 * Why code-based?
 * - Email security scanners (Microsoft Safe Links, Google, etc.) automatically
 *   click links in emails to check for malware
 * - Link-based verification was being auto-triggered by these scanners
 * - Code-based verification requires manual input, preventing auto-verification
 *
 * Flow:
 * 1. User registers → receives email with 6-digit code
 * 2. User visits this page
 * 3. User enters code
 * 4. Code is verified via POST to /api/auth/verify-email
 * 5. User is verified and redirected to login
 */
export default function VerifyEmailPage() {
  return (
    <VerifyEmailContent />
  );
}
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
