import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

/**
 * Registration Page
 * 
 * URL: /register
 * 
 * Features:
 * - UBC email validation (@student.ubc.ca, @alumni.ubc.ca)
 * - Password strength validation
 * - Terms & Conditions acceptance
 * - Redirect to verification pending page after registration
 * 
 * Public page (no authentication required)
 */

export const metadata: Metadata = {
  title: 'Sign Up | UBCupids',
  description: 'Create your UBCupids account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-slate-900 cursor-pointer hover:text-slate-700 transition-colors">
              💘 UBCupids
            </h1>
          </Link>
          <p className="mt-2 text-sm text-slate-600">
            Create your account to get started
          </p>
        </div>

        {/* Register Form */}
        <RegisterForm />

        {/* Footer Links */}
        <div className="text-center text-sm">
          <p className="text-slate-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}