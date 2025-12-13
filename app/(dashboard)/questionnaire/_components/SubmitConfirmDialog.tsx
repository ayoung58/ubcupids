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
import { Loader2 } from "lucide-react";

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
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-gray-900">
            Confirm Submission
          </AlertDialogTitle>
          <div className="text-base space-y-4 pt-2">
            <p className="text-gray-700">
              Once you submit, you will{" "}
              <strong className="text-red-600 font-semibold">
                not be able to edit your responses
              </strong>
              . Your answers will be locked and used for matching.
            </p>
            <p className="text-gray-600">
              Your responses will be encrypted and used to match you with
              compatible people for Valentine&apos;s Day 2026.
            </p>
            <p className="text-sm font-medium text-gray-900">
              Are you ready to submit?
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300"
          >
            Return to Questionnaire
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Confirm Submission"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
