"use client";

import React from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

/**
 * TextInput Component
 *
 * Simple text input for "Other" options or free-form text.
 * Shows character counter when maxLength is provided.
 */
export function TextInput({
  value,
  onChange,
  placeholder = "Please specify...",
  maxLength,
}: TextInputProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {maxLength && (
        <p className="text-xs text-slate-500 text-right">
          {value.length}/{maxLength} characters
        </p>
      )}
    </div>
  );
}
