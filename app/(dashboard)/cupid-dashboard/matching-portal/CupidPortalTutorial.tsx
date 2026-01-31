"use client";

import {
  TutorialV2,
  type TutorialStep,
} from "@/components/tutorial/TutorialV2";

const cupidPortalSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Matching Portal! 💘",
    content:
      "As a Cupid, you'll help match candidates with their perfect partners. This tutorial will guide you through the entire matching process step by step!",
    target: "[data-tutorial='stats-header']",
    position: "bottom",
  },
  {
    id: "stats",
    title: "Your Progress Dashboard",
    content:
      "This header shows your overall progress: total assigned candidates, pending decisions, and completed matches. Keep track of your matchmaking journey!",
    target: "[data-tutorial='stats-header']",
    position: "bottom",
  },
  {
    id: "candidate-nav",
    title: "Navigate Between Candidates",
    content:
      "If you have multiple assigned candidates, use 'Previous' and 'Next' buttons here to move between them. The counter shows which candidate you're currently reviewing (e.g., 'Match Candidate 1 of 3').",
    target: "[data-tutorial='candidate-nav']",
    position: "bottom",
  },
  {
    id: "info-collapse",
    title: "Maximize Your Workspace",
    content:
      "Click the collapse arrow (↑) to hide the info panel above and give yourself more screen space for comparing profiles and questionnaires. Click again (↓) to expand it back.",
    target: "[data-tutorial='collapse-button']",
    position: "top",
  },
  {
    id: "split-view",
    title: "Side-by-Side Comparison View",
    content:
      "The interface is split into two panels: LEFT shows your assigned candidate, RIGHT shows their potential matches. This layout lets you easily compare compatibility!",
    target: "[data-tutorial='split-view']",
    position: "top",
  },
  {
    id: "profile-questionnaire-tabs",
    title: "View Profile, Questionnaire & Free Response",
    content:
      "Toggle between three tabs: 'Profile' (bio, interests, photo), 'Questionnaire' (their compatibility answers), and 'Free Response' (personal essays). Review all three to understand each person deeply!",
    target: "[data-tutorial='view-tabs']",
    position: "bottom",
  },
  {
    id: "match-navigation",
    title: "Browse Through Potential Matches",
    content:
      "Use the < Previous and Next > buttons in the right panel to browse through potential matches for your candidate. The counter shows which match you're viewing (e.g., 'Match 2 of 5').",
    target: "[data-tutorial='match-nav']",
    position: "top",
  },
  {
    id: "reveal-more",
    title: "Load Additional Matches",
    content:
      "You start with 5 potential matches. If none feel right, click 'Reveal 5 More Matches' to load additional options. You can reveal up to 25 total matches per candidate.",
    target: "[data-tutorial='generate-more']",
    position: "bottom",
  },
  {
    id: "not-a-match",
    title: "Remove Incompatible Matches",
    content:
      "If you determine someone isn't a good match, click the 'Not a Match' button (with X icon) to remove them from consideration. This helps narrow down to the best options. Note: You cannot reject the last remaining match.",
    target: "[data-tutorial='reject-button']",
    position: "left",
  },
  {
    id: "select-match",
    title: "Select Your Top Choice",
    content:
      "Found the perfect match? Click the 'Select' button (with heart icon) to choose them for your candidate. The card will highlight in pink, and you can undo this selection anytime before confirming.",
    target: "[data-tutorial='select-button']",
    position: "left",
  },
  {
    id: "confirm-selection",
    title: "Provide Your Rationale",
    content:
      "After selecting a match, the confirmation area at the bottom appears. Write a brief rationale explaining why you think they're compatible—the candidate will see this! Be thoughtful and constructive.",
    target: "[data-tutorial='confirm-button']",
    position: "left",
  },
  {
    id: "final-submit",
    title: "Submit Your Match Selection",
    content:
      "Once you've written your rationale, click 'Confirm Selection' to finalize your choice. This completes your assignment for this candidate! Your thoughtful match will be combined with algorithm results and revealed on February 8, 2026. ✨",
    target: "[data-tutorial='confirm-button']",
    position: "left",
  },
];

interface CupidPortalTutorialProps {
  initialCompleted: boolean;
}

export function CupidPortalTutorial({
  initialCompleted,
}: CupidPortalTutorialProps) {
  return (
    <TutorialV2
      steps={cupidPortalSteps}
      tutorialId="cupid-portal"
      initialCompleted={initialCompleted}
    />
  );
}
