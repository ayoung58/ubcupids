"use client";

import { Tutorial, TutorialStep } from "@/components/tutorial/Tutorial";

const profileSteps: TutorialStep[] = [
  {
    id: "profile-picture",
    title: "Profile Picture",
    content:
      "Upload a profile picture to help your matches recognize you! This is optional.",
    target: "[data-tutorial='profile-picture']",
    position: "right",
  },
  {
    id: "display-name",
    title: "Display Name",
    content:
      "Set your display name - this is how you'll appear to your matches.",
    target: "[data-tutorial='display-name']",
    position: "right",
  },
  {
    id: "show-to-matches",
    title: "Visibility Settings",
    content:
      'Control what information you want to share with your matches using these "Show to Matches" buttons.',
    target: "[data-tutorial='show-interests']",
    position: "bottom",
  },
  {
    id: "additional-contact",
    title: "Additional Contact information",
    content:
      "Add an email for your matches to reach you at. The default is your ubc email.",
    target: "[data-tutorial='point-of-contact']",
    position: "right",
  },
  {
    id: "other-fields",
    title: "Additional Information",
    content:
      "Fill in your bio, interests, major, and other details to help your matches and your human cupid get to know you better!",
    target: "[data-tutorial='bio']",
    position: "right",
  },
  {
    id: "save-changes",
    title: "Save Your Changes",
    content:
      "Don't forget to save your changes when you're done! The button will be enabled when you make edits.",
    target: "[data-tutorial='save-button']",
    position: "bottom",
  },
];

interface ProfileTutorialProps {
  initialCompleted: boolean;
}

export function ProfileTutorial({ initialCompleted }: ProfileTutorialProps) {
  return (
    <Tutorial
      steps={profileSteps}
      tutorialId="match-profile"
      initialCompleted={initialCompleted}
    />
  );
}
