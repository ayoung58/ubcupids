"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Responses,
  ResponseValue,
  QuestionnaireConfig,
  ImportanceRatings,
  ImportanceLevel,
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
import { InfoPanel } from "./InfoPanel";
import { SkipLink } from "./SkipLink";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Send } from "lucide-react";

interface QuestionnaireFormProps {
  initialResponses: Responses;
  initialImportance?: ImportanceRatings;
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
  // Skip agreement if already submitted OR if user has existing responses (continuing questionnaire)
  const hasExistingResponses = Object.keys(initialResponses).length > 0;
  const [hasAgreed, setHasAgreed] = useState(
    isSubmitted || hasExistingResponses
  );
  const [responses, setResponses] = useState<Responses>(initialResponses);
  const [importance, setImportance] = useState<ImportanceRatings>(
    initialImportance || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(
    new Map()
  );

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
      // Clear validation error for this question when user makes changes
      if (validationErrors.has(questionId)) {
        setValidationErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(questionId);
          return newErrors;
        });
      }
    },
    [isSubmitted, validationErrors]
  );

  // Handle importance change
  const handleImportanceChange = useCallback(
    (questionId: string, value: ImportanceLevel) => {
      if (isSubmitted) return;
      setImportance((prev) => ({
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
      console.log("Submitting questionnaire...", {
        responsesCount: Object.keys(responses).length,
        importanceCount: Object.keys(importance).length,
      });

      const response = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses, importance }),
      });

      console.log("Submit response status:", response.status);

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
        console.error("Submission failed:", data);
        toast({
          title: "Submission Failed",
          description: data.error || "Please complete all required questions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
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
    console.log("Submit button clicked", {
      responsesCount: Object.keys(responses).length,
      progress,
    });

    const errors = validateResponses(responses);
    console.log("Validation errors:", errors);

    if (errors.length > 0) {
      console.error("Validation failed:", errors);

      // Create error map for displaying inline errors
      const errorMap = new Map<string, string>();
      errors.forEach((err) => {
        errorMap.set(err.questionId, err.errorMessage);
      });
      setValidationErrors(errorMap);

      // Scroll to first error
      const firstErrorId = errors[0].questionId;
      const element = document.getElementById(`question-${firstErrorId}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // Focus on the element after scrolling
        setTimeout(() => {
          element.focus();
        }, 500);
      }

      toast({
        title: "Incomplete Questionnaire",
        description: `${errors.length} question${errors.length > 1 ? "s need" : " needs"} attention. Please check the highlighted fields.`,
        variant: "destructive",
      });
      return;
    }

    // Clear any existing validation errors
    setValidationErrors(new Map());

    console.log("Showing submit dialog");
    setShowSubmitDialog(true);
  };

  // Calculate progress
  const totalQuestions = getTotalQuestions();
  const answeredQuestions = Object.keys(responses).filter((key) => {
    const response = responses[key];
    // Count as answered if not empty (matching calculateProgress logic)
    return (
      response &&
      (typeof response !== "string" || response.trim() !== "") &&
      (!Array.isArray(response) || response.length > 0)
    );
  }).length;
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
      <SkipLink />
      <ProgressBar
        value={progress}
        totalQuestions={totalQuestions}
        answeredQuestions={answeredQuestions}
      />

      <main
        id="main-content"
        className="container max-w-4xl py-6 md:py-8 px-4 mx-auto"
      >
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              UBCupids Compatibility Questionnaire
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="flex-shrink-0"
            >
              ← Dashboard
            </Button>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            {isSubmitted
              ? "Your responses have been submitted and are now locked."
              : "Take your time answering these questions. Your progress is saved automatically every 3 seconds."}
          </p>
          {lastSaved && !isSubmitted && (
            <p
              className="text-sm text-gray-500 mt-1"
              role="status"
              aria-live="polite"
            >
              Last saved at {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Info Panel */}
        <InfoPanel agreement={config.agreement} />

        {/* Sections */}
        <div
          className="space-y-6"
          role="form"
          aria-label="Compatibility questionnaire form"
        >
          {(() => {
            let questionIndex = 0;
            return config.sections.map((section) => {
              const startIdx = questionIndex;
              questionIndex += section.questions.length;
              return (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  responses={responses}
                  importance={importance}
                  onChange={handleResponseChange}
                  onImportanceChange={handleImportanceChange}
                  disabled={isSubmitted}
                  validationErrors={validationErrors}
                  globalQuestionStartIndex={startIdx}
                />
              );
            });
          })()}
        </div>
        {/* Action Buttons */}
        {!isSubmitted && (
          <div className="sticky bottom-0 bg-white border-t shadow-lg mt-8 py-3 md:py-4">
            <div className="container max-w-4xl px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Button
                onClick={handleManualSave}
                disabled={isSaving}
                variant="outline"
                size="lg"
                className="min-h-[44px] w-full sm:w-auto"
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

              <Button
                onClick={handleSubmitClick}
                disabled={isSubmitting || progress < 100}
                size="lg"
                className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
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
      </main>

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
