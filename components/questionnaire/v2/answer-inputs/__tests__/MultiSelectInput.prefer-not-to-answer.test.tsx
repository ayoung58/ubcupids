import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MultiSelectInput } from "../MultiSelectInput";

describe("MultiSelectInput - Prefer Not to Answer Mutual Exclusivity", () => {
  const mockOnChange = vi.fn();
  const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
    { value: "prefer_not_to_answer", label: "Prefer not to answer" },
  ];

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should deselect all other options when prefer_not_to_answer is selected", () => {
    const { rerender } = render(
      <MultiSelectInput
        options={options}
        values={["option1", "option2"]}
        onChange={mockOnChange}
      />
    );

    // Click on "Prefer not to answer"
    const preferNotCheckbox = screen.getByLabelText("Prefer not to answer");
    fireEvent.click(preferNotCheckbox);

    // Should call onChange with only "prefer_not_to_answer"
    expect(mockOnChange).toHaveBeenCalledWith(["prefer_not_to_answer"]);
  });

  it("should deselect prefer_not_to_answer when another option is selected", () => {
    render(
      <MultiSelectInput
        options={options}
        values={["prefer_not_to_answer"]}
        onChange={mockOnChange}
      />
    );

    // Click on "Option 1"
    const option1Checkbox = screen.getByLabelText("Option 1");
    fireEvent.click(option1Checkbox);

    // Should call onChange with only "option1" (prefer_not_to_answer removed)
    expect(mockOnChange).toHaveBeenCalledWith(["option1"]);
  });

  it("should allow multiple regular options without prefer_not_to_answer", () => {
    render(
      <MultiSelectInput
        options={options}
        values={["option1"]}
        onChange={mockOnChange}
      />
    );

    // Click on "Option 2"
    const option2Checkbox = screen.getByLabelText("Option 2");
    fireEvent.click(option2Checkbox);

    // Should call onChange with both options
    expect(mockOnChange).toHaveBeenCalledWith(["option1", "option2"]);
  });

  it("should respect max selections when deselecting prefer_not_to_answer", () => {
    render(
      <MultiSelectInput
        options={options}
        values={["prefer_not_to_answer"]}
        onChange={mockOnChange}
        maxSelections={2}
      />
    );

    // Click on "Option 1"
    const option1Checkbox = screen.getByLabelText("Option 1");
    fireEvent.click(option1Checkbox);

    // Should replace prefer_not_to_answer with option1
    expect(mockOnChange).toHaveBeenCalledWith(["option1"]);
  });

  it("should handle toggling prefer_not_to_answer off normally", () => {
    render(
      <MultiSelectInput
        options={options}
        values={["prefer_not_to_answer"]}
        onChange={mockOnChange}
      />
    );

    // Click on "Prefer not to answer" again to deselect
    const preferNotCheckbox = screen.getByLabelText("Prefer not to answer");
    fireEvent.click(preferNotCheckbox);

    // Should call onChange with empty array
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });
});
