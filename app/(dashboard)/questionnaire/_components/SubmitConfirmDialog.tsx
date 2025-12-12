"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: SubmitConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">
            Submit Your Questionnaire?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base space-y-3">
            <p>
              Once submitted, you will{" "}
              <strong className="text-gray-900">
                not be able to edit your responses
              </strong>
              . You&apos;ll only be able to view them.
            </p>
            <p>
              Your responses will be used to match you with compatible people
              for Valentine&apos;s Day 2026.
            </p>
            <p className="text-sm text-gray-600">
              Are you sure you want to continue?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Go Back</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-primary"
          >
            {isLoading ? "Submitting..." : "Yes, Submit My Responses"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
