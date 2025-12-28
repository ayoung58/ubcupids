"use client";

import { Tutorial, TutorialStep } from "@/components/tutorial/Tutorial";

const profileSteps: TutorialStep[] = [
  {
    id: "profile-picture",
    title: "Profile Picture",
    content:
      "Upload a profile picture to help your matches recognize you! This is optional but recommended.",
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
    title: "Privacy Settings",
    content:
      "Control what information you want to share with your matches using these toggle buttons.",
    target: "[data-tutorial='show-bio']",
    position: "right",
  },
  {
    id: "additional-contact",
    title: "Additional Point of Contact",
    content:
      "Add an email for your preferred candidate to reach you if needed.",
    target: "[data-tutorial='preferred-email']",
    position: "right",
  },
  {
    id: "other-fields",
    title: "Additional Information",
    content:
      "Fill in your bio, interests, major, and other details to help your matches get to know you better!",
    target: "[data-tutorial='bio']",
    position: "right",
  },
  {
    id: "save-changes",
    title: "Save Your Changes",
    content:
      "Don't forget to save your changes when you're done! The button will be enabled when you make edits.",
    target: "[data-tutorial='save-button']",
    position: "top",
  },
];

export function ProfileTutorial() {
  return <Tutorial steps={profileSteps} tutorialId="match-profile" />;
}
