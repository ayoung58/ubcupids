"use client";

import { Tutorial, TutorialStep } from "@/components/tutorial/Tutorial";

const cupidPortalSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Matching Portal! 💘",
    content:
      "As a Cupid, you'll help match candidates with their perfect partners. This tutorial will guide you through the matching process.",
    target: "[data-tutorial='stats-header']",
    position: "bottom",
  },
  {
    id: "candidate-nav",
    title: "Navigate Between Candidates",
    content:
      "Use these buttons to move between assigned candidates. Each candidate needs you to find them a match!",
    target: "[data-tutorial='candidate-nav']",
    position: "bottom",
  },
  {
    id: "info-collapse",
    title: "Collapsible Info Panel",
    content:
      "Click the arrow to collapse or expand this info panel. Collapsing it gives you more screen space to compare questionnaires.",
    target: "[data-tutorial='collapse-button']",
    position: "top",
  },
  {
    id: "split-view",
    title: "Split View Comparison",
    content:
      "The left panel shows your candidate's profile/questionnaire. The right panel shows potential matches. Compare them side-by-side!",
    target: "[data-tutorial='split-view']",
    position: "top",
  },
  {
    id: "profile-questionnaire-tabs",
    title: "Profile vs Questionnaire",
    content:
      "Switch between viewing the profile (bio, interests) and questionnaire responses. This helps you understand compatibility beyond just scores.",
    target: "[data-tutorial='view-tabs']",
    position: "bottom",
  },
  {
    id: "match-navigation",
    title: "Browse Potential Matches",
    content:
      "Use the Previous/Next buttons to browse through potential matches for your candidate. Each match has a compatibility score.",
    target: "[data-tutorial='match-nav']",
    position: "top",
  },
  {
    id: "generate-more",
    title: "Need More Options?",
    content:
      "If you don't find a good match, click 'Generate 5 More' to load additional potential matches (up to 25 total).",
    target: "[data-tutorial='generate-more']",
    position: "bottom",
  },
  {
    id: "not-a-match",
    title: "Removing a Match",
    content:
      "Click the 'Not a Match' button (X icon) to remove someone from the candidate pool if you don't think they're compatible.",
    target: "[data-tutorial='reject-button']",
    position: "left",
  },
  {
    id: "select-match",
    title: "Selecting a Match",
    content:
      "Found the perfect match? Click 'Select as Match' to choose them for your candidate. You can undo this before confirming.",
    target: "[data-tutorial='select-button']",
    position: "left",
  },
  {
    id: "rationale",
    title: "Provide Rationale (Required!)",
    content:
      "Before confirming, you MUST provide a brief rationale explaining why this is a good match. Your candidate and their match will see this message!",
    target: "[data-tutorial='rationale-input']",
    position: "top",
  },
  {
    id: "confirm",
    title: "Confirm Your Selection",
    content:
      "Once you've selected a match and provided rationale, click 'Confirm Selection' to submit. The match will be sent to the candidate for acceptance!",
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
    <Tutorial
      steps={cupidPortalSteps}
      tutorialId="cupid-portal"
      initialCompleted={initialCompleted}
    />
  );
}
