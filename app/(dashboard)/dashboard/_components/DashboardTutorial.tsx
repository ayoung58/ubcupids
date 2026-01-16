"use client";

import { Tutorial, TutorialStep } from "@/components/tutorial/Tutorial";

const dashboardSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to UBCupids! 💘",
    content:
      "You can return to the homepage at any time by clicking on the UBCupids logo at the top of the page.",
    target: "[data-tutorial='logo']",
    position: "bottom",
  },
  {
    id: "profile",
    title: "Set Up Your Profile",
    content:
      "Click here to set up your profile and link a cupid account if you'd like to help match others!",
    target: "[data-tutorial='profile-button']",
    position: "bottom",
  },
  {
    id: "questionnaire",
    title: "Complete Your Questionnaire",
    content:
      "Start your compatibility questionnaire when you're ready. This helps us find your perfect match!",
    target: "[data-tutorial='questionnaire-card']",
    position: "right",
  },
  {
    id: "matches",
    title: "View Your Matches",
    content:
      "Your matches will be revealed here! Come back after February 8th to see who you've been matched with.",
    target: "[data-tutorial='matches-card']",
    position: "right",
  },
  {
    id: "get-started",
    title: "Ready to Get Started?",
    content:
      "We recommend you start by setting up your profile! This is where you can link a cupid account if you'd like, set up your display name, and select what information you'd like to show potential matches! If you have any questions or feedback, you can email us at support@ubcupids.org!",
    target: "[data-tutorial='profile-button']",
    position: "bottom",
  },
];

interface DashboardTutorialProps {
  initialCompleted: boolean;
}

export function DashboardTutorial({
  initialCompleted,
}: DashboardTutorialProps) {
  return (
    <Tutorial
      steps={dashboardSteps}
      tutorialId="match-dashboard"
      initialCompleted={initialCompleted}
    />
  );
}
