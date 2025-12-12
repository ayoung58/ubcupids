/**
 * Skip Link Component
 * Allows keyboard users to skip navigation and jump to main content
 * Improves accessibility per WCAG 2.1 standards
 */
"use client";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      Skip to main content
    </a>
  );
}
