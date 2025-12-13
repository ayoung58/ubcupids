"use client";

import { ImportanceLevel } from "@/src/lib/questionnaire-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ImportanceSelectorProps {
  questionId: string;
  value: ImportanceLevel;
  onChange: (value: ImportanceLevel) => void;
  disabled?: boolean;
}

const IMPORTANCE_OPTIONS = [
  { value: 1, label: "Not Important", description: "Doesn't matter much" },
  { value: 2, label: "Somewhat Important", description: "Nice to have" },
  { value: 3, label: "Important", description: "Matters to me" },
  { value: 4, label: "Very Important", description: "Really matters" },
  { value: 5, label: "Deal Breaker", description: "Must match" },
] as const;

export function ImportanceSelector({
  questionId,
  value,
  onChange,
  disabled = false,
}: ImportanceSelectorProps) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <Label
        htmlFor={`importance-${questionId}`}
        className="text-sm text-slate-600 whitespace-nowrap"
      >
        Importance:
      </Label>
      <Select
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val) as ImportanceLevel)}
        disabled={disabled}
      >
        <SelectTrigger
          id={`importance-${questionId}`}
          className="w-[200px] h-9 text-sm"
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
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-slate-500">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
