/**
 * Questionnaire V2 Configuration
 *
 * This file defines the complete structure of the V2 questionnaire with:
 * - 36 main questions across 2 sections (Section 1: Lifestyle, Section 2: Personality)
 * - 2 mandatory free response questions
 * - Split-screen format: own answer (left) + preference (right) + importance + dealbreaker
 *
 * Section weights for matching algorithm:
 * - Section 1 (Q1-Q20): 65% - Lifestyle / Surface Compatibility
 * - Section 2 (Q21-Q36): 35% - Personality / Interaction Style
 * - Free Response (Q37-Q38): Excluded from algorithm, used by cupids only
 */

import {
  QuestionnaireConfig,
  Section,
  Question,
} from "@/src/lib/questionnaire-types";

// ============================================
// SECTION 1: Lifestyle / Surface Compatibility (65% weight)
// ============================================

const section1Questions: Question[] = [
  // Q1-Q2: Gender Identity & Preference (Hard Filters)
  {
    id: "q1",
    type: "single-choice",
    text: "What is your gender identity?",
    required: true,
    hasImportance: false, // Hard filter, no importance
    options: [
      { value: "woman", label: "Woman" },
      { value: "man", label: "Man" },
      { value: "non-binary", label: "Non-binary" },
      { value: "genderqueer", label: "Genderqueer" },
      { value: "prefer-not-to-say", label: "Prefer not to say" },
      { value: "self-describe", label: "Self-describe", hasTextInput: true },
    ],
    helpText: "This is used as a hard filter for matching.",
  },
  {
    id: "q2",
    type: "multi-choice",
    text: "Which gender(s) are you interested in matching with?",
    required: true,
    hasImportance: false, // Hard filter, no importance
    options: [
      { value: "women", label: "Women" },
      { value: "men", label: "Men" },
      { value: "non-binary", label: "Non-binary people" },
      { value: "anyone", label: "Anyone" },
    ],
    helpText: "Selecting 'Anyone' will disable other options.",
  },

  // Q3: Sexual Orientation
  {
    id: "q3",
    type: "single-choice",
    text: "Which option best describes your sexual and/or romantic orientation?",
    required: true,
    hasImportance: true,
    options: [
      { value: "heterosexual", label: "Heterosexual (sexual & romantic)" },
      { value: "homosexual", label: "Homosexual (sexual & romantic)" },
      { value: "bisexual", label: "Bisexual" },
      { value: "pansexual", label: "Pansexual" },
      { value: "asexual", label: "Asexual (sexual attraction)" },
      { value: "aromantic", label: "Aromantic (romantic attraction)" },
      { value: "asexual-aromantic", label: "Asexual & aromantic" },
      { value: "questioning", label: "Questioning" },
      { value: "prefer-not-to-answer", label: "Prefer not to answer" },
    ],
    helpText: "Preference: same orientation or select specific orientations.",
  },

  // Q4: Age (Hard Filter)
  {
    id: "q4",
    type: "text",
    text: "What is your age?",
    required: true,
    hasImportance: false, // Hard filter
    min: 18,
    max: 40,
    helpText:
      "You must be 18 or older. Your match's age range will be a hard filter.",
  },

  // Q5: Cultural / Ethnic Background
  {
    id: "q5",
    type: "multi-choice",
    text: "Which cultural or ethnic background(s) do you identify with?",
    required: true,
    hasImportance: true,
    options: [
      { value: "east-asian", label: "East Asian" },
      { value: "south-asian", label: "South Asian" },
      { value: "southeast-asian", label: "Southeast Asian" },
      { value: "black", label: "Black" },
      { value: "middle-eastern", label: "Middle Eastern" },
      { value: "latin-american", label: "Latin American" },
      { value: "white", label: "White" },
      { value: "indigenous", label: "Indigenous" },
      { value: "mixed", label: "Mixed" },
      { value: "other", label: "Other", hasTextInput: true },
      { value: "prefer-not-to-answer", label: "Prefer not to answer" },
    ],
  },

  // Q6: Religious Beliefs
  {
    id: "q6",
    type: "multi-choice",
    text: "What are your religious or spiritual beliefs, if any?",
    required: true,
    hasImportance: true,
    options: [
      { value: "not-religious", label: "Not religious" },
      {
        value: "spiritual-not-religious",
        label: "Spiritual but not religious",
      },
      { value: "christian", label: "Christian" },
      { value: "muslim", label: "Muslim" },
      { value: "jewish", label: "Jewish" },
      { value: "hindu", label: "Hindu" },
      { value: "buddhist", label: "Buddhist" },
      { value: "sikh", label: "Sikh" },
      { value: "other", label: "Other", hasTextInput: true },
      { value: "prefer-not-to-answer", label: "Prefer not to answer" },
    ],
    helpText: "Preference: same or similar beliefs.",
  },

  // Q7: Political Leaning
  {
    id: "q7",
    type: "scale",
    text: "Where do your political views generally fall?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    options: [
      { value: "1", label: "Very progressive / left" },
      { value: "3", label: "Centrist" },
      { value: "5", label: "Very conservative / right" },
    ],
    helpText:
      "1 = Very progressive, 3 = Centrist, 5 = Very conservative. Includes 'Prefer not to answer' option.",
  },

  // Q8: Alcohol Consumption
  {
    id: "q8",
    type: "single-choice",
    text: "How often do you drink alcohol?",
    required: true,
    hasImportance: true,
    options: [
      { value: "never", label: "Never" },
      { value: "rarely", label: "Rarely" },
      { value: "socially", label: "Socially" },
      { value: "frequently", label: "Frequently" },
      { value: "prefer-not-to-answer", label: "Prefer not to answer" },
    ],
    helpText: "Preference: select acceptable frequencies for your match.",
  },

  // Q9: Drug Use (Compound question)
  {
    id: "q9",
    type: "multi-choice",
    text: "Which of the following do you use, and how often?",
    required: true,
    hasImportance: true,
    options: [
      { value: "cannabis", label: "Cannabis" },
      { value: "cigarettes", label: "Cigarettes" },
      { value: "vaping", label: "Vaping" },
      { value: "other-recreational", label: "Other recreational drugs" },
      { value: "none", label: "None" },
    ],
    helpText:
      "You'll also be asked about frequency. Preference: similar substances and frequency.",
  },

  // Q10: Exercise / Physical Activity Level
  {
    id: "q10",
    type: "scale",
    text: "How physically active are you on average?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Sedentary, 5 = Very active / athlete. Preference: less, similarly, more, or the same.",
  },

  // Q11: Relationship Style Preference
  {
    id: "q11",
    type: "single-choice",
    text: "Which relationship structure are you most comfortable with?",
    required: true,
    hasImportance: true,
    options: [
      { value: "exclusively-monogamous", label: "Exclusively monogamous" },
      { value: "open-to-non-monogamy", label: "Open to ethical non-monogamy" },
      { value: "polyamorous", label: "Polyamorous" },
      { value: "exploring-unsure", label: "Exploring / unsure" },
      { value: "prefer-not-to-answer", label: "Prefer not to answer" },
    ],
    helpText:
      "Preference: same relationship style. This is often marked as a dealbreaker.",
  },

  // Q12: Sexual Activity Expectations
  {
    id: "q12",
    type: "single-choice",
    text: "Which best describes your expectations around sexual activity in a relationship?",
    required: true,
    hasImportance: true,
    options: [
      { value: "wait-marriage", label: "Want to wait until marriage" },
      {
        value: "wait-commitment",
        label: "Want to wait until serious commitment",
      },
      {
        value: "after-connection",
        label: "Comfortable after establishing a connection",
      },
      { value: "comfortable-early", label: "Comfortable early on" },
      { value: "prefer-not-to-answer", label: "Prefer not to answer" },
    ],
    helpText: "Ordinal scale. Preference: same or similar expectations.",
  },

  // Q13: Relationship Intent
  {
    id: "q13",
    type: "multi-choice",
    text: "What are you primarily looking for right now?",
    required: true,
    hasImportance: true,
    options: [
      { value: "casual-dating", label: "Casual dating" },
      { value: "open-to-serious", label: "Open to something serious" },
      { value: "friendship-like", label: "Friendship-like relationship" },
      {
        value: "seeking-long-term",
        label: "Actively seeking a long-term partner",
      },
    ],
    helpText: "Select all that apply. Preference: multi-select.",
  },

  // Q14: Field of Study / Faculty
  {
    id: "q14",
    type: "single-choice",
    text: "Which faculty best describes your field of study?",
    required: true,
    hasImportance: true,
    options: [
      { value: "science", label: "Science" },
      { value: "engineering", label: "Engineering" },
      { value: "arts", label: "Arts" },
      { value: "commerce", label: "Commerce" },
      { value: "health", label: "Health" },
      { value: "education", label: "Education" },
      { value: "other", label: "Other" },
    ],
    helpText: "Preference: select acceptable faculties.",
  },

  // Q15: Living Situation
  {
    id: "q15",
    type: "single-choice",
    text: "What is your current living situation?",
    required: true,
    hasImportance: true,
    options: [
      { value: "on-campus", label: "On-campus residence" },
      { value: "off-campus-alone", label: "Off-campus (living alone)" },
      { value: "off-campus-roommates", label: "Off-campus (with roommates)" },
      { value: "with-family", label: "Living with family" },
      { value: "other", label: "Other" },
    ],
    helpText: "Preference: multi-select acceptable living situations.",
  },

  // Q16: Academic / Career Ambition Level
  {
    id: "q16",
    type: "scale",
    text: "How driven are you academically or career-wise?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Relaxed, 5 = Highly driven / competitive. Preference: same, similar, or different.",
  },

  // Q17: Financial Attitudes
  {
    id: "q17",
    type: "scale",
    text: "How do you generally approach spending money?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Very budget-conscious, 5 = Very comfortable spending. Preference: same, similar, or different.",
  },

  // Q18: Time Availability / Ideal Frequency
  {
    id: "q18",
    type: "scale",
    text: "How available are you for dating during the school term?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Very limited, 5 = Very available. Preference: same or similar.",
  },

  // Q19: Pet Ownership / Attitude
  {
    id: "q19",
    type: "single-choice",
    text: "Which best describes your relationship with pets?",
    required: true,
    hasImportance: true,
    options: [
      {
        value: "have-pets-important",
        label: "Have pets and they are very important to me",
      },
      { value: "have-pets", label: "Have pets" },
      { value: "no-pets-like", label: "Don't have pets but really like them" },
      { value: "neutral", label: "Neutral about pets" },
      { value: "allergic", label: "Allergic or cannot be around pets" },
      { value: "dont-like", label: "Don't like pets" },
    ],
    helpText: "Preference: multi-select acceptable attitudes.",
  },

  // Q20: Relationship Experience
  {
    id: "q20",
    type: "single-choice",
    text: "How would you describe your past relationship experience?",
    required: true,
    hasImportance: true,
    options: [
      { value: "no-prior", label: "No prior relationships" },
      { value: "one-serious", label: "One serious relationship" },
      { value: "few-relationships", label: "A few relationships" },
      { value: "many-relationships", label: "Many relationships" },
      { value: "prefer-not-to-answer", label: "Prefer not to answer" },
    ],
    helpText: "Preference: multi-select acceptable experience levels.",
  },
];

// ============================================
// SECTION 2: Personality / Interaction Style (35% weight)
// ============================================

const section2Questions: Question[] = [
  // Q21: Love Languages (Special case)
  {
    id: "q21",
    type: "multi-choice",
    text: "Which love languages best describe how you show and receive affection?",
    required: true,
    hasImportance: true,
    maxSelections: 2, // User selects top 2 for each side
    options: [
      { value: "words-of-affirmation", label: "Words of affirmation" },
      { value: "quality-time", label: "Quality time" },
      { value: "acts-of-service", label: "Acts of service" },
      { value: "physical-touch", label: "Physical touch" },
      { value: "receiving-gifts", label: "Receiving gifts" },
    ],
    helpText:
      "Select top 2 you SHOW (left) and top 2 you like to RECEIVE (right). Preference: same or similar.",
  },

  // Q22: Social Energy Level
  {
    id: "q22",
    type: "scale",
    text: "Where do you fall socially?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Strong introvert, 5 = Strong extrovert. Preference: same, similar, or different.",
  },

  // Q23: Battery Recharge Style
  {
    id: "q23",
    type: "single-choice",
    text: "How do you usually recharge your energy?",
    required: true,
    hasImportance: true,
    options: [
      { value: "lots-alone-time", label: "Need lots of alone time" },
      { value: "some-alone-time", label: "Need some alone time" },
      { value: "balanced", label: "Balanced" },
      { value: "energized-by-people", label: "Energized by people" },
      { value: "always-want-company", label: "Almost always want company" },
    ],
    helpText: "Preference: match's recharge style aligns with yours.",
  },

  // Q24: Party / Nightlife Interest
  {
    id: "q24",
    type: "scale",
    text: "How interested are you in parties or nightlife?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Not interested, 5 = Love going out. Preference: same or similar.",
  },

  // Q25: Conflict Resolution Approach (Special case - compatibility matrix)
  {
    id: "q25",
    type: "multi-choice",
    text: "When conflict comes up with someone you're dating, what feels most natural to you?",
    required: true,
    hasImportance: true,
    maxSelections: 2, // Max 2 selections
    options: [
      {
        value: "compromise-focused",
        label:
          "Compromise-focused — Find middle ground where both people give a little",
      },
      {
        value: "solution-focused",
        label:
          "Solution-focused — Take action together to solve the root problem",
      },
      {
        value: "emotion-focused",
        label:
          "Emotion-focused — Express and process feelings before problem-solving",
      },
      {
        value: "analysis-focused",
        label: "Analysis-focused — Understand what caused the conflict and why",
      },
      {
        value: "space-first",
        label: "Space-first — Take time to cool down before discussing",
      },
      {
        value: "direct-address",
        label: "Direct-address — Talk through the issue immediately and openly",
      },
    ],
    helpText: "Select up to 2. Preference: same or compatible approach.",
  },

  // Q26: Texting Frequency
  {
    id: "q26",
    type: "single-choice",
    text: "What level of texting feels best to you in a relationship?",
    required: true,
    hasImportance: true,
    options: [
      { value: "minimal", label: "Minimal texting" },
      { value: "moderate-checkins", label: "Moderate daily check-ins" },
      {
        value: "frequent-throughout-day",
        label: "Frequent throughout the day",
      },
      { value: "constant", label: "Constant communication" },
      { value: "whatever-natural", label: "Whatever feels natural" },
    ],
    helpText: "Preference: same or similar frequency.",
  },

  // Q27: Physical Affection Comfort (Public)
  {
    id: "q27",
    type: "scale",
    text: "How comfortable are you with public displays of affection?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Very uncomfortable, 5 = Very comfortable. Preference: same or similar.",
  },

  // Q28: Planning vs Spontaneity
  {
    id: "q28",
    type: "scale",
    text: "How do you usually approach plans?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Strong planner, 5 = Very spontaneous. Preference: same, similar, or different.",
  },

  // Q29: Sleep Schedule (Special case - "Flexible" compatible with all)
  {
    id: "q29",
    type: "single-choice",
    text: "Which best describes your sleep schedule?",
    required: true,
    hasImportance: true,
    options: [
      { value: "early-bird", label: "Early bird" },
      { value: "night-owl", label: "Night owl" },
      { value: "flexible", label: "Flexible" },
    ],
    helpText:
      "'Flexible' is compatible with any option. Preference: same schedule.",
  },

  // Q30: Cleanliness / Organization
  {
    id: "q30",
    type: "scale",
    text: "How important is cleanliness and organization to you?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Not very important, 5 = Extremely important. Preference: same or similar.",
  },

  // Q31: Openness to Trying New Things
  {
    id: "q31",
    type: "scale",
    text: "How open are you to trying new activities or experiences?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Prefer familiar things, 5 = Love new experiences. Preference: same or similar.",
  },

  // Q32: What Counts as Cheating
  {
    id: "q32",
    type: "multi-choice",
    text: "Which of the following would you personally consider cheating in a relationship?",
    required: true,
    hasImportance: true,
    options: [
      {
        value: "physical-intimacy",
        label: "Physical intimacy with someone else",
      },
      {
        value: "emotional-intimacy",
        label: "Emotional intimacy with someone else",
      },
      { value: "flirting", label: "Flirting" },
      { value: "online-interactions", label: "Online interactions" },
      { value: "depends-context", label: "Depends heavily on context" },
    ],
    helpText: "Select all that apply. Preference: same or similar definition.",
  },

  // Q33: Group Socializing Preference
  {
    id: "q33",
    type: "scale",
    text: "How do you generally prefer to socialize?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Mostly one-on-one, 5 = Large group settings. Preference: same, similar, or different.",
  },

  // Q34: Outdoor vs Indoor Activities
  {
    id: "q34",
    type: "scale",
    text: "Which types of activities do you generally prefer?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Strongly indoor, 5 = Strongly outdoor. Preference: same, similar, or different.",
  },

  // Q35: Communication Directness
  {
    id: "q35",
    type: "scale",
    text: "How direct is your communication style?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Very polite / indirect, 5 = Very blunt / radically honest. Preference: same, similar, or different.",
  },

  // Q36: Emotional Processing Style
  {
    id: "q36",
    type: "scale",
    text: "When something is bothering you, how do you usually handle it?",
    required: true,
    hasImportance: true,
    min: 1,
    max: 5,
    step: 1,
    helpText:
      "1 = Process internally, 5 = Prefer to talk it through. Preference: same or similar.",
  },
];

// ============================================
// FREE RESPONSE QUESTIONS (Not used in algorithm)
// ============================================

const freeResponseQuestions: Question[] = [
  // Q37: Relationship Values (Mandatory)
  {
    id: "q37",
    type: "textarea",
    text: "What do you value most in a relationship (or a friendship)?",
    required: true,
    hasImportance: false, // Free response, no importance
    minLength: 10,
    maxLength: 500,
    placeholder: "Share what matters most to you in relationships...",
    helpText: "This helps your match and cupids understand your priorities.",
  },

  // Q38: Question for Match (Mandatory)
  {
    id: "q38",
    type: "textarea",
    text: "Ask your match a question! Write one question you'd want your match to answer.",
    required: true,
    hasImportance: false,
    minLength: 10,
    maxLength: 300,
    placeholder: "This could be fun, deep, or anything in between...",
    helpText: "Your match will see this question in their profile.",
  },

  // Optional free response questions (not required)
  // Note: These are commented out for now as they're marked optional in the spec
  // Uncomment if you want to include them
  /*
  {
    id: "q39",
    type: "textarea",
    text: "If you were matched, what is one thing you want the other person to know about you?",
    required: false,
    hasImportance: false,
    maxLength: 300,
    placeholder: "Share something important about yourself...",
  },
  {
    id: "q40",
    type: "textarea",
    text: "What's something you're passionate about that people might not know?",
    required: false,
    hasImportance: false,
    maxLength: 300,
    placeholder: "Tell us about a hidden passion...",
  },
  {
    id: "q41",
    type: "textarea",
    text: "Something I absolutely cannot compromise on in a relationship:",
    required: false,
    hasImportance: false,
    maxLength: 300,
    placeholder: "What's your non-negotiable?",
  },
  */
];

// ============================================
// CONFIGURATION EXPORT
// ============================================

const section1: Section = {
  id: "section-1",
  title: "Section 1: Lifestyle & Values",
  description:
    "Help us understand your lifestyle, values, and what you're looking for in a match.",
  questions: section1Questions,
};

const section2: Section = {
  id: "section-2",
  title: "Section 2: Personality & Dynamics",
  description:
    "Tell us about your personality, interaction style, and relationship preferences.",
  questions: section2Questions,
};

const section3: Section = {
  id: "section-3",
  title: "Free Response",
  description: "Share your thoughts and ask your match a question.",
  questions: freeResponseQuestions,
};

export const questionnaireConfigV2: QuestionnaireConfig = {
  agreement: {
    title: "Before You Begin",
    description:
      "Welcome to the UBCupids questionnaire! Please read and agree to the following:",
    points: [
      "This questionnaire will take approximately 15-20 minutes to complete.",
      "Your responses will be used to find compatible matches for you.",
      "Be honest and thoughtful in your answers - this helps us make better matches.",
      "Your responses are encrypted and kept confidential.",
      "You can save your progress and return later.",
    ],
    commitments: [
      "I will answer all questions honestly and thoughtfully.",
      "I understand my responses will be used for matching purposes.",
      "I will treat my matches with respect and kindness.",
    ],
    reminder:
      "Remember: The more authentic you are, the better your matches will be!",
    agreementText: "I have read and agree to the above commitments.",
  },
  sections: [section1, section2, section3],
};

// Export convenience functions
export const getTotalQuestions = (): number => {
  return (
    section1Questions.length +
    section2Questions.length +
    freeResponseQuestions.filter((q) => q.required).length
  );
};

export const getAlgorithmQuestions = (): Question[] => {
  // Only Q1-Q36 are used in the matching algorithm (38 total includes 2 mandatory free response)
  return [...section1Questions, ...section2Questions];
};

export const getFreeResponseQuestions = (): Question[] => {
  return freeResponseQuestions;
};

export const getHardFilterQuestions = (): string[] => {
  // Questions that are hard filters (no importance rating)
  return ["q1", "q2", "q4"]; // Gender identity, gender preference, age
};

export const getSpecialCaseQuestions = (): Record<string, string> => {
  // Questions with special matching logic (Type I)
  return {
    q21: "love-languages", // Bidirectional matching
    q25: "conflict-resolution", // Compatibility matrix
    q29: "sleep-schedule", // "Flexible" wildcard
    q9: "drug-use", // Compound logic (substances + frequency)
  };
};
