"use client";

import { Tutorial, TutorialStep } from "@/components/tutorial/Tutorial";

const profileSteps: TutorialStep[] = [
  {
    id: "profile-picture",
    title: "Profile Picture",
    content:
      "Upload a profile picture if you'd like! This is optional, and you can choose whether or not to show matches.",
    target: "[data-tutorial='profile-picture']",
    position: "right",
  },
  {
    id: "display-name",
    title: "Display Name",
    content:
      "Set your display name - this is how you'll appear to your matches and to cupids that match you. By default, it's your full name for recognizability, but if you wish to stay anonymous, you can use a nickname or initials!",
    target: "[data-tutorial='display-name']",
    position: "right",
  },
  {
    id: "show-to-matches",
    title: "Visibility Settings",
    content:
      'Control what information you want to share with your matches using these "Show to Matches" buttons. This profile info will be shown to human cupids as well.',
    target: "[data-tutorial='show-interests']",
    position: "bottom",
  },
  {
    id: "additional-contact",
    title: "Additional Contact information",
    content:
      "Add an email for your matches to reach you at. The default is your UBC email.",
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
    id: "delete-account",
    title: "Delete Account",
    content:
      "If you need to delete your account, you can do so here. Please note that all information associated with your account will be permanently deleted if you press this button. This action cannot be undone.",
    target: "[data-tutorial='delete-account']",
    position: "top",
  },
  {
    id: "cupid-account",
    title: "Link a Cupid Account",
    content:
      "Want to help others find love? You can create a Cupid account linked to your current account. As a Cupid, you'll help manually match people (unfortunately not yourself) based on their questionnaire responses!",
    target: "[data-tutorial='cupid-account-link']",
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
  {
    id: "welcome-end",
    title: "Thank you for joining! 💘",
    content:
      "We hope you have a fun experience finding your match. If you have any questions, concerns, or specific needs, please email support@ubcupids.org. Good luck!",
    target: "[data-tutorial='logo']",
    position: "center",
    hideArrow: true,
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
