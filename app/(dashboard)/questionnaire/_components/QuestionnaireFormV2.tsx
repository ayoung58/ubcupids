"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Responses,
  QuestionnaireConfig,
  QuestionResponse,
} from "@/src/lib/questionnaire-types";
import {
  calculateProgress,
  validateResponses,
  getTotalQuestions,
  getSectionProgress,
} from "@/src/lib/questionnaire-utils-v2";
import { SectionRendererV2 } from "./SectionRendererV2";
import { ProgressBar } from "./ProgressBar";
import { SubmitConfirmDialog } from "./SubmitConfirmDialog";
import { PreQuestionnaireAgreement } from "./PreQuestionnaireAgreement";
import { InfoPanel } from "./InfoPanel";
import { SkipLink } from "./SkipLink";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Send } from "lucide-react";

interface QuestionnaireFormProps {
  initialResponses: Responses;
  isSubmitted: boolean;
  config: QuestionnaireConfig;
}

export function QuestionnaireFormV2({
  initialResponses,
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
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
        body: JSON.stringify({ responses }), // V2 format: nested structure
      });

      // Silent success for auto-save (no toast needed)
    } catch {
      // Silent fail for auto-save
      console.error("Auto-save failed");
    }
  }, [isSubmitted, responses]);

  // Auto-save timer
  useEffect(() => {
    if (isSubmitted || !hasAgreed) return;

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timer);
  }, [responses, isSubmitted, hasAgreed, handleAutoSave]);

  // Handle response change - V2 format with QuestionResponse
  const handleResponseChange = useCallback(
    (questionId: string, updatedResponse: QuestionResponse) => {
      if (isSubmitted) return;
      setResponses((prev) => ({
        ...prev,
        [questionId]: updatedResponse,
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

  // Manual save
  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/questionnaire/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }), // V2 format
      });

      if (response.ok) {
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
      });

      const response = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }), // V2 format
      });

      console.log("Submit response status:", response.status);

      if (response.ok) {
        toast({
          title: "Questionnaire Submitted! 🎉",
          description:
            "Your responses have been locked. You can now view your matches!",
        });
        router.push("/questionnaire/success");
        router.refresh();
      } else {
        const data = await response.json();
        console.error("Submission failed:", data);
        toast({
          title: "Submission Failed",
          description: data.error || "Please check your responses.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Submission Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate and show submit dialog
  const handleAttemptSubmit = () => {
    console.log("Attempting submit...", {
      responsesCount: Object.keys(responses).length,
      totalQuestions: getTotalQuestions(),
    });

    const errors = validateResponses(responses);
    console.log("Validation errors:", errors);

    if (errors.length > 0) {
      // Convert array to Map for backward compatibility
      const errorMap = new Map(
        errors.map((err) => [err.questionId, err.errorMessage])
      );
      setValidationErrors(errorMap);
      toast({
        title: "Incomplete Questionnaire",
        description: `Please answer all ${errors.length} required question${errors.length > 1 ? "s" : ""} before submitting.`,
        variant: "destructive",
      });
      // Scroll to first error
      if (errors.length > 0) {
        const firstErrorId = errors[0].questionId;
        const element = document.getElementById(firstErrorId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    // Show confirmation dialog
    setShowSubmitDialog(true);
  };

  // Calculate progress
  const progress = calculateProgress(responses);

  // Show agreement screen first
  if (!hasAgreed) {
    return (
      <PreQuestionnaireAgreement
        agreement={config.agreement}
        onAgree={() => setHasAgreed(true)}
      />
    );
  }

  // Render questionnaire
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Questionnaire</h1>
        <p className="text-muted-foreground">
          {isSubmitted
            ? "Your questionnaire has been submitted. You cannot make changes."
            : "Complete all questions to find your matches. Your progress is automatically saved."}
        </p>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        value={progress}
        totalQuestions={getTotalQuestions()}
        answeredQuestions={
          Object.keys(responses).filter((key) => {
            const resp = responses[key] as QuestionResponse | undefined;
            return resp?.ownAnswer && resp.ownAnswer !== "";
          }).length
        }
      />

      {/* Info Panel */}
      <InfoPanel agreement={config.agreement} />

      {/* Skip Link */}
      {!isSubmitted && progress < 100 && <SkipLink />}

      {/* Sections */}
      <div className="space-y-8">
        {config.sections.map((section) => {
          const sectionProgress = getSectionProgress(section.id, responses);
          return (
            <SectionRendererV2
              key={section.id}
              section={section}
              responses={responses}
              onResponseChange={handleResponseChange}
              validationErrors={validationErrors}
              isSubmitted={isSubmitted}
              sectionProgress={sectionProgress}
            />
          );
        })}
      </div>

      {/* Action Buttons */}
      {!isSubmitted && (
        <div className="sticky bottom-6 flex justify-center gap-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
          <Button
            variant="outline"
            onClick={handleManualSave}
            disabled={isSaving}
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
            onClick={handleAttemptSubmit}
            disabled={isSubmitting || progress < 100}
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
      )}

      {/* Submit Confirmation Dialog */}
      <SubmitConfirmDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
      />

      {/* Scroll to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
