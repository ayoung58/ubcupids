"use client";

import { Tutorial, TutorialStep } from "@/components/tutorial/Tutorial";

const questionnaireSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Questionnaire! 📝",
    content:
      "This is your compatibility questionnaire. Your answers help us find your perfect match! Take your time - your progress is saved automatically.",
    target: "[data-tutorial='questionnaire-header']",
    position: "bottom",
  },
  {
    id: "sections",
    title: "Navigate Between Sections",
    content:
      "Click on these section buttons to quickly jump to different parts of the questionnaire. A green checkmark appears when a section is complete.",
    target: "[data-tutorial='section-nav']",
    position: "bottom",
  },
  {
    id: "instructions",
    title: "Helpful Instructions",
    content:
      "Click this dropdown anytime to review important instructions, privacy information, and tips for completing the questionnaire.",
    target: "[data-tutorial='info-panel']",
    position: "bottom",
  },
  {
    id: "question",
    title: "Answering Questions",
    content:
      "Each question has multiple choice options or text fields. Select the options that best describe you or your preferences. Required questions are marked with an asterisk (*).",
    target: "[data-tutorial='first-question']",
    position: "right",
  },
  {
    id: "importance",
    title: "Setting Question Importance ⚖️",
    content:
      "Use the importance dropdown next to each question to indicate how much this matters to you in a match. Options range from 'Not Important' to 'Very Important'. This affects how heavily the answer weighs in your compatibility score!",
    target: "[data-tutorial='importance-select']",
    position: "left",
  },
  {
    id: "navigation-buttons",
    title: "Quick Navigation",
    content:
      "Use the floating buttons at the bottom right: the top button jumps to your first unanswered question, and the bottom button scrolls back to the top of the page.",
    target: "[data-tutorial='nav-buttons']",
    position: "left",
  },
  {
    id: "save-progress",
    title: "Saving Your Progress",
    content:
      "Your answers are saved automatically every 3 seconds. You can also click 'Save Progress' manually. Come back anytime to continue!",
    target: "[data-tutorial='save-button']",
    position: "top",
  },
  {
    id: "submit",
    title: "Submitting Your Questionnaire",
    content:
      "Once you've answered all questions (100% progress), click 'Submit Questionnaire' to lock in your responses. Make sure you're happy with your answers - they cannot be changed after submission!",
    target: "[data-tutorial='submit-button']",
    position: "top",
  },
];

interface QuestionnaireTutorialProps {
  initialCompleted: boolean;
}

export function QuestionnaireTutorial({
  initialCompleted,
}: QuestionnaireTutorialProps) {
  return (
    <Tutorial
      steps={questionnaireSteps}
      tutorialId="questionnaire"
      initialCompleted={initialCompleted}
    />
  );
}
