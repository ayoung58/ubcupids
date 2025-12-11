import { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password | UBCupids',
  description: 'Reset your UBCupids password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer">
              💘 UBCupids
            </h1>
          </Link>
          <p className="mt-2 text-sm text-slate-600">
            Reset your password
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="text-slate-600 hover:text-slate-900 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}