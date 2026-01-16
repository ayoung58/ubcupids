import { describe, it, expect } from "vitest";
import { getPreferenceText, PREFERENCE_TEXT } from "../preference-text";

describe("Preference Text Dictionary", () => {
  it("should have preference text for all questionnaire questions with preferences", () => {
    // Questions that should have preference text (Q3-Q36, excluding Q1, Q2)
    const expectedQuestions = [
      "q3",
      "q4",
      "q5",
      "q6",
      "q7",
      "q8",
      "q9a",
      "q9b",
      "q10",
      "q11",
      "q12",
      "q13",
      "q14",
      "q15",
      "q16",
      "q17",
      "q18",
      "q19",
      "q20",
      "q21",
      "q22",
      "q23",
      "q24",
      "q25",
      "q26",
      "q27",
      "q28",
      "q29",
      "q30",
      "q31",
      "q32",
      "q33",
      "q34",
      "q35",
      "q36",
    ];

    expectedQuestions.forEach((questionId) => {
      expect(PREFERENCE_TEXT[questionId]).toBeDefined();
      expect(PREFERENCE_TEXT[questionId]).not.toBe("");
    });
  });

  it("should have preference text for Q10 (Exercise)", () => {
    expect(PREFERENCE_TEXT.q10).toBeDefined();
    expect(PREFERENCE_TEXT.q10).toBe(
      "Compared to me, I prefer my match's physically activity level to be..."
    );
  });

  it("should return the correct preference text for known questions", () => {
    expect(getPreferenceText("q3")).toBe(
      "I prefer my match to have one of these orientations"
    );
    expect(getPreferenceText("q11")).toBe(
      "I prefer my match's relationship style to be"
    );
    expect(getPreferenceText("q21")).toBe(
      "I prefer my match to show love in ways I like to receive it"
    );
  });

  it("should return default text for unknown questions", () => {
    expect(getPreferenceText("q99")).toBe("match these preferences");
    expect(getPreferenceText("unknown")).toBe("match these preferences");
  });

  it("should have meaningful, user-friendly text for all entries", () => {
    Object.entries(PREFERENCE_TEXT).forEach(([questionId, text]) => {
      // Text should start with "I prefer my match" (except Q10 which has special format)
      if (questionId === "q10") {
        expect(text).toMatch(/^Compared to me, I prefer my match/);
      } else {
        expect(text).toMatch(/^I prefer my match/);
      }

      // Text should end with "..." or no punctuation
      expect(text).toMatch(/\.\.\.$|^[^.!?]*$/);

      // Text should be at least 10 characters
      expect(text.length).toBeGreaterThan(10);
    });
  });
});
