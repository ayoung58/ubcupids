"use client";

import { ImportanceLevel } from "@/src/lib/questionnaire-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportanceSelectorProps {
  questionId: string;
  value: ImportanceLevel;
  onChange: (value: ImportanceLevel) => void;
  disabled?: boolean;
}

const IMPORTANCE_OPTIONS = [
  { value: 1, label: "Not Important" },
  { value: 2, label: "Somewhat Important" },
  { value: 3, label: "Important" },
  { value: 4, label: "Very Important" },
  { value: 5, label: "Deal Breaker" },
] as const;

export function ImportanceSelector({
  questionId,
  value,
  onChange,
  disabled = false,
}: ImportanceSelectorProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(val) => onChange(parseInt(val) as ImportanceLevel)}
      disabled={disabled}
    >
      <SelectTrigger
        id={`importance-${questionId}`}
        className="w-[160px] h-8 text-xs"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {IMPORTANCE_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value.toString()}
            className="cursor-pointer"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
