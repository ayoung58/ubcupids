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
import { AlertTriangle } from "lucide-react";

interface DealBreakerConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  questionText?: string;
}

/**
 * DealBreakerConfirmDialog Component
 *
 * Confirmation modal shown when user marks a preference as a dealbreaker
 * for the first time. Helps prevent accidental dealbreakers by explaining
 * the consequences.
 *
 * Educates users that dealbreakers:
 * - Automatically reject matches who don't meet the requirement
 * - Cannot be overridden by high importance ratings
 * - May significantly reduce the number of potential matches
 * - Are applied before any compatibility scoring
 */
export function DealBreakerConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  questionText,
}: DealBreakerConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Mark as Dealbreaker?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-left">
            <p className="font-medium text-gray-900">
              {questionText
                ? `You're about to mark "${questionText}" as a dealbreaker.`
                : "You're about to mark this preference as a dealbreaker."}
            </p>

            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-800">⚠️ This means:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>
                  Potential matches who don&apos;t meet this requirement will be{" "}
                  <strong>automatically rejected</strong>
                </li>
                <li>
                  This happens <strong>before</strong> any compatibility scoring
                </li>
                <li>
                  You may receive <strong>fewer matches</strong> or possibly no
                  matches
                </li>
                <li>
                  Even highly compatible people will be excluded if they
                  don&apos;t meet this requirement
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <p className="text-amber-900">
                <strong>💡 Tip:</strong> Consider using &quot;Very
                Important&quot; instead if you&apos;re flexible. Dealbreakers
                should only be used for absolute non-negotiables.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Yes, Mark as Dealbreaker
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
