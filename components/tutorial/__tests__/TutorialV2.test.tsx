import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TutorialV2, TutorialStep } from "@/components/tutorial/TutorialV2";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch for API calls
global.fetch = vi.fn();

const mockSteps: TutorialStep[] = [
  {
    id: "step1",
    title: "First Step",
    content: "This is the first step content",
    target: "[data-test='target1']",
    position: "bottom",
  },
  {
    id: "step2",
    title: "Second Step",
    content: "This is the second step content",
    target: "[data-test='target2']",
    position: "top",
  },
  {
    id: "step3",
    title: "Third Step",
    content: "This is the third step content",
    target: "[data-test='target3']",
    position: "right",
  },
];

describe("TutorialV2 Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Create target elements in DOM
    const target1 = document.createElement("div");
    target1.setAttribute("data-test", "target1");
    target1.style.position = "absolute";
    target1.style.top = "100px";
    target1.style.left = "100px";
    target1.style.width = "200px";
    target1.style.height = "50px";
    document.body.appendChild(target1);

    const target2 = document.createElement("div");
    target2.setAttribute("data-test", "target2");
    target2.style.position = "absolute";
    target2.style.top = "200px";
    target2.style.left = "150px";
    target2.style.width = "150px";
    target2.style.height = "40px";
    document.body.appendChild(target2);

    const target3 = document.createElement("div");
    target3.setAttribute("data-test", "target3");
    target3.style.position = "absolute";
    target3.style.top = "300px";
    target3.style.left = "200px";
    target3.style.width = "180px";
    target3.style.height = "60px";
    document.body.appendChild(target3);
  });

  afterEach(() => {
    // Clean up target elements
    const targets = document.querySelectorAll("[data-test]");
    targets.forEach((target) => target.remove());
  });

  describe("Rendering", () => {
    it("should render tutorial when not completed", () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      // @ts-ignore - jest-dom matchers are available at runtime
      expect(screen.getByText("First Step")).toBeInTheDocument();
      // @ts-ignore - jest-dom matchers are available at runtime
      expect(
        screen.getByText("This is the first step content")
      ).toBeInTheDocument();
      // @ts-ignore - jest-dom matchers are available at runtime
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });

    it("should not render when already completed", () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={true}
        />
      );

      // @ts-ignore - jest-dom matchers are available at runtime
      expect(screen.queryByText("First Step")).not.toBeInTheDocument();
    });

    it("should show correct step counter", () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      // @ts-ignore - jest-dom matchers are available at runtime
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to next step when Next button clicked", async () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("Second Step")).toBeInTheDocument();
        expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      });
    });

    it("should navigate to previous step when Back button clicked", async () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      // Go to step 2
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("Second Step")).toBeInTheDocument();
      });

      // Go back to step 1
      const backButton = screen.getByRole("button", { name: /back/i });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText("First Step")).toBeInTheDocument();
        expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
      });
    });

    it("should disable Back button on first step", () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      const backButton = screen.getByRole("button", { name: /back/i });
      expect(backButton).toBeDisabled();
    });

    it("should show Finish button on last step", async () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      // Navigate to last step
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /finish/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Completion", () => {
    it("should call onComplete when Finish button clicked", async () => {
      const onComplete = vi.fn();
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
          onComplete={onComplete}
        />
      );

      // Navigate to last step
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Click Finish
      await waitFor(() => {
        const finishButton = screen.getByRole("button", { name: /finish/i });
        fireEvent.click(finishButton);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });
    });

    it("should call API to mark tutorial as complete", async () => {
      const onComplete = vi.fn();
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
          onComplete={onComplete}
        />
      );

      // Navigate to last step and finish
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        const finishButton = screen.getByRole("button", { name: /finish/i });
        fireEvent.click(finishButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/tutorial/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tutorialId: "test-tutorial" }),
        });
      });
    });

    it("should hide tutorial after completion", async () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      // Navigate to last step and finish
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        const finishButton = screen.getByRole("button", { name: /finish/i });
        fireEvent.click(finishButton);
      });

      await waitFor(() => {
        expect(screen.queryByText("Third Step")).not.toBeInTheDocument();
      });
    });
  });

  describe("Skip Functionality", () => {
    it("should call onSkip when Skip Tutorial button clicked", async () => {
      const onSkip = vi.fn();
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
          onSkip={onSkip}
        />
      );

      const skipButton = screen.getByRole("button", { name: /skip tutorial/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalledTimes(1);
      });
    });

    it("should call API when tutorial is skipped", async () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      const skipButton = screen.getByRole("button", { name: /skip tutorial/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/tutorial/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tutorialId: "test-tutorial" }),
        });
      });
    });

    it("should hide tutorial when skipped", async () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      const skipButton = screen.getByRole("button", { name: /skip tutorial/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.queryByText("First Step")).not.toBeInTheDocument();
      });
    });

    it("should call onSkip when close (X) button clicked", async () => {
      const onSkip = vi.fn();
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
          onSkip={onSkip}
        />
      );

      const closeButton = screen.getByLabelText("Close tutorial");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Progress Indicators", () => {
    it("should show correct number of progress dots", () => {
      const { container } = render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      // Count progress dots (should be 3 for 3 steps)
      const dots = container.querySelectorAll(".h-1\\.5");
      expect(dots.length).toBe(3);
    });

    it("should highlight current step in progress dots", async () => {
      const { container } = render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      // First dot should be highlighted (has w-6 class)
      const dots = container.querySelectorAll(".h-1\\.5");
      expect(dots[0]).toHaveClass("w-6");
      expect(dots[1]).toHaveClass("w-1.5");

      // Navigate to next step
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        const updatedDots = container.querySelectorAll(".h-1\\.5");
        expect(updatedDots[1]).toHaveClass("w-6");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      // Mock API error
      (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      const skipButton = screen.getByRole("button", { name: /skip tutorial/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it("should still hide tutorial even if API fails", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={mockSteps}
          initialCompleted={false}
        />
      );

      const skipButton = screen.getByRole("button", { name: /skip tutorial/i });
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.queryByText("First Step")).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty Steps", () => {
    it("should not render with empty steps array", () => {
      render(
        <TutorialV2
          tutorialId="test-tutorial"
          steps={[]}
          initialCompleted={false}
        />
      );

      expect(screen.queryByText("Step")).not.toBeInTheDocument();
    });
  });
});
