"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Heart, ArrowRight } from "lucide-react";

export default function QuestionnaireSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-2 border-pink-200 shadow-xl">
        <CardContent className="p-8 md:p-12 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-green-500 rounded-full p-6">
                <CheckCircle className="h-16 w-16 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Questionnaire Submitted! 🎉
            </h1>
            <p className="text-lg text-slate-600">
              Thank you for completing the UBCupids compatibility questionnaire!
            </p>
          </div>

          {/* Confirmation Message */}
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-6 space-y-3">
            <Heart className="h-8 w-8 mx-auto text-pink-500" />
            <p className="text-slate-700 font-medium">
              Your responses have been encrypted and securely saved
            </p>
            <p className="text-sm text-slate-600">
              Our algorithm and cupids are now working to find your perfect
              matches!
            </p>
          </div>

          {/* What's Next */}
          <div className="text-left bg-white rounded-lg p-6 space-y-3 border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              What happens next?
            </h2>
            <div className="space-y-2">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm">
                  1
                </div>
                <p className="text-slate-700 flex-1">
                  <strong>Now - Jan 31:</strong> Relax while others complete
                  their questionnaires
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                  2
                </div>
                <p className="text-slate-700 flex-1">
                  <strong>Feb 1-6:</strong> Human cupids review profiles and
                  create matches
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                  3
                </div>
                <p className="text-slate-700 flex-1">
                  <strong>Feb 7:</strong> Your matches will be revealed! 💘
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => router.push("/dashboard")}
              className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold px-8"
            >
              Back to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-slate-500 pt-4 border-t">
            Your responses are locked and cannot be edited. If you need to make
            changes, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
