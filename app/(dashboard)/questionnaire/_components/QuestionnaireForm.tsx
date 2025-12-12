"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Responses,
  ResponseValue,
  QuestionnaireConfig,
} from "@/src/lib/questionnaire-types";
import {
  calculateProgress,
  validateResponses,
  getTotalQuestions,
} from "@/src/lib/questionnaire-utils";
import { SectionRenderer } from "./SectionRenderer";
import { ProgressBar } from "./ProgressBar";
import { SubmitConfirmDialog } from "./SubmitConfirmDialog";
import { PreQuestionnaireAgreement } from "./PreQuestionnaireAgreement";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Send } from "lucide-react";

interface QuestionnaireFormProps {
  initialResponses: Responses;
  initialImportance?: Record<string, string>;
  isSubmitted: boolean;
  config: QuestionnaireConfig;
}

export function QuestionnaireForm({
  initialResponses,
  initialImportance,
  isSubmitted,
  config,
}: QuestionnaireFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [hasAgreed, setHasAgreed] = useState(isSubmitted); // Skip agreement if already submitted
  const [responses, setResponses] = useState<Responses>(initialResponses);
  const [importance] = useState<Record<string, string>>(
    initialImportance || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (isSubmitted || Object.keys(responses).length === 0) return;

    try {
      const response = await fetch("/api/questionnaire/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, importance }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch {
      // Silent fail for auto-save
      console.error("Auto-save failed");
    }
  }, [isSubmitted, responses, importance]);

  // Auto-save timer
  useEffect(() => {
    if (isSubmitted || !hasAgreed) return;

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timer);
  }, [responses, importance, isSubmitted, hasAgreed, handleAutoSave]);

  // Handle response change
  const handleResponseChange = useCallback(
    (questionId: string, value: ResponseValue) => {
      if (isSubmitted) return;
      setResponses((prev) => ({
        ...prev,
        [questionId]: value,
      }));
    },
    [isSubmitted]
  );

  // Manual save
  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/questionnaire/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, importance }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        toast({
          title: "Progress Saved",
          description: "Your questionnaire progress has been saved.",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Save Failed",
          description: data.error || "Failed to save progress.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Save Failed",
        description: "An error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit questionnaire
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, importance }),
      });

      if (response.ok) {
        toast({
          title: "Questionnaire Submitted! 🎉",
          description:
            "Your responses have been locked. You can now view your matches!",
        });
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await response.json();
        toast({
          title: "Submission Failed",
          description: data.error || "Please complete all required questions.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Submission Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  // Validate before showing submit dialog
  const handleSubmitClick = () => {
    const errors = validateResponses(responses);
    if (errors.length > 0) {
      toast({
        title: "Incomplete Questionnaire",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }
    setShowSubmitDialog(true);
  };

  // Calculate progress
  const totalQuestions = getTotalQuestions();
  const answeredQuestions = Object.keys(responses).filter(
    (key) => responses[key] !== undefined && responses[key] !== ""
  ).length;
  const progress = calculateProgress(responses);

  // Show pre-questionnaire agreement
  if (!hasAgreed) {
    return (
      <PreQuestionnaireAgreement
        agreement={config.agreement}
        onAgree={() => setHasAgreed(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar
        value={progress}
        totalQuestions={totalQuestions}
        answeredQuestions={answeredQuestions}
      />

      <div className="container max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            UBCupids Compatibility Questionnaire
          </h1>
          <p className="text-gray-600">
            {isSubmitted
              ? "Your responses have been submitted and are now locked."
              : "Take your time answering these questions. Your progress is saved automatically."}
          </p>
          {lastSaved && !isSubmitted && (
            <p className="text-sm text-gray-500 mt-2">
              Last saved at {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {config.sections.map((section) => (
            <SectionRenderer
              key={section.id}
              section={section}
              responses={responses}
              onChange={handleResponseChange}
              disabled={isSubmitted}
            />
          ))}
        </div>

        {/* Action Buttons */}
        {!isSubmitted && (
          <div className="sticky bottom-0 bg-white border-t shadow-lg mt-8 py-4">
            <div className="container max-w-4xl flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleManualSave}
                  disabled={isSaving}
                  variant="outline"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Progress
                    </>
                  )}
                </Button>
              </div>

              <Button
                onClick={handleSubmitClick}
                disabled={isSubmitting || progress < 100}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Questionnaire
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <SubmitConfirmDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
