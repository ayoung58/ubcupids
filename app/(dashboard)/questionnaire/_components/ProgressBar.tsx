"use client";

import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  totalQuestions: number;
  answeredQuestions: number;
}

export function ProgressBar({
  value,
  totalQuestions,
  answeredQuestions,
}: ProgressBarProps) {
  return (
    <div className="sticky top-0 bg-white z-10 py-3 md:py-4 border-b shadow-sm">
      <div className="container max-w-4xl px-4 mx-auto">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
          <span className="text-xs md:text-sm font-medium text-gray-700">
            Your Progress
          </span>
          <span className="text-xs md:text-sm text-gray-600">
            {answeredQuestions} of {totalQuestions} answered
          </span>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <Progress value={value} className="h-2 md:h-2.5 flex-1" />
          <span className="text-xs md:text-sm font-bold text-primary min-w-[40px] md:min-w-[45px] text-right">
            {value}%
          </span>
        </div>
      </div>
    </div>
  );
}
