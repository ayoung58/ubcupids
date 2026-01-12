import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuestionnaireV2 } from "@/components/questionnaire/v2/QuestionnaireV2";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for API calls
global.fetch = vi.fn();

describe("QuestionnaireV2 Tutorial Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === "/api/questionnaire/v2/load") {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({}),
        });
      }
      if (url === "/api/tutorial/complete") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      if (url.includes("/api/questionnaire/v2/save")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  describe("Tutorial Visibility", () => {
    it("should show tutorial on first visit when tutorialCompleted is false", async () => {
      render(
        <QuestionnaireV2
          initialResponses={{}}
          isSubmitted={false}
          tutorialCompleted={false}
        />
      );

      // Wait for loading to finish and tutorial to appear
      await waitFor(
        () => {
          expect(
            screen.getByText("Welcome to the Questionnaire!")
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should not show tutorial when tutorialCompleted is true", async () => {
      render(
        <QuestionnaireV2
          initialResponses={{}}
          isSubmitted={false}
          tutorialCompleted={true}
        />
      );

      // Wait for loading to finish
      await waitFor(
        () => {
          const loadingText = screen.queryByText("Loading questionnaire...");
          return !loadingText;
        },
        { timeout: 3000 }
      );

      // Wait a bit to ensure tutorial doesn't appear
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(
        screen.queryByText("Welcome to the Questionnaire!")
      ).not.toBeInTheDocument();
    });
  });

  describe("Tutorial Interaction", () => {
    it("should hide tutorial when Skip button is clicked", async () => {
      render(
        <QuestionnaireV2
          initialResponses={{}}
          isSubmitted={false}
          tutorialCompleted={false}
        />
      );

      await waitFor(
        () => {
          expect(
            screen.getByText("Welcome to the Questionnaire!")
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const skipButton = screen.getByRole("button", { name: /skip tutorial/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Welcome to the Questionnaire!")
        ).not.toBeInTheDocument();
      });
    });

    it("should call API to mark tutorial complete", async () => {
      render(
        <QuestionnaireV2
          initialResponses={{}}
          isSubmitted={false}
          tutorialCompleted={false}
        />
      );

      await waitFor(
        () => {
          expect(
            screen.getByText("Welcome to the Questionnaire!")
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const skipButton = screen.getByRole("button", { name: /skip tutorial/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/tutorial/complete",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tutorialId: "questionnaire-v2" }),
          })
        );
      });
    });
  });

  describe("Questionnaire with Tutorial", () => {
    it("should not show tutorial when questionnaire is submitted", async () => {
      render(
        <QuestionnaireV2
          initialResponses={{}}
          isSubmitted={true}
          tutorialCompleted={false}
        />
      );

      await waitFor(
        () => {
          const loadingText = screen.queryByText("Loading questionnaire...");
          return !loadingText;
        },
        { timeout: 3000 }
      );

      // Tutorial should not appear for submitted questionnaires
      expect(
        screen.queryByText("Welcome to the Questionnaire!")
      ).not.toBeInTheDocument();

      // Should see read-only banner instead
      expect(screen.getByText("Questionnaire Submitted")).toBeInTheDocument();
    });
  });
});
