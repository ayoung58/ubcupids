/**
 * Questionnaire V2 Configuration
 *
 * Complete configuration for all 36 questions + 5 free response questions.
 * Each question is fully defined with options, validation, and preference settings.
 */

import {
  QuestionConfig,
  FreeResponseConfig,
  QuestionType,
  Section,
  QuestionOption,
} from "@/types/questionnaire-v2";
import {
  AGE_LIMITS,
  FREE_RESPONSE_LIMITS,
  MULTI_SELECT_LIMITS,
} from "./constants";

// ============================================
// QUESTION OPTIONS
// ============================================

// Reusable option sets
const GENDER_IDENTITY_OPTIONS: QuestionOption[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non-binary", label: "Non-binary" },
  { value: "genderqueer", label: "Genderqueer" },
  { value: "prefer_not_to_answer", label: "Prefer not to say" },
  { value: "self_describe", label: "Self-describe", allowCustomInput: true },
];

const GENDER_PREFERENCE_OPTIONS: QuestionOption[] = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "non_binary", label: "Non-binary people" },
  { value: "genderqueer", label: "Genderqueer" },
  { value: "anyone", label: "Anyone", exclusive: true },
];

const SEXUAL_ORIENTATION_OPTIONS: QuestionOption[] = [
  { value: "sexual_romantic", label: "Sexual & Romantic" },
  { value: "pansexual", label: "Pansexual" },
  { value: "asexual", label: "Asexual (sexual attraction)" },
  { value: "aromantic", label: "Aromantic (romantic attraction)" },
  { value: "asexual_aromantic", label: "Asexual & aromantic" },
  { value: "questioning", label: "Questioning" },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];

const CULTURAL_BACKGROUND_OPTIONS: QuestionOption[] = [
  { value: "east_asian", label: "East Asian" },
  { value: "south_asian", label: "South Asian" },
  { value: "southeast_asian", label: "Southeast Asian" },
  { value: "black", label: "Black" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "latin_american", label: "Latin American" },
  { value: "white", label: "White" },
  { value: "indigenous", label: "Indigenous" },
  { value: "mixed", label: "Mixed" },
  { value: "other", label: "Other", allowCustomInput: true },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];

const RELIGION_OPTIONS: QuestionOption[] = [
  { value: "atheist", label: "Atheist" },
  { value: "agnostic", label: "Agnostic" },
  { value: "spiritual_not_religious", label: "Spiritual but not religious" },
  { value: "christian", label: "Christian" },
  { value: "muslim", label: "Muslim" },
  { value: "jewish", label: "Jewish" },
  { value: "hindu", label: "Hindu" },
  { value: "buddhist", label: "Buddhist" },
  { value: "sikh", label: "Sikh" },
  { value: "other", label: "Other", allowCustomInput: true },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];

const ALCOHOL_OPTIONS: QuestionOption[] = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "socially", label: "Socially" },
  { value: "frequently", label: "Frequently" },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];

const DRUG_SUBSTANCE_OPTIONS: QuestionOption[] = [
  { value: "cannabis", label: "Cannabis" },
  { value: "cigarettes", label: "Cigarettes" },
  { value: "vaping", label: "Vaping" },
  { value: "other_recreational", label: "Other recreational drugs" },
  { value: "none", label: "None" },
];

const DRUG_FREQUENCY_OPTIONS: QuestionOption[] = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" },
];

const RELATIONSHIP_STYLE_OPTIONS: QuestionOption[] = [
  { value: "exclusively_monogamous", label: "Exclusively monogamous" },
  { value: "open_to_non_monogamy", label: "Open to ethical non-monogamy" },
  { value: "polyamorous", label: "Polyamorous" },
  { value: "exploring_unsure", label: "Exploring / unsure" },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];

const RELATIONSHIP_INTENT_OPTIONS: QuestionOption[] = [
  { value: "casual_dating", label: "Casual dating" },
  { value: "open_to_serious", label: "Open to something serious" },
  { value: "friendship_like", label: "Friendship" },
  { value: "seeking_long_term", label: "Looking for a long-term partner" },
];

const SEXUAL_ACTIVITY_EXPECTATIONS_OPTIONS: QuestionOption[] = [
  { value: "marriage", label: "Want to wait until marriage" },
  {
    value: "serious_commitment",
    label: "Want to wait until serious commitment",
  },
  { value: "connection", label: "Comfortable after establishing a connection" },
  { value: "early_on", label: "Comfortable early on" },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];

const FIELD_OF_STUDY_OPTIONS: QuestionOption[] = [
  { value: "science", label: "Science" },
  { value: "engineering", label: "Engineering" },
  { value: "arts", label: "Arts" },
  { value: "commerce", label: "Commerce" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const LIVING_SITUATION_OPTIONS: QuestionOption[] = [
  { value: "on_campus", label: "On-campus residence" },
  { value: "off_campus_alone", label: "Off-campus (living alone)" },
  { value: "off_campus_roommates", label: "Off-campus (with roommates)" },
  { value: "with_family", label: "With family" },
  { value: "other", label: "Other" },
];

const PET_ATTITUDE_OPTIONS: QuestionOption[] = [
  {
    value: "have_pets_important",
    label: "Have pets and they are very important",
  },
  { value: "have_pets", label: "Have pets" },
  { value: "no_pets_like_them", label: "Don't have pets but really like them" },
  { value: "neutral", label: "Neutral about pets" },
  { value: "allergic", label: "Allergic or cannot be around pets" },
  { value: "dont_like", label: "Don't like pets" },
];

const RELATIONSHIP_EXPERIENCE_OPTIONS: QuestionOption[] = [
  { value: "no_prior", label: "No prior relationships or dating experience" },
  {
    value: "dated_not_serious",
    label: "I've dated but have not had a serious relationship",
  },
  { value: "one_serious", label: "One serious relationship" },
  { value: "few_relationships", label: "A few relationships" },
  { value: "many_relationships", label: "Many relationships" },
  { value: "prefer_not_to_answer", label: "Prefer not to answer" },
];

const LOVE_LANGUAGES_OPTIONS: QuestionOption[] = [
  { value: "words_of_affirmation", label: "Words of affirmation" },
  { value: "quality_time", label: "Quality time" },
  { value: "acts_of_service", label: "Acts of service" },
  { value: "physical_touch", label: "Physical touch" },
  { value: "receiving_gifts", label: "Receiving gifts" },
];

const RECHARGE_STYLE_OPTIONS: QuestionOption[] = [
  { value: "lots_of_alone_time", label: "Need lots of alone time" },
  { value: "some_alone_time", label: "Need some alone time" },
  { value: "balanced", label: "Balanced" },
  { value: "energized_by_people", label: "Energized by people" },
  { value: "always_want_company", label: "Almost always want company" },
];

const CONFLICT_RESOLUTION_OPTIONS: QuestionOption[] = [
  {
    value: "compromise",
    label:
      "Compromise-focused — Find middle ground where both people give a little",
  },
  {
    value: "solution",
    label: "Solution-focused — Take action together to solve the root problem",
  },
  {
    value: "emotion",
    label:
      "Emotion-focused — Express and process feelings before problem-solving",
  },
  {
    value: "analysis",
    label: "Analysis-focused — Understand what caused the conflict and why",
  },
  {
    value: "space",
    label: "Space-first — Take time to cool down before discussing",
  },
  {
    value: "direct",
    label: "Direct-address — Talk through the issue immediately and openly",
  },
];

const TEXTING_FREQUENCY_OPTIONS: QuestionOption[] = [
  { value: "minimal", label: "Minimal texting" },
  { value: "moderate", label: "Moderate daily check-ins" },
  { value: "frequent", label: "Frequent throughout the day" },
  { value: "constant", label: "Constant communication" },
  { value: "whatever_feels_natural", label: "Whatever feels natural" },
];

const SLEEP_SCHEDULE_OPTIONS: QuestionOption[] = [
  { value: "early_bird", label: "Early bird" },
  { value: "night_owl", label: "Night owl" },
  { value: "flexible", label: "Flexible" },
];

const CHEATING_DEFINITION_OPTIONS: QuestionOption[] = [
  { value: "physical_intimacy", label: "Physical intimacy with someone else" },
  {
    value: "emotional_intimacy",
    label: "Emotional intimacy with someone else",
  },
  { value: "flirting", label: "Flirting" },
  { value: "online_interactions", label: "Online interactions" },
  { value: "depends_on_context", label: "Depends heavily on context" },
];

// ============================================
// SECTION 1: LIFESTYLE / SURFACE COMPATIBILITY (Q1-Q20)
// ============================================

export const QUESTIONS_SECTION_1: QuestionConfig[] = [
  // Q1: Gender Identity (Hard Filter)
  {
    id: "q1",
    section: Section.SECTION_1,
    type: QuestionType.CATEGORICAL_NO_PREFERENCE,
    questionText: "What is your gender identity?",
    answerFormat: "single-select",
    options: GENDER_IDENTITY_OPTIONS,
    hasPreference: false,
    validation: {
      required: true,
    },
  },

  // Q2: Gender Preference (Hard Filter)
  {
    id: "q2",
    section: Section.SECTION_1,
    type: QuestionType.CATEGORICAL_NO_PREFERENCE,
    questionText: "Which gender(s) are you interested in matching with?",
    answerFormat: "multi-select",
    options: GENDER_PREFERENCE_OPTIONS,
    hasPreference: false,
    validation: {
      required: true,
      minSelections: 1,
    },
    helpText: 'Selecting "Anyone" will match you with all genders',
  },

  // Q3: Sexual Orientation
  {
    id: "q3",
    section: Section.SECTION_1,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText:
      "Which option best describes your sexual and/or romantic orientation?",
    answerFormat: "single-select",
    options: SEXUAL_ORIENTATION_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "multi-select",
    preferenceOptions: SEXUAL_ORIENTATION_OPTIONS.filter(
      (opt) => opt.value !== "prefer_not_to_answer"
    ),
    validation: {
      required: true,
    },
    helpText:
      'Preference defaults to "same orientation" but you can select multiple acceptable orientations',
  },

  // Q4: Age (Hard Filter)
  {
    id: "q4",
    section: Section.SECTION_1,
    type: QuestionType.SPECIAL_AGE,
    questionText: "What is your age?",
    answerFormat: "numeric",
    hasPreference: true,
    preferenceText: "My match should be between",
    preferenceFormat: "special", // Age range inputs
    validation: {
      required: true,
      minValue: AGE_LIMITS.MIN,
      maxValue: AGE_LIMITS.MAX,
    },
    helpText: `Age must be between ${AGE_LIMITS.MIN} and ${AGE_LIMITS.MAX}`,
  },

  // Q5: Cultural / Ethnic Background
  {
    id: "q5",
    section: Section.SECTION_1,
    type: QuestionType.MULTI_SELECT_WITH_PREFERENCE,
    questionText:
      "Which cultural or ethnic background(s) do you identify with?",
    answerFormat: "multi-select",
    options: CULTURAL_BACKGROUND_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to be",
    preferenceFormat: "multi-select",
    preferenceOptions: CULTURAL_BACKGROUND_OPTIONS.filter(
      (opt) => opt.value !== "prefer_not_to_answer"
    ),
    validation: {
      minSelections: 1,
    },
  },

  // Q6: Religious Beliefs
  {
    id: "q6",
    section: Section.SECTION_1,
    type: QuestionType.MULTI_SELECT_WITH_PREFERENCE,
    questionText: "What are your religious or spiritual beliefs, if any?",
    answerFormat: "multi-select",
    options: RELIGION_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "same-or-similar",
    validation: {
      minSelections: 1,
    },
  },

  // Q7: Political Leaning
  {
    id: "q7",
    section: Section.SECTION_1,
    type: QuestionType.LIKERT_SAME_SIMILAR,
    questionText: "Where do your political views generally fall?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Very progressive / left",
      midLabel: "Centrist",
      maxLabel: "Very conservative / right",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "same-or-similar",
    validation: {},
    options: [{ value: "prefer_not_to_answer", label: "Prefer not to answer" }],
  },

  // Q8: Alcohol Consumption
  {
    id: "q8",
    section: Section.SECTION_1,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText: "How often do you drink alcohol?",
    answerFormat: "single-select",
    options: ALCOHOL_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to drink",
    preferenceFormat: "multi-select",
    preferenceOptions: ALCOHOL_OPTIONS.filter(
      (opt) => opt.value !== "prefer_not_to_answer"
    ),
    validation: {},
  },

  // Q9a: Drug Use - Substances
  {
    id: "q9a",
    section: Section.SECTION_1,
    type: QuestionType.MULTI_SELECT_WITH_PREFERENCE,
    questionText: "Which of the following do you use?",
    answerFormat: "multi-select",
    options: DRUG_SUBSTANCE_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to use",
    preferenceFormat: "multi-select",
    preferenceOptions: DRUG_SUBSTANCE_OPTIONS,
    validation: {
      minSelections: 1,
    },
    helpText: "Select all substances that apply",
  },

  // Q9b: Drug Use - Frequency
  {
    id: "q9b",
    section: Section.SECTION_1,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText: "How often do you use these substances?",
    answerFormat: "single-select",
    options: DRUG_FREQUENCY_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to use substances",
    preferenceFormat: "same-or-similar",
    validation: {},
    helpText: "Overall frequency of substance use",
  },

  // Q10: Exercise / Physical Activity
  {
    id: "q10",
    section: Section.SECTION_1,
    type: QuestionType.LIKERT_DIRECTIONAL,
    questionText: "How physically active are you on average?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Sedentary",
      maxLabel: "Very active / athlete",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to exercise",
    preferenceFormat: "directional",
    validation: {},
  },

  // Q11: Relationship Style
  {
    id: "q11",
    section: Section.SECTION_1,
    type: QuestionType.CATEGORICAL_SAME_PREFERENCE,
    questionText: "Which relationship structure are you most comfortable with?",
    answerFormat: "single-select",
    options: RELATIONSHIP_STYLE_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to have the same relationship style",
    preferenceFormat: "same-or-similar",
    validation: {},
    warningText: "High dealbreaker usage expected for this question",
  },

  // Q12: Sexual Activity Expectations
  {
    id: "q12",
    section: Section.SECTION_1,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText:
      "Which best describes your expectations around sexual activity in a relationship?",
    answerFormat: "single-select",
    options: SEXUAL_ACTIVITY_EXPECTATIONS_OPTIONS,
    hasPreference: true,
    preferenceText:
      "I prefer my match to have expectations around sexual activity that are",
    preferenceFormat: "same-or-similar",
    preferenceOptions: SEXUAL_ACTIVITY_EXPECTATIONS_OPTIONS.filter(
      (opt) => opt.value !== "prefer_not_to_answer"
    ),
    validation: {
      required: true,
    },
  },

  // Q13: Relationship Intent
  {
    id: "q13",
    section: Section.SECTION_1,
    type: QuestionType.MULTI_SELECT_WITH_PREFERENCE,
    questionText: "What are you primarily looking for right now?",
    answerFormat: "multi-select",
    options: RELATIONSHIP_INTENT_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to be looking for",
    preferenceFormat: "multi-select",
    preferenceOptions: RELATIONSHIP_INTENT_OPTIONS,
    validation: {
      minSelections: 1,
    },
  },

  // Q14: Field of Study
  {
    id: "q14",
    section: Section.SECTION_1,
    type: QuestionType.MULTI_SELECT_WITH_PREFERENCE,
    questionText: "Which faculty best describes your field of study?",
    answerFormat: "multi-select",
    options: FIELD_OF_STUDY_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to be in",
    preferenceFormat: "multi-select",
    preferenceOptions: FIELD_OF_STUDY_OPTIONS,
    validation: {
      minSelections: 1,
    },
  },

  // Q15: Living Situation
  {
    id: "q15",
    section: Section.SECTION_1,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText: "What is your current living situation?",
    answerFormat: "single-select",
    options: LIVING_SITUATION_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to be living",
    preferenceFormat: "multi-select",
    preferenceOptions: LIVING_SITUATION_OPTIONS,
    validation: {},
  },

  // Q16: Ambition Level
  {
    id: "q16",
    section: Section.SECTION_1,
    type: QuestionType.LIKERT_DIFFERENT,
    questionText: "How driven are you academically or career-wise?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Relaxed",
      maxLabel: "Highly driven / competitive",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have a",
    preferenceFormat: "same-or-similar",
    validation: {},
  },

  // Q17: Financial Attitudes
  {
    id: "q17",
    section: Section.SECTION_1,
    type: QuestionType.LIKERT_DIFFERENT,
    questionText: "How do you generally approach spending money?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Very budget-conscious",
      maxLabel: "Very comfortable spending",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have a",
    preferenceFormat: "same-similar-different",
    validation: {},
  },

  // Q18: Time Availability
  {
    id: "q18",
    section: Section.SECTION_1,
    type: QuestionType.LIKERT_SAME_SIMILAR,
    questionText: "How available are you for dating during the school term?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Very limited",
      maxLabel: "Very available",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "same-or-similar",
    validation: {},
  },

  // Q19: Pet Ownership / Attitude
  {
    id: "q19",
    section: Section.SECTION_1,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText: "Which best describes your relationship with pets?",
    answerFormat: "single-select",
    options: PET_ATTITUDE_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to",
    preferenceFormat: "multi-select",
    preferenceOptions: PET_ATTITUDE_OPTIONS,
    validation: {},
  },

  // Q20: Relationship Experience
  {
    id: "q20",
    section: Section.SECTION_1,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText: "How would you describe your past relationship experience?",
    answerFormat: "single-select",
    options: RELATIONSHIP_EXPERIENCE_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "multi-select",
    preferenceOptions: RELATIONSHIP_EXPERIENCE_OPTIONS.filter(
      (opt) => opt.value !== "prefer_not_to_answer"
    ),
    validation: {},
  },
];

// ============================================
// SECTION 2: PERSONALITY / INTERACTION STYLE (Q21-Q36)
// ============================================

export const QUESTIONS_SECTION_2: QuestionConfig[] = [
  // Q21: Love Languages
  {
    id: "q21",
    section: Section.SECTION_2,
    type: QuestionType.MULTI_SELECT_WITH_PREFERENCE,
    questionText:
      "Which 2 love languages best describe how you show affection?",
    answerFormat: "multi-select",
    options: LOVE_LANGUAGES_OPTIONS,
    hasPreference: true,
    preferenceText: "Which 2 love languages do you like to receive?",
    preferenceFormat: "multi-select",
    preferenceOptions: LOVE_LANGUAGES_OPTIONS,
    validation: {
      minSelections: 2,
      maxSelections: 2,
    },
    helpText:
      "LEFT: Select exactly 2 you show. RIGHT: Select 2 you like to receive.",
  },

  // Q22: Social Energy Level
  {
    id: "q22",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_DIFFERENT,
    questionText: "Where do you fall socially?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Strong introvert",
      maxLabel: "Strong extrovert",
    },
    hasPreference: true,
    preferenceText: "I prefer someone with a",
    preferenceFormat: "same-similar-different",
    validation: {},
  },

  // Q23: Battery Recharge Style
  {
    id: "q23",
    section: Section.SECTION_2,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText: "How do you usually recharge your energy?",
    answerFormat: "single-select",
    options: RECHARGE_STYLE_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match's recharge style to align with mine",
    preferenceFormat: "same",
    validation: {},
  },

  // Q24: Party / Nightlife Interest
  {
    id: "q24",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_SAME_SIMILAR,
    questionText: "How interested are you in parties or nightlife?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Not interested",
      maxLabel: "Love going out",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "same-or-similar",
    validation: {},
  },

  // Q25: Conflict Resolution (Special Case)
  {
    id: "q25",
    section: Section.SECTION_2,
    type: QuestionType.SPECIAL_CONFLICT_RESOLUTION,
    questionText:
      "When conflict comes up with someone you're dating, what feels most natural to you? (Select all that apply, up to 2)",
    answerFormat: "multi-select",
    options: CONFLICT_RESOLUTION_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to approach conflict in a",
    preferenceFormat: "special", // same / compatible / no preference
    validation: {
      minSelections: 1,
      maxSelections: MULTI_SELECT_LIMITS.Q25_CONFLICT_RESOLUTION.MAX,
    },
  },

  // Q26: Texting Frequency
  {
    id: "q26",
    section: Section.SECTION_2,
    type: QuestionType.SINGLE_SELECT_MULTI_PREFERENCE,
    questionText: "What level of texting feels best to you in a relationship?",
    answerFormat: "single-select",
    options: TEXTING_FREQUENCY_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to text at a",
    preferenceFormat: "same-or-similar",
    validation: {},
  },

  // Q27: Physical Affection Comfort
  {
    id: "q27",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_SAME_SIMILAR,
    questionText: "How comfortable are you with public displays of affection?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Very uncomfortable",
      maxLabel: "Very comfortable",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to feel",
    preferenceFormat: "same-or-similar",
    validation: {},
  },

  // Q28: Planning vs Spontaneity
  {
    id: "q28",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_DIFFERENT,
    questionText: "How spontaneous are you?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Strong planner",
      maxLabel: "Very spontaneous",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have a",
    preferenceFormat: "same-similar-different",
    validation: {},
  },

  // Q29: Sleep Schedule (Special Case)
  {
    id: "q29",
    section: Section.SECTION_2,
    type: QuestionType.SPECIAL_SLEEP_SCHEDULE,
    questionText: "Which best describes your sleep schedule?",
    answerFormat: "single-select",
    options: SLEEP_SCHEDULE_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to have the same sleep schedule",
    preferenceFormat: "same",
    validation: {},
    helpText: '"Flexible" is compatible with any schedule',
  },

  // Q30: Cleanliness / Organization
  {
    id: "q30",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_SAME_SIMILAR,
    questionText: "How important is cleanliness and organization to you?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Not important",
      maxLabel: "Very important",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "same-or-similar",
    validation: {},
  },

  // Q31: Openness to Trying New Things
  {
    id: "q31",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_SAME_SIMILAR,
    questionText: "How open are you to trying new activities or experiences?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Prefer routine",
      maxLabel: "Love novelty",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "same-or-similar",
    validation: {},
  },

  // Q32: What Counts as Cheating
  {
    id: "q32",
    section: Section.SECTION_2,
    type: QuestionType.MULTI_SELECT_WITH_PREFERENCE,
    questionText:
      "Which of the following would you personally consider cheating in a relationship?",
    answerFormat: "multi-select",
    options: CHEATING_DEFINITION_OPTIONS,
    hasPreference: true,
    preferenceText: "I prefer my match to define cheating in",
    preferenceFormat: "same-or-similar",
    validation: {
      minSelections: 1,
    },
  },

  // Q33: Group Socializing Preference
  {
    id: "q33",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_DIFFERENT,
    questionText: "How do you generally prefer to socialize?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Mostly one-on-one",
      maxLabel: "Large group settings",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have a",
    preferenceFormat: "same-similar-different",
    validation: {},
  },

  // Q34: Outdoor vs Indoor Activities
  {
    id: "q34",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_DIFFERENT,
    questionText: "Which types of activities do you generally prefer?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Strongly indoor",
      maxLabel: "Strongly outdoor",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to have",
    preferenceFormat: "same-similar-different",
    validation: {},
  },

  // Q35: Communication Directness
  {
    id: "q35",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_DIFFERENT,
    questionText: "How direct is your communication style?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Very polite / indirect",
      maxLabel: "Very blunt / radically honest",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to communicate in a",
    preferenceFormat: "same-similar-different",
    validation: {},
  },

  // Q36: Emotional Processing Style
  {
    id: "q36",
    section: Section.SECTION_2,
    type: QuestionType.LIKERT_SAME_SIMILAR,
    questionText:
      "When something is bothering you, how do you usually handle it?",
    answerFormat: "likert",
    likertConfig: {
      min: 1,
      max: 5,
      minLabel: "Process internally",
      maxLabel: "Prefer to talk it through",
    },
    hasPreference: true,
    preferenceText: "I prefer my match to handle emotions in",
    preferenceFormat: "same-or-similar",
    validation: {},
  },
];

// ============================================
// FREE RESPONSE QUESTIONS
// ============================================

export const FREE_RESPONSE_QUESTIONS: FreeResponseConfig[] = [
  // Mandatory
  {
    id: "freeResponse1",
    questionText: "What do you value most in a relationship (or a friendship)?",
    required: true,
    maxLength: FREE_RESPONSE_LIMITS.MAX,
    placeholder: "Share what matters most to you...",
  },
  {
    id: "freeResponse2",
    questionText:
      "Ask your match a question! Write one question you'd want your match to answer. This could be fun, deep, or anything in between.",
    required: true,
    maxLength: FREE_RESPONSE_LIMITS.MAX,
    placeholder: "Your question for your match...",
  },

  // Optional
  {
    id: "freeResponse3",
    questionText:
      "If you were matched, what is one thing you want the other person to know about you?",
    required: false,
    maxLength: FREE_RESPONSE_LIMITS.MAX,
    placeholder: "Optional: Something you'd like your match to know...",
    helpText: "Optional - for your cupid and matches to get to know you better",
  },
  {
    id: "freeResponse4",
    questionText:
      "What's something you're passionate about that people might not know?",
    required: false,
    maxLength: FREE_RESPONSE_LIMITS.MAX,
    placeholder: "Optional: A passion or interest...",
    helpText: "Optional - for your cupid and matches to get to know you better",
  },
  {
    id: "freeResponse5",
    questionText:
      "Something I absolutely cannot compromise on in a relationship:",
    required: false,
    maxLength: FREE_RESPONSE_LIMITS.MAX,
    placeholder: "Optional: Your non-negotiables...",
    helpText: "Optional - for your cupid and matches to get to know you better",
  },
];

// ============================================
// COMBINED EXPORTS
// ============================================

/**
 * All questions in order (Q1-Q36)
 */
export const ALL_QUESTIONS: QuestionConfig[] = [
  ...QUESTIONS_SECTION_1,
  ...QUESTIONS_SECTION_2,
];

/**
 * Question lookup by ID
 */
export const QUESTION_BY_ID: Record<string, QuestionConfig> =
  ALL_QUESTIONS.reduce(
    (acc, question) => {
      acc[question.id] = question;
      return acc;
    },
    {} as Record<string, QuestionConfig>
  );

/**
 * Get question by ID
 */
export function getQuestionById(id: string): QuestionConfig | undefined {
  return QUESTION_BY_ID[id];
}

/**
 * Get all questions for a section
 */
export function getQuestionsBySection(section: Section): QuestionConfig[] {
  return ALL_QUESTIONS.filter((q) => q.section === section);
}

/**
 * Export drug use frequency options for preference selector
 */
export { DRUG_FREQUENCY_OPTIONS };
