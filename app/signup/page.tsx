import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Target, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SIGNUP_DEADLINE } from "@/lib/matching/config";

export const metadata: Metadata = {
  title: "Sign Up | UBCupids",
  description: "Choose your account type",
};

export default function SignupPage() {
  // Check if signups are closed
  const now = new Date();
  const signupsClosed = now > SIGNUP_DEADLINE;
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <Link href="/">
            <h1 className="text-4xl font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer">
              💘 UBCupids
            </h1>
          </Link>
          <p className="mt-2 text-lg text-slate-600">Choose your path</p>
        </div>

        {/* Sign-ups Closed Alert */}
        {signupsClosed && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              Sign-ups have closed for 2026. Registration is no longer
              available.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Cupid Account */}
          <Link
            href="/register?type=cupid"
            className={signupsClosed ? "pointer-events-none" : ""}
          >
            <Card
              className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-500 h-full ${signupsClosed ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <CardContent className="pt-12 pb-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-pink-100 rounded-full">
                    <Target className="h-12 w-12 text-pink-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  I want to be a Cupid 🏹
                </h2>
                <p className="text-slate-600 text-lg">
                  Help match people anonymously
                </p>
                <div className="pt-4">
                  <div className="inline-block px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors">
                    Sign up as Cupid
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Match Account */}
          <Link
            href="/register?type=match"
            className={signupsClosed ? "pointer-events-none" : ""}
          >
            <Card
              className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-rose-500 h-full ${signupsClosed ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <CardContent className="pt-12 pb-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-rose-100 rounded-full">
                    <Heart className="h-12 w-12 text-rose-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  I want to be matched 💖
                </h2>
                <p className="text-slate-600 text-lg">
                  Let Cupids and the algorithm find matches for me
                </p>
                <div className="pt-4">
                  <div className="inline-block px-6 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors">
                    Sign up to be matched
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center text-sm text-slate-600 space-y-2">
          <p className="font-medium">Curious about both?</p>
          <p>
            You can sign up for one account and link the other one in your
            profile.
          </p>
        </div>

        <div className="text-center text-sm">
          <p className="text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
