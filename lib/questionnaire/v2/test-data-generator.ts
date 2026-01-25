/**
 * Test Data Generator for Questionnaire V2
 *
 * Generates valid, realistic test data for QuestionnaireResponseV2.
 * Supports:
 * - Random generation with constraints
 * - Specific test scenarios (perfect matches, dealbreaker conflicts, etc.)
 * - Varied importance levels and dealbreakers
 * - All question types and preference formats
 */

import { ALL_QUESTIONS, FREE_RESPONSE_QUESTIONS } from "./config";
import {
  QuestionConfig,
  QuestionType,
  Section,
} from "@/types/questionnaire-v2";
import { IMPORTANCE_WEIGHTS } from "./constants";

// ============================================
// TYPES
// ============================================

export interface V2Response {
  answer: string | string[] | number | { min: number; max: number };
  preference?: string | string[] | { min: number; max: number } | null;
  importance?: keyof typeof IMPORTANCE_WEIGHTS;
  dealbreaker?: boolean;
}

export interface GeneratedResponses {
  responses: Record<string, V2Response>;
  freeResponse1: string;
  freeResponse2: string;
  freeResponse3?: string;
  freeResponse4?: string;
  freeResponse5?: string;
}

export interface TestScenarioConfig {
  /** Gender identity for this user */
  gender?: string;
  /** Gender preferences for matching */
  genderPreferences?: string[];
  /** Age of this user */
  age?: number;
  /** Age range preference */
  ageRange?: { min: number; max: number };
  /** Percentage of questions with high importance (0-1) */
  highImportanceRate?: number;
  /** Percentage of questions marked as dealbreakers (0-1) */
  dealbreakerRate?: number;
  /** Whether to use "doesn't matter" frequently */
  indifferentRate?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Pick random element from array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick multiple random elements
 */
function pickMultiple<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

/**
 * Generate random importance level
 */
function randomImportance(
  highRate: number = 0.3
): keyof typeof IMPORTANCE_WEIGHTS {
  const rand = Math.random();
  if (rand < highRate) {
    return Math.random() < 0.5 ? "VERY_IMPORTANT" : "IMPORTANT";
  } else if (rand < 0.7) {
    return "SOMEWHAT_IMPORTANT";
  } else {
    return "NOT_IMPORTANT";
  }
}

/**
 * Should this be a dealbreaker?
 */
function shouldBeDealbreaker(
  dealbreakerRate: number = 0.05,
  importance?: keyof typeof IMPORTANCE_WEIGHTS
): boolean {
  // Only set dealbreakers on highly important questions
  if (importance !== "IMPORTANT" && importance !== "VERY_IMPORTANT") {
    return false;
  }
  return Math.random() < dealbreakerRate;
}

/**
 * Should this be "doesn't matter"?
 */
function shouldBeIndifferent(indifferentRate: number = 0.2): boolean {
  return Math.random() < indifferentRate;
}

// ============================================
// FREE RESPONSE GENERATORS
// ============================================

const FREE_RESPONSE_1_OPTIONS = [
  "Trust and honesty are everything to me. I value someone who can be vulnerable and genuine.",
  "Communication and mutual respect. I think the best relationships are built on understanding.",
  "Loyalty and support. I want someone who's there for me through thick and thin.",
  "Shared values and goals. I need to feel like we're building something together.",
  "Laughter and fun. Life's too short not to enjoy it with someone who makes you smile.",
  "Emotional connection and intimacy. I value deep conversations and really knowing someone.",
  "Independence and space. I appreciate a partner who has their own life and interests.",
  "Adventure and spontaneity. I want someone to explore life with, not just exist alongside.",
  "Patience and understanding. Everyone has bad days, and I value someone who gets that.",
  "Authenticity above all. I want someone who's unapologetically themselves.",
];

const FREE_RESPONSE_2_OPTIONS = [
  "What's your favorite way to spend a lazy Sunday morning?",
  "If you could have dinner with anyone, living or dead, who would it be and why?",
  "What's something you're working on improving about yourself?",
  "What's your love language, and how do you like to show affection?",
  "What's a belief or value you hold that might surprise people?",
  "What does your ideal relationship look like in 5 years?",
  "What's the best piece of advice you've ever received?",
  "What's something that always makes you laugh, no matter how many times you see it?",
  "If you could master any skill instantly, what would you choose?",
  "What's your favorite memory from the past year?",
];

const FREE_RESPONSE_3_OPTIONS = [
  "I'm a really good listener, and I genuinely care about understanding people's perspectives.",
  "I love trying new restaurants and cooking elaborate meals—food is definitely my love language!",
  "I'm working on being more spontaneous. I tend to plan everything, but I'm trying to let go sometimes.",
  "I have a dry sense of humor that not everyone gets right away, but once you do, we'll probably get along great.",
  "I'm really close with my family, and they're a big part of my life.",
  "I can be pretty introverted and need alone time to recharge, but I'm always up for meaningful conversations.",
  "I'm passionate about social justice and try to volunteer when I can.",
  "I absolutely love animals—I have two cats and they're basically my children.",
  "I'm a morning person! I know that's weird, but I'm most productive and happy early in the day.",
  "I'm terrible at texting back quickly. It's not personal—I just get distracted easily!",
];

const FREE_RESPONSE_4_OPTIONS = [
  "I'm really into photography and love capturing candid moments of everyday life.",
  "I'm learning to play the guitar and it's been challenging but so rewarding.",
  "I'm passionate about sustainability and try to live as zero-waste as possible.",
  "I love reading fantasy novels and get completely lost in them for hours.",
  "I'm really into fitness and train for marathons in my spare time.",
  "I'm learning a new language (Spanish) and hope to travel more to practice it.",
  "I'm a huge board game nerd—I love strategy games and have a collection of over 50 games.",
  "I write poetry in my free time. It helps me process emotions and experiences.",
  "I'm really into astronomy and love stargazing. The universe is fascinating to me.",
  "I volunteer at a local animal shelter every weekend. Animals bring me so much joy.",
];

const FREE_RESPONSE_5_OPTIONS = [
  "Honesty. If you can't be truthful with me, we won't work.",
  "Respect for my boundaries and personal time. I need space sometimes.",
  "Shared responsibility. I can't be the only one putting in effort.",
  "Kindness and empathy. I can't be with someone who's mean to others.",
  "Emotional maturity. I need someone who can communicate their feelings.",
  "Loyalty and commitment. I take relationships seriously.",
  "Someone who's supportive of my career and ambitions.",
  "Physical affection. I need touch and closeness to feel connected.",
  "Similar values around family and future planning.",
  "Someone who respects my independence and doesn't try to change me.",
];

/**
 * Generate free response answers
 */
function generateFreeResponses(
  config: TestScenarioConfig = {}
): Pick<
  GeneratedResponses,
  | "freeResponse1"
  | "freeResponse2"
  | "freeResponse3"
  | "freeResponse4"
  | "freeResponse5"
> {
  const responses = {
    freeResponse1: pickRandom(FREE_RESPONSE_1_OPTIONS),
    freeResponse2: pickRandom(FREE_RESPONSE_2_OPTIONS),
  } as any;

  // 70% chance of optional responses
  if (Math.random() < 0.7) {
    responses.freeResponse3 = pickRandom(FREE_RESPONSE_3_OPTIONS);
  }
  if (Math.random() < 0.6) {
    responses.freeResponse4 = pickRandom(FREE_RESPONSE_4_OPTIONS);
  }
  if (Math.random() < 0.5) {
    responses.freeResponse5 = pickRandom(FREE_RESPONSE_5_OPTIONS);
  }

  return responses;
}

// ============================================
// QUESTION-SPECIFIC GENERATORS
// ============================================

/**
 * Generate response for a specific question
 */
function generateQuestionResponse(
  question: QuestionConfig,
  config: TestScenarioConfig = {}
): V2Response {
  const response: V2Response = {
    answer: "",
  };

  // Handle special cases first (Q1, Q2, Q4)
  if (question.id === "q1") {
    // Gender identity
    response.answer =
      config.gender ||
      pickRandom(["woman", "man", "non-binary", "genderqueer"]);
    return response; // No preference for Q1
  }

  if (question.id === "q2") {
    // Gender preference
    response.answer =
      config.genderPreferences ||
      pickMultiple(["women", "men", "non_binary"], 1, 2);
    return response; // No preference for Q2
  }

  if (question.id === "q4") {
    // Age
    response.answer = config.age || 18 + Math.floor(Math.random() * 23); // 18-40
    response.preference = config.ageRange || {
      min: 18 + Math.floor(Math.random() * 5),
      max: 30 + Math.floor(Math.random() * 11),
    };
    response.importance = randomImportance(config.highImportanceRate);
    response.dealbreaker = shouldBeDealbreaker(
      config.dealbreakerRate,
      response.importance
    );
    return response;
  }

  // Generate answer based on question type
  if (question.answerFormat === "single-select" && question.options) {
    response.answer = pickRandom(question.options.map((o) => o.value));
  } else if (question.answerFormat === "multi-select" && question.options) {
    const min = question.validation?.minSelections || 1;
    const max =
      question.validation?.maxSelections ||
      Math.min(3, question.options.length);
    response.answer = pickMultiple(
      question.options.map((o) => o.value),
      min,
      max
    );
  } else if (question.answerFormat === "likert" && question.likertConfig) {
    response.answer =
      Math.floor(
        Math.random() *
          (question.likertConfig.max - question.likertConfig.min + 1)
      ) + question.likertConfig.min;
  }

  // Generate preference if question has preference
  if (question.hasPreference && !shouldBeIndifferent(config.indifferentRate)) {
    if (question.preferenceFormat === "same-or-similar") {
      response.preference = pickRandom(["same", "similar"]);
    } else if (question.preferenceFormat === "similar") {
      response.preference = "similar";
    } else if (question.preferenceFormat === "same-similar-different") {
      response.preference = pickRandom(["same", "similar", "different"]);
    } else if (
      question.preferenceFormat === "multi-select" &&
      question.preferenceOptions
    ) {
      const min = 1;
      const max = Math.min(3, question.preferenceOptions.length);
      response.preference = pickMultiple(
        question.preferenceOptions.map((o) => o.value),
        min,
        max
      );
    } else if (question.preferenceFormat === "special") {
      // Special handling for different question types
      if (question.id === "q25") {
        // Q25 Conflict Resolution: "same" / "compatible" preference
        response.preference = pickRandom(["same", "compatible"]);
      } else {
        // Default to age range for other special cases
        response.preference = {
          min: 18 + Math.floor(Math.random() * 5),
          max: 30 + Math.floor(Math.random() * 11),
        };
      }
    }

    response.importance = randomImportance(config.highImportanceRate);
    response.dealbreaker = shouldBeDealbreaker(
      config.dealbreakerRate,
      response.importance
    );
  } else if (
    question.hasPreference &&
    shouldBeIndifferent(config.indifferentRate)
  ) {
    // "Doesn't matter" - no preference, no importance
    response.preference = null;
    response.importance = undefined;
    response.dealbreaker = false;
  }

  return response;
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Generate complete V2 questionnaire responses
 */
export function generateV2Responses(
  config: TestScenarioConfig = {}
): GeneratedResponses {
  const responses: Record<string, V2Response> = {};

  // Generate responses for all questions
  for (const question of ALL_QUESTIONS) {
    responses[question.id] = generateQuestionResponse(question, config);
  }

  // Generate free responses
  const freeResponses = generateFreeResponses(config);

  return {
    responses,
    ...freeResponses,
  };
}

// ============================================
// TEST SCENARIO GENERATORS
// ============================================

/**
 * Generate a perfect match pair
 * Two users with identical or highly compatible responses
 */
export function generatePerfectMatchPair(): [
  GeneratedResponses,
  GeneratedResponses,
] {
  const user1 = generateV2Responses({
    gender: "woman",
    genderPreferences: ["men"],
    age: 22,
    ageRange: { min: 21, max: 26 },
    highImportanceRate: 0.5,
    dealbreakerRate: 0.02,
    indifferentRate: 0.1,
  });

  // User 2: Mirror user 1's responses completely (except gender/age)
  const user2: GeneratedResponses = {
    responses: {},
    freeResponse1: user1.freeResponse1,
    freeResponse2: user1.freeResponse2,
    freeResponse3: user1.freeResponse3,
    freeResponse4: user1.freeResponse4,
    freeResponse5: user1.freeResponse5,
  };

  // Copy ALL responses from user1, but override gender/age specific ones
  for (const [key, value] of Object.entries(user1.responses)) {
    if (key === "q1") {
      // Q1: Gender identity
      user2.responses[key] = {
        answer: "man",
      };
    } else if (key === "q2") {
      // Q2: Gender preference
      user2.responses[key] = {
        answer: ["women"],
      };
    } else if (key === "q4") {
      // Q4: Age (compatible with user1's preference)
      user2.responses[key] = {
        answer: 23,
        preference: { min: 20, max: 25 },
        importance: value.importance,
        dealbreaker: value.dealbreaker,
      };
    } else {
      // All other questions: exact copy
      user2.responses[key] = { ...value };
    }
  }

  return [user1, user2];
}

/**
 * Generate a dealbreaker conflict pair
 * Two users who would otherwise match but have dealbreaker conflicts
 */
export function generateDealbreakerConflictPair(): [
  GeneratedResponses,
  GeneratedResponses,
] {
  const user1 = generateV2Responses({
    gender: "man",
    genderPreferences: ["women"],
    age: 25,
    ageRange: { min: 23, max: 28 },
    highImportanceRate: 0.4,
    dealbreakerRate: 0.1,
    indifferentRate: 0.1,
  });

  const user2 = generateV2Responses({
    gender: "woman",
    genderPreferences: ["men"],
    age: 24,
    ageRange: { min: 23, max: 27 },
    highImportanceRate: 0.4,
    dealbreakerRate: 0.1,
    indifferentRate: 0.1,
  });

  // Make most responses compatible
  const keysToMatch = ["q3", "q6", "q7", "q11", "q21"];
  for (const key of keysToMatch) {
    if (user2.responses[key]) {
      user2.responses[key].answer = user1.responses[key].answer;
    }
  }

  // But create dealbreaker conflict on Q8 (alcohol)
  user1.responses["q8"] = {
    answer: "never",
    preference: ["never", "rarely"],
    importance: "VERY_IMPORTANT",
    dealbreaker: true,
  };
  user2.responses["q8"] = {
    answer: "frequently",
    preference: ["socially", "frequently"],
    importance: "IMPORTANT",
    dealbreaker: false,
  };

  return [user1, user2];
}

/**
 * Generate an asymmetric pair
 * One user rates many things as important, the other is more indifferent
 */
export function generateAsymmetricPair(): [
  GeneratedResponses,
  GeneratedResponses,
] {
  const user1 = generateV2Responses({
    gender: "non-binary",
    genderPreferences: ["women", "non_binary"],
    age: 21,
    ageRange: { min: 19, max: 25 },
    highImportanceRate: 0.7, // Very picky
    dealbreakerRate: 0.05,
    indifferentRate: 0.05, // Rarely indifferent
  });

  const user2 = generateV2Responses({
    gender: "woman",
    genderPreferences: ["non_binary", "women"],
    age: 22,
    ageRange: { min: 20, max: 24 },
    highImportanceRate: 0.2, // Not picky
    dealbreakerRate: 0.01,
    indifferentRate: 0.4, // Often indifferent
  });

  return [user1, user2];
}

/**
 * Generate diverse pool of users
 * For testing the full matching algorithm
 */
export function generateDiversePool(count: number): GeneratedResponses[] {
  const users: GeneratedResponses[] = [];

  for (let i = 0; i < count; i++) {
    const genders = ["woman", "man", "non-binary"];
    const gender = pickRandom(genders);

    // Generate compatible gender preferences
    let genderPreferences: string[];
    if (gender === "woman") {
      genderPreferences =
        Math.random() < 0.7
          ? ["men"]
          : pickMultiple(["men", "women", "non_binary"], 1, 2);
    } else if (gender === "man") {
      genderPreferences =
        Math.random() < 0.7
          ? ["women"]
          : pickMultiple(["women", "men", "non_binary"], 1, 2);
    } else {
      genderPreferences = pickMultiple(["women", "men", "non_binary"], 1, 3);
    }

    users.push(
      generateV2Responses({
        gender,
        genderPreferences,
        age: 18 + Math.floor(Math.random() * 23),
        ageRange: {
          min: 18 + Math.floor(Math.random() * 5),
          max: 28 + Math.floor(Math.random() * 13),
        },
        highImportanceRate: 0.2 + Math.random() * 0.4, // 0.2-0.6
        dealbreakerRate: 0.01 + Math.random() * 0.08, // 0.01-0.09
        indifferentRate: 0.1 + Math.random() * 0.3, // 0.1-0.4
      })
    );
  }

  return users;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that generated responses meet all V2 requirements
 */
export function validateGeneratedResponses(generated: GeneratedResponses): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required free responses
  if (!generated.freeResponse1 || generated.freeResponse1.length === 0) {
    errors.push("freeResponse1 is required");
  }
  if (!generated.freeResponse2 || generated.freeResponse2.length === 0) {
    errors.push("freeResponse2 is required");
  }

  // Check all questions are answered
  for (const question of ALL_QUESTIONS) {
    const response = generated.responses[question.id];
    if (!response) {
      errors.push(`Missing response for ${question.id}`);
      continue;
    }

    // Check answer exists
    if (
      response.answer === undefined ||
      response.answer === null ||
      response.answer === ""
    ) {
      errors.push(`${question.id}: answer is required`);
    }

    // Check age bounds
    if (question.id === "q4" && typeof response.answer === "number") {
      if (response.answer < 18 || response.answer > 40) {
        errors.push(`${question.id}: age must be between 18 and 40`);
      }
    }

    // Check multi-select constraints
    if (
      question.answerFormat === "multi-select" &&
      Array.isArray(response.answer)
    ) {
      const min = question.validation?.minSelections || 1;
      const max = question.validation?.maxSelections || Infinity;
      if (response.answer.length < min) {
        errors.push(`${question.id}: must select at least ${min} options`);
      }
      if (response.answer.length > max) {
        errors.push(`${question.id}: cannot select more than ${max} options`);
      }
    }

    // Check preference consistency
    if (
      question.hasPreference &&
      response.preference !== null &&
      response.preference !== undefined
    ) {
      if (!response.importance) {
        errors.push(
          `${question.id}: importance required when preference is set`
        );
      }
      if (
        response.dealbreaker &&
        response.importance !== "VERY_IMPORTANT" &&
        response.importance !== "IMPORTANT"
      ) {
        errors.push(`${question.id}: dealbreakers should have high importance`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
