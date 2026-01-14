import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ImportanceScale } from "../ImportanceScale";
import { ImportanceLevel } from "@/types/questionnaire-v2";

describe("ImportanceScale - Dealbreaker Disables Importance", () => {
  const mockOnChange = vi.fn();
  const mockOnDealbreakerToggle = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnDealbreakerToggle.mockClear();
  });

  it("should disable all importance options when dealbreaker is active", () => {
    render(
      <ImportanceScale
        value={ImportanceLevel.IMPORTANT}
        onChange={mockOnChange}
        onDealbreakerToggle={mockOnDealbreakerToggle}
        isDealer={true}
      />
    );

    // All importance buttons should be disabled - find by role and check disabled state
    const buttons = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.textContent?.includes("Not Important") ||
          btn.textContent?.includes("Somewhat") ||
          btn.textContent?.includes("Important") ||
          btn.textContent?.includes("Very Important")
      );

    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("should enable all importance options when dealbreaker is not active", () => {
    render(
      <ImportanceScale
        value={ImportanceLevel.IMPORTANT}
        onChange={mockOnChange}
        onDealbreakerToggle={mockOnDealbreakerToggle}
        isDealer={false}
      />
    );

    // All importance buttons should be enabled - find by role and check enabled state
    const buttons = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.textContent?.includes("Not Important") ||
          btn.textContent?.includes("Somewhat") ||
          btn.textContent?.includes("Important") ||
          btn.textContent?.includes("Very Important")
      );

    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
    });
  });

  it("should have grayed out appearance when dealbreaker is active", () => {
    render(
      <ImportanceScale
        value={ImportanceLevel.IMPORTANT}
        onChange={mockOnChange}
        onDealbreakerToggle={mockOnDealbreakerToggle}
        isDealer={true}
      />
    );

    const buttons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Not Important"));

    expect(buttons[0]).toHaveClass("opacity-50 cursor-not-allowed");
  });

  it("should allow clicking importance when dealbreaker is not active", () => {
    render(
      <ImportanceScale
        value={null}
        onChange={mockOnChange}
        onDealbreakerToggle={mockOnDealbreakerToggle}
        isDealer={false}
      />
    );

    const buttons = screen
      .getAllByRole("button")
      .filter(
        (btn) =>
          btn.textContent?.includes("Important") &&
          !btn.textContent?.includes("Somewhat") &&
          !btn.textContent?.includes("Not") &&
          !btn.textContent?.includes("Very")
      );
    fireEvent.click(buttons[0]);

    expect(mockOnChange).toHaveBeenCalledWith(ImportanceLevel.IMPORTANT);
  });

  it("should not allow clicking importance when dealbreaker is active", () => {
    render(
      <ImportanceScale
        value={ImportanceLevel.IMPORTANT}
        onChange={mockOnChange}
        onDealbreakerToggle={mockOnDealbreakerToggle}
        isDealer={true}
      />
    );

    const buttons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent?.includes("Very Important"));
    fireEvent.click(buttons[0]);

    // Should not call onChange when disabled
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
