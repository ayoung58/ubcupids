/**
 * Database Seeding Script
 *
 * Creates test data for the matching system:
 * - 250 users waiting to be matched (isBeingMatched: true)
 * - 250 cupids (isCupid: true with approved CupidProfile)
 * - 250 questionnaire responses (encrypted)
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 */

import { PrismaClient } from "@prisma/client";
import { encryptJSON } from "../lib/encryption";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================
// Configuration
// ============================================

const NUM_USERS = 250;
const NUM_CUPIDS = 250;
const DEFAULT_PASSWORD = "TestPassword123!";

// ============================================
// Data Generators
// ============================================

const FIRST_NAMES_MALE = [
  "James",
  "John",
  "Michael",
  "David",
  "William",
  "Richard",
  "Joseph",
  "Thomas",
  "Christopher",
  "Daniel",
  "Matthew",
  "Anthony",
  "Mark",
  "Donald",
  "Steven",
  "Andrew",
  "Paul",
  "Joshua",
  "Kenneth",
  "Kevin",
  "Brian",
  "George",
  "Timothy",
  "Ronald",
  "Jason",
  "Edward",
  "Jeffrey",
  "Ryan",
  "Jacob",
  "Nicholas",
  "Gary",
  "Eric",
  "Jonathan",
  "Stephen",
  "Larry",
  "Justin",
  "Scott",
  "Brandon",
  "Benjamin",
  "Samuel",
  "Raymond",
  "Gregory",
  "Frank",
  "Alexander",
  "Patrick",
  "Jack",
  "Dennis",
  "Jerry",
  "Tyler",
  "Aaron",
  "Jose",
  "Adam",
  "Nathan",
  "Henry",
  "Zachary",
  "Douglas",
  "Peter",
  "Kyle",
  "Noah",
  "Ethan",
  "Jeremy",
  "Walter",
  "Christian",
  "Keith",
  "Roger",
];

const FIRST_NAMES_FEMALE = [
  "Mary",
  "Patricia",
  "Jennifer",
  "Linda",
  "Elizabeth",
  "Barbara",
  "Susan",
  "Jessica",
  "Sarah",
  "Karen",
  "Lisa",
  "Nancy",
  "Betty",
  "Margaret",
  "Sandra",
  "Ashley",
  "Kimberly",
  "Emily",
  "Donna",
  "Michelle",
  "Dorothy",
  "Carol",
  "Amanda",
  "Melissa",
  "Deborah",
  "Stephanie",
  "Rebecca",
  "Sharon",
  "Laura",
  "Cynthia",
  "Kathleen",
  "Amy",
  "Angela",
  "Shirley",
  "Anna",
  "Brenda",
  "Pamela",
  "Emma",
  "Nicole",
  "Helen",
  "Samantha",
  "Katherine",
  "Christine",
  "Debra",
  "Rachel",
  "Carolyn",
  "Janet",
  "Catherine",
  "Maria",
  "Heather",
  "Diane",
  "Ruth",
  "Julie",
  "Olivia",
  "Joyce",
  "Virginia",
  "Victoria",
  "Kelly",
  "Lauren",
  "Christina",
  "Joan",
  "Evelyn",
  "Judith",
  "Megan",
  "Andrea",
  "Cheryl",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Chen",
  "Wang",
  "Kim",
  "Park",
  "Singh",
  "Patel",
  "Khan",
  "Li",
  "Zhang",
];

const MAJORS = [
  "Computer Science",
  "Psychology",
  "Biology",
  "Engineering",
  "Business",
  "Economics",
  "Political Science",
  "Mathematics",
  "English",
  "Chemistry",
  "Physics",
  "History",
  "Sociology",
  "Philosophy",
  "Communications",
  "Environmental Science",
  "Nursing",
  "Architecture",
  "Music",
  "Fine Arts",
  "Kinesiology",
  "Pharmacy",
  "Law",
  "Education",
  "Linguistics",
];

const INTERESTS = [
  "hiking",
  "reading",
  "cooking",
  "gaming",
  "music",
  "photography",
  "traveling",
  "yoga",
  "movies",
  "sports",
  "art",
  "dancing",
  "writing",
  "fitness",
  "coffee",
  "nature",
  "technology",
  "fashion",
  "volunteering",
  "meditation",
  "podcasts",
  "board games",
  "anime",
  "concerts",
  "skiing",
  "swimming",
  "running",
  "cycling",
  "camping",
];

// V2 questionnaire uses dynamic question generation instead of static options
// Old V1 QUESTION_OPTIONS removed

// NOTE: For V2, question options are defined in questionnaireConfigV2.ts

// Sample open-ended responses
const DEALBREAKERS = [
  "Honesty and trust - I can't be with someone who lies.",
  "Respect for my time and commitments. I need reliability.",
  "Communication is essential. I need someone who talks through issues.",
  "Kindness to everyone, not just me. How they treat others matters.",
  "Having shared values about family and future goals.",
  "Supporting my career ambitions without feeling threatened.",
  "Being able to laugh together and not take life too seriously.",
  "Emotional availability - I need someone present and engaged.",
  "Mutual respect and being treated as an equal partner.",
  "Having separate friendships and personal space.",
];

const PASSIONS = [
  "I'm secretly really into astrophotography. I spend weekends driving to dark sky sites to capture the Milky Way. Most people think it's nerdy but I find it meditative.",
  "I've been learning Korean for 3 years now. Started because of K-dramas but now I genuinely love the language structure and culture.",
  "Urban farming is my thing - I maintain a rooftop garden and supply vegetables to a local restaurant. It started as a pandemic hobby.",
  "I'm training for an Ironman triathlon. It takes up most of my free time but the mental discipline has changed my life.",
  "Vintage synthesizers and electronic music production. I have a small home studio and release tracks anonymously on SoundCloud.",
  "I volunteer at a local animal shelter every weekend. I'm working on my foster license to help more animals find homes.",
  "Board game design - I've actually published two small games through Kickstarter. The community is incredibly supportive.",
  "I'm obsessed with historical cooking. I research medieval and renaissance recipes and try to recreate them with period-appropriate techniques.",
  "Teaching coding to underprivileged kids on weekends. Seeing their faces light up when their first program runs is amazing.",
  "Competitive puzzle solving - speedcubing specifically. My best 3x3 time is under 15 seconds.",
];

// V2 uses only DEALBREAKERS and PASSIONS for Q37-Q38 free response
// Old V1 MATCH_MESSAGES and MATCH_QUESTIONS removed

// ============================================
// Helper Functions
// ============================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateEmail(
  firstName: string,
  lastName: string,
  index: number
): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@student.ubc.ca`;
}

function generateAge(): number {
  // Most students are 18-24, some older
  const weights = [10, 20, 25, 20, 15, 5, 3, 2]; // 18-25
  const ages = [18, 19, 20, 21, 22, 23, 24, 25];
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return ages[i];
  }
  return 21;
}

function generateInterests(): string {
  return randomElements(INTERESTS, Math.floor(Math.random() * 4) + 3).join(
    ", "
  );
}

// V2 helper functions moved inline into generateQuestionnaireResponses()
// Old V1 helpers removed

/**
 * Generate V2 questionnaire responses with split-screen format
 * Each response includes: ownAnswer, preference, importance, dealbreaker
 */
function generateQuestionnaireResponses(
  userAge: number,
  gender: string,
  orientation: string,
  genderPreference: string[]
): Record<string, unknown> {
  const responses: Record<string, unknown> = {};

  // Helper: Generate random importance (1-4 scale for V2)
  const randImportance = () => {
    const weights = [10, 25, 40, 25]; // 1=10%, 2=25%, 3=40%, 4=25%
    const values = [1, 2, 3, 4];
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) return values[i];
    }
    return 3;
  };

  // Helper: Create QuestionResponse object
  const createResponse = (
    ownAnswer: unknown,
    preferenceType: string,
    preferenceValue?: unknown,
    importance: number = randImportance(),
    dealbreaker: boolean = false
  ) => ({
    ownAnswer,
    preference: {
      type: preferenceType,
      value: preferenceValue,
      doesntMatter: preferenceType === "doesntMatter",
    },
    importance: preferenceType === "doesntMatter" ? 1 : importance,
    dealbreaker: preferenceType === "doesntMatter" ? false : dealbreaker,
  });

  // ============================================
  // SECTION 1: Lifestyle (Q1-Q20)
  // ============================================

  // Q1: Gender Identity (Hard Filter)
  responses.q1 = createResponse(
    gender,
    "specific_values",
    genderPreference,
    4,
    false
  );

  // Q2: Gender Preference (Hard Filter)
  responses.q2 = createResponse(genderPreference, "same", undefined, 4, false);

  // Q3: Sexual Orientation
  responses.q3 = createResponse(
    orientation,
    Math.random() > 0.6 ? "same" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q4: Age (Hard Filter)
  const ageRange = {
    minAge: Math.max(18, userAge - (Math.floor(Math.random() * 3) + 1)),
    maxAge: Math.min(35, userAge + (Math.floor(Math.random() * 4) + 2)),
  };
  responses.q4 = createResponse(
    userAge.toString(),
    "specific_values",
    ageRange,
    4,
    false
  );

  // Q5: Cultural/Ethnic Background
  const cultures = [
    "east-asian",
    "south-asian",
    "southeast-asian",
    "black",
    "middle-eastern",
    "latin-american",
    "white",
    "indigenous",
    "mixed",
  ];
  const userCulture = randomElements(cultures, Math.random() > 0.7 ? 2 : 1);
  responses.q5 = createResponse(
    userCulture,
    Math.random() > 0.5 ? "doesntMatter" : "similar",
    undefined,
    randImportance()
  );

  // Q6: Religious Beliefs
  const religions = [
    "not-religious",
    "spiritual-not-religious",
    "christian",
    "muslim",
    "jewish",
    "hindu",
    "buddhist",
    "sikh",
  ];
  const userReligion = randomElement(religions);
  responses.q6 = createResponse(
    userReligion,
    userReligion === "not-religious"
      ? "doesntMatter"
      : Math.random() > 0.6
        ? "same"
        : "similar",
    undefined,
    randImportance()
  );

  // Q7: Political Leaning (Scale 1-5)
  const politicalLeaning = Math.floor(Math.random() * 5) + 1;
  responses.q7 = createResponse(
    politicalLeaning,
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q8: Alcohol Consumption
  const alcoholOptions = ["never", "rarely", "socially", "frequently"];
  const userAlcohol = randomElement(alcoholOptions);
  responses.q8 = createResponse(
    userAlcohol,
    Math.random() > 0.6 ? "specific_values" : "similar",
    Math.random() > 0.6 ? randomElements(alcoholOptions, 2) : undefined,
    randImportance()
  );

  // Q9: Drug Use (Compound)
  const drugOptions = [
    "cannabis",
    "cigarettes",
    "vaping",
    "other-recreational",
    "none",
  ];
  const userDrugs =
    Math.random() > 0.6
      ? ["none"]
      : randomElements(
          drugOptions.filter((d) => d !== "none"),
          Math.floor(Math.random() * 2) + 1
        );
  responses.q9 = createResponse(
    userDrugs,
    Math.random() > 0.5 ? "similar" : "specific_values",
    Math.random() > 0.5 ? ["none", "cannabis"] : undefined,
    randImportance(),
    userDrugs.includes("none") && Math.random() > 0.8 // Some non-users make it dealbreaker
  );

  // Q10: Exercise Level (Scale 1-5)
  const exerciseLevel = Math.floor(Math.random() * 5) + 1;
  responses.q10 = createResponse(
    exerciseLevel,
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q11: Diet Type
  const dietOptions = [
    "omnivore",
    "vegetarian",
    "vegan",
    "pescatarian",
    "other",
  ];
  const userDiet = randomElement(dietOptions);
  responses.q11 = createResponse(
    userDiet,
    userDiet === "vegan"
      ? Math.random() > 0.7
        ? "same"
        : "similar"
      : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q12: Smoking/Vaping
  const smokingOptions = ["never", "socially", "regularly", "trying-to-quit"];
  const userSmoking = randomElement(smokingOptions);
  responses.q12 = createResponse(
    userSmoking,
    userSmoking === "never"
      ? Math.random() > 0.7
        ? "same"
        : "doesntMatter"
      : "similar",
    undefined,
    randImportance(),
    userSmoking === "never" && Math.random() > 0.85
  );

  // Q13-Q20: Continue with similar patterns
  // Q13: Bedtime
  const bedtimes = [
    "before-11pm",
    "11pm-1am",
    "1am-3am",
    "after-3am",
    "flexible",
  ];
  responses.q13 = createResponse(
    randomElement(bedtimes),
    Math.random() > 0.5 ? "similar" : "compatible",
    undefined,
    randImportance()
  );

  // Q14: Morning Person vs Night Owl
  const morningNight = ["early-bird", "moderate", "night-owl"];
  responses.q14 = createResponse(
    randomElement(morningNight),
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q15: Social Battery
  const socialBattery = Math.floor(Math.random() * 5) + 1;
  responses.q15 = createResponse(
    socialBattery,
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q16: Cleanliness Level
  const cleanlinessOptions = [
    "very-clean",
    "clean",
    "organized-chaos",
    "messy",
  ];
  responses.q16 = createResponse(
    randomElement(cleanlinessOptions),
    Math.random() > 0.6 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q17: Financial Habits
  const financialOptions = ["saver", "balanced", "spender", "depends"];
  responses.q17 = createResponse(
    randomElement(financialOptions),
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q18: Travel Frequency
  const travelOptions = ["frequently", "occasionally", "rarely", "never"];
  responses.q18 = createResponse(
    randomElement(travelOptions),
    Math.random() > 0.6 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q19: Pets
  const petOptions = ["have-love", "dont-have-love", "allergic", "indifferent"];
  responses.q19 = createResponse(
    randomElement(petOptions),
    Math.random() > 0.5 ? "compatible" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q20: Long-term Goals
  const goalOptions = [
    "career-focused",
    "family-focused",
    "balanced",
    "exploring",
  ];
  responses.q20 = createResponse(
    randomElement(goalOptions),
    Math.random() > 0.6 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // ============================================
  // SECTION 2: Personality (Q21-Q36)
  // ============================================

  // Q21: Love Languages (Show vs Receive - bidirectional)
  const loveLanguages = [
    "physical-touch",
    "words-of-affirmation",
    "quality-time",
    "acts-of-service",
    "gifts",
  ];
  const userLoveLanguages = {
    show: randomElements(loveLanguages, 2),
    receive: randomElements(loveLanguages, 2),
  };
  responses.q21 = createResponse(
    userLoveLanguages,
    Math.random() > 0.5 ? "compatible" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q22: Communication Style
  const commStyles = ["direct", "thoughtful", "emotional", "reserved"];
  responses.q22 = createResponse(
    randomElement(commStyles),
    Math.random() > 0.6 ? "similar" : "compatible",
    undefined,
    randImportance()
  );

  // Q23: Conflict Resolution Style
  const conflictStyles = [
    "discuss-immediately",
    "need-space-first",
    "avoid",
    "compromise",
  ];
  responses.q23 = createResponse(
    randomElement(conflictStyles),
    Math.random() > 0.6 ? "compatible" : "similar",
    undefined,
    randImportance()
  );

  // Q24: Emotional Openness
  const emotionalOptions = [
    "very-open",
    "moderately-open",
    "private",
    "working-on-it",
  ];
  responses.q24 = createResponse(
    randomElement(emotionalOptions),
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q25: Conflict Frequency Tolerance (Compatibility matrix)
  const conflictFreq = [
    "healthy-disagreement",
    "occasional-only",
    "avoid-conflict",
    "doesnt-bother-me",
  ];
  responses.q25 = createResponse(
    randomElement(conflictFreq),
    "compatible",
    undefined,
    randImportance()
  );

  // Q26: Spontaneity vs Planning
  const planningStyle = ["spontaneous", "mix", "planner"];
  responses.q26 = createResponse(
    randomElement(planningStyle),
    Math.random() > 0.5 ? "similar" : "compatible",
    undefined,
    randImportance()
  );

  // Q27: Humor Style
  const humorOptions = ["sarcastic", "playful", "intellectual", "silly", "dry"];
  responses.q27 = createResponse(
    randomElement(humorOptions),
    Math.random() > 0.6 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q28: Introversion/Extroversion (Scale 1-5)
  const introExtro = Math.floor(Math.random() * 5) + 1;
  responses.q28 = createResponse(
    introExtro,
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q29: Sleep Schedule (Flexible wildcard option)
  const sleepSchedules = ["early-morning", "mid-day", "late-night", "flexible"];
  responses.q29 = createResponse(
    randomElement(sleepSchedules),
    Math.random() > 0.5 ? "similar" : "compatible",
    undefined,
    randImportance()
  );

  // Q30: Decision Making Style
  const decisionOptions = [
    "quick-decisive",
    "thoughtful-slow",
    "collaborative",
    "depends",
  ];
  responses.q30 = createResponse(
    randomElement(decisionOptions),
    Math.random() > 0.5 ? "compatible" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q31: Jealousy Level
  const jealousyOptions = [
    "not-jealous",
    "healthy-amount",
    "insecure",
    "working-on-it",
  ];
  responses.q31 = createResponse(
    randomElement(jealousyOptions),
    Math.random() > 0.6 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q32: Social Media Usage
  const socialMediaOptions = [
    "very-active",
    "moderate",
    "minimal",
    "not-on-social",
  ];
  responses.q32 = createResponse(
    randomElement(socialMediaOptions),
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q33: Need for Alone Time
  const aloneTimeOptions = [
    "need-daily",
    "few-times-week",
    "occasionally",
    "rarely",
  ];
  responses.q33 = createResponse(
    randomElement(aloneTimeOptions),
    Math.random() > 0.6 ? "similar" : "compatible",
    undefined,
    randImportance()
  );

  // Q34: Ambition Level
  const ambitionOptions = [
    "very-ambitious",
    "moderately-ambitious",
    "laid-back",
    "exploring",
  ];
  responses.q34 = createResponse(
    randomElement(ambitionOptions),
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  // Q35: Physical Affection in Public
  const pda = ["very-comfortable", "some-okay", "minimal", "prefer-private"];
  responses.q35 = createResponse(
    randomElement(pda),
    Math.random() > 0.6 ? "similar" : "compatible",
    undefined,
    randImportance()
  );

  // Q36: Values Priorities
  const valuesOptions = [
    "honesty",
    "loyalty",
    "adventure",
    "stability",
    "growth",
    "connection",
  ];
  const userValues = randomElements(valuesOptions, 3);
  responses.q36 = createResponse(
    userValues,
    Math.random() > 0.6 ? "similar" : "compatible",
    undefined,
    randImportance()
  );

  // ============================================
  // FREE RESPONSE (Q37-Q38): Cupids only
  // ============================================

  // Q37: Dealbreakers
  responses.q37 = createResponse(
    randomElement(DEALBREAKERS),
    "doesntMatter", // Free response, no preference
    undefined,
    1,
    false
  );

  // Q38: Fun Fact / Passion
  responses.q38 = createResponse(
    randomElement(PASSIONS),
    "doesntMatter", // Free response, no preference
    undefined,
    1,
    false
  );

  return responses;
}

// ============================================
// Perfect Match User Generation
// ============================================

/**
 * Create a pair of users designed to match well with each other (V2 format)
 * Returns their V2 questionnaire data
 */
function createPerfectMatchPair(baseAge: number): {
  user1: Record<string, unknown>;
  user2: Record<string, unknown>;
} {
  // Helper: Create QuestionResponse
  const createResponse = (
    ownAnswer: unknown,
    preferenceType: string,
    preferenceValue?: unknown,
    importance: number = 4,
    dealbreaker: boolean = false
  ) => ({
    ownAnswer,
    preference: {
      type: preferenceType,
      value: preferenceValue,
      doesntMatter: false,
    },
    importance,
    dealbreaker,
  });

  // ============================================
  // User 1: Woman looking for men
  // ============================================
  const user1Responses: Record<string, unknown> = {
    // Hard filters
    q1: createResponse("woman", "specific_values", ["man"], 4, false),
    q2: createResponse(["men"], "same", undefined, 4, false),
    q3: createResponse("heterosexual", "same", undefined, 3),
    q4: createResponse(
      baseAge.toString(),
      "specific_values",
      {
        minAge: baseAge - 2,
        maxAge: baseAge + 3,
      },
      4,
      false
    ),

    // Lifestyle (high compatibility)
    q5: createResponse(["white", "mixed"], "doesntMatter", undefined, 2),
    q6: createResponse("not-religious", "similar", undefined, 2),
    q7: createResponse(2, "similar", undefined, 3), // Progressive
    q8: createResponse("socially", "similar", undefined, 3),
    q9: createResponse(["none"], "same", undefined, 3, true), // Dealbreaker
    q10: createResponse(4, "similar", undefined, 3), // Active
    q11: createResponse("omnivore", "doesntMatter", undefined, 2),
    q12: createResponse("never", "same", undefined, 4, true), // Dealbreaker
    q13: createResponse("11pm-1am", "similar", undefined, 3),
    q14: createResponse("moderate", "similar", undefined, 2),
    q15: createResponse(4, "similar", undefined, 3), // Social
    q16: createResponse("clean", "similar", undefined, 3),
    q17: createResponse("balanced", "similar", undefined, 3),
    q18: createResponse("occasionally", "similar", undefined, 2),
    q19: createResponse("dont-have-love", "compatible", undefined, 3),
    q20: createResponse("balanced", "similar", undefined, 4),

    // Personality (high compatibility)
    q21: createResponse(
      {
        show: ["quality-time", "words-of-affirmation"],
        receive: ["physical-touch", "quality-time"],
      },
      "compatible",
      undefined,
      4
    ),
    q22: createResponse("direct", "similar", undefined, 4),
    q23: createResponse("discuss-immediately", "similar", undefined, 4),
    q24: createResponse("moderately-open", "similar", undefined, 3),
    q25: createResponse("healthy-disagreement", "compatible", undefined, 3),
    q26: createResponse("mix", "similar", undefined, 3),
    q27: createResponse("playful", "similar", undefined, 2),
    q28: createResponse(3, "similar", undefined, 3), // Balanced intro/extro
    q29: createResponse("11pm-1am", "similar", undefined, 2),
    q30: createResponse("collaborative", "compatible", undefined, 3),
    q31: createResponse("healthy-amount", "similar", undefined, 3),
    q32: createResponse("moderate", "similar", undefined, 2),
    q33: createResponse("few-times-week", "similar", undefined, 3),
    q34: createResponse("moderately-ambitious", "similar", undefined, 4),
    q35: createResponse("some-okay", "similar", undefined, 3),
    q36: createResponse(
      ["honesty", "connection", "growth"],
      "similar",
      undefined,
      4
    ),

    // Free response
    q37: createResponse(
      "Honesty and trust - I can't be with someone who lies.",
      "doesntMatter",
      undefined,
      1
    ),
    q38: createResponse(
      "I'm secretly really into astrophotography. I spend weekends driving to dark sky sites.",
      "doesntMatter",
      undefined,
      1
    ),
  };

  // ============================================
  // User 2: Man looking for women (matches User 1)
  // ============================================
  const user2Responses: Record<string, unknown> = {
    // Hard filters
    q1: createResponse("man", "specific_values", ["woman"], 4, false),
    q2: createResponse(["women"], "same", undefined, 4, false),
    q3: createResponse("heterosexual", "same", undefined, 3),
    q4: createResponse(
      baseAge.toString(),
      "specific_values",
      {
        minAge: baseAge - 3,
        maxAge: baseAge + 2,
      },
      4,
      false
    ),

    // Lifestyle (matches User 1)
    q5: createResponse(["white"], "doesntMatter", undefined, 2),
    q6: createResponse("not-religious", "similar", undefined, 2),
    q7: createResponse(2, "similar", undefined, 3), // Progressive
    q8: createResponse("socially", "similar", undefined, 3),
    q9: createResponse(["none"], "same", undefined, 3, true), // Dealbreaker
    q10: createResponse(4, "similar", undefined, 3), // Active
    q11: createResponse("omnivore", "doesntMatter", undefined, 2),
    q12: createResponse("never", "same", undefined, 4, true), // Dealbreaker
    q13: createResponse("11pm-1am", "similar", undefined, 3),
    q14: createResponse("moderate", "similar", undefined, 2),
    q15: createResponse(3, "similar", undefined, 3), // Social
    q16: createResponse("clean", "similar", undefined, 3),
    q17: createResponse("balanced", "similar", undefined, 3),
    q18: createResponse("occasionally", "similar", undefined, 2),
    q19: createResponse("dont-have-love", "compatible", undefined, 3),
    q20: createResponse("balanced", "similar", undefined, 4),

    // Personality (matches User 1)
    q21: createResponse(
      {
        show: ["physical-touch", "quality-time"],
        receive: ["quality-time", "words-of-affirmation"],
      },
      "compatible",
      undefined,
      4
    ),
    q22: createResponse("direct", "similar", undefined, 4),
    q23: createResponse("discuss-immediately", "similar", undefined, 4),
    q24: createResponse("moderately-open", "similar", undefined, 3),
    q25: createResponse("healthy-disagreement", "compatible", undefined, 3),
    q26: createResponse("mix", "similar", undefined, 3),
    q27: createResponse("playful", "similar", undefined, 2),
    q28: createResponse(3, "similar", undefined, 3), // Balanced intro/extro
    q29: createResponse("11pm-1am", "similar", undefined, 2),
    q30: createResponse("collaborative", "compatible", undefined, 3),
    q31: createResponse("healthy-amount", "similar", undefined, 3),
    q32: createResponse("moderate", "similar", undefined, 2),
    q33: createResponse("few-times-week", "similar", undefined, 3),
    q34: createResponse("moderately-ambitious", "similar", undefined, 4),
    q35: createResponse("some-okay", "similar", undefined, 3),
    q36: createResponse(
      ["honesty", "connection", "growth"],
      "similar",
      undefined,
      4
    ),

    // Free response
    q37: createResponse(
      "Communication is essential. I need someone who talks through issues.",
      "doesntMatter",
      undefined,
      1
    ),
    q38: createResponse(
      "I volunteer at a local animal shelter every weekend working towards my foster license.",
      "doesntMatter",
      undefined,
      1
    ),
  };

  return {
    user1: user1Responses,
    user2: user2Responses,
  };
}

// ============================================
// Seeding Functions
// ============================================

async function clearExistingTestData(): Promise<void> {
  console.log("🧹 Clearing existing test data...");

  // Delete in order of dependencies
  await prisma.textEmbedding.deleteMany({});
  await prisma.cupidProfileSummary.deleteMany({});
  await prisma.cupidAssignment.deleteMany({});
  await prisma.compatibilityScore.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.questionnaireResponse.deleteMany({});
  await prisma.questionnaire.deleteMany({});
  await prisma.cupidProfile.deleteMany({});
  await prisma.upload.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});

  // Delete test users (those with @student.ubc.ca emails that contain numbers)
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: "@student.ubc.ca",
      },
    },
  });

  console.log("✅ Cleared existing test data");
}

async function createTestUsers(hashedPassword: string): Promise<string[]> {
  console.log(`📝 Creating ${NUM_USERS} test users...`);

  const userIds: string[] = [];

  // First, create 10 perfect match pairs (20 users total)
  console.log("  Creating 10 perfect match pairs...");
  const perfectMatchPairs = [
    { age: 20, femaleFirst: "Emma", maleFirst: "Liam" },
    { age: 21, femaleFirst: "Olivia", maleFirst: "Noah" },
    { age: 19, femaleFirst: "Sophia", maleFirst: "Oliver" },
    { age: 22, femaleFirst: "Isabella", maleFirst: "Elijah" },
    { age: 21, femaleFirst: "Ava", maleFirst: "James" },
    { age: 20, femaleFirst: "Mia", maleFirst: "William" },
    { age: 23, femaleFirst: "Charlotte", maleFirst: "Benjamin" },
    { age: 21, femaleFirst: "Amelia", maleFirst: "Lucas" },
    { age: 19, femaleFirst: "Harper", maleFirst: "Henry" },
    { age: 22, femaleFirst: "Evelyn", maleFirst: "Alexander" },
  ];

  for (let i = 0; i < perfectMatchPairs.length; i++) {
    const pair = perfectMatchPairs[i];
    const matchData = createPerfectMatchPair(pair.age);
    const lastName1 = randomElement(LAST_NAMES);
    const lastName2 = randomElement(LAST_NAMES);

    // Create female user
    const femaleUser = await prisma.user.create({
      data: {
        email: `${pair.femaleFirst.toLowerCase()}.${lastName1.toLowerCase()}${i * 2}@student.ubc.ca`,
        password: hashedPassword,
        firstName: pair.femaleFirst,
        lastName: lastName1,
        age: pair.age,
        emailVerified: new Date(),
        acceptedTerms: new Date(),
        isCupid: false,
        isBeingMatched: true,
        displayName: pair.femaleFirst,
        major: randomElement(MAJORS),
        interests: generateInterests(),
      },
    });

    await prisma.questionnaireResponse.create({
      data: {
        userId: femaleUser.id,
        responses: encryptJSON(matchData.user1),
        isSubmitted: true,
        submittedAt: new Date(),
      },
    });

    userIds.push(femaleUser.id);

    // Create male user
    const maleUser = await prisma.user.create({
      data: {
        email: `${pair.maleFirst.toLowerCase()}.${lastName2.toLowerCase()}${i * 2 + 1}@student.ubc.ca`,
        password: hashedPassword,
        firstName: pair.maleFirst,
        lastName: lastName2,
        age: pair.age,
        emailVerified: new Date(),
        acceptedTerms: new Date(),
        isCupid: false,
        isBeingMatched: true,
        displayName: pair.maleFirst,
        major: randomElement(MAJORS),
        interests: generateInterests(),
      },
    });

    await prisma.questionnaireResponse.create({
      data: {
        userId: maleUser.id,
        responses: encryptJSON(matchData.user2),
        isSubmitted: true,
        submittedAt: new Date(),
      },
    });

    userIds.push(maleUser.id);
  }

  console.log("  ✅ Created 10 perfect match pairs (20 users)");

  // Now create remaining random users
  const remainingUsers = NUM_USERS - 20;
  const batchSize = 50;
  console.log(`  Creating ${remainingUsers} random users...`);

  for (let batch = 0; batch < remainingUsers / batchSize; batch++) {
    const usersToCreate = [];

    for (let i = 0; i < batchSize; i++) {
      const index = batch * batchSize + i + 20; // Offset by 20 for perfect pairs
      const isMale = Math.random() > 0.5;
      const firstName = isMale
        ? randomElement(FIRST_NAMES_MALE)
        : randomElement(FIRST_NAMES_FEMALE);
      const lastName = randomElement(LAST_NAMES);
      const age = generateAge();

      usersToCreate.push({
        email: generateEmail(firstName, lastName, index),
        password: hashedPassword,
        firstName,
        lastName,
        age,
        emailVerified: new Date(),
        acceptedTerms: new Date(),
        isCupid: false,
        isBeingMatched: true,
        displayName: firstName,
        major: randomElement(MAJORS),
        interests: generateInterests(),
      });
    }

    const createdUsers = await prisma.user.createManyAndReturn({
      data: usersToCreate,
      select: { id: true, age: true, firstName: true },
    });

    // Create questionnaire responses for each user
    for (const user of createdUsers) {
      // Generate gender and orientation for random users
      const genders = ["woman", "man", "non-binary"];
      const gender = randomElement(genders);
      const orientations = [
        "heterosexual",
        "homosexual",
        "bisexual",
        "pansexual",
      ];
      const orientation = randomElement(orientations);

      // Generate gender preference based on orientation
      let genderPreference: string[];
      if (orientation === "heterosexual") {
        genderPreference =
          gender === "man"
            ? ["women"]
            : gender === "woman"
              ? ["men"]
              : ["men", "women"];
      } else if (orientation === "homosexual") {
        genderPreference =
          gender === "man"
            ? ["men"]
            : gender === "woman"
              ? ["women"]
              : [gender];
      } else {
        genderPreference = Math.random() > 0.5 ? ["anyone"] : ["men", "women"];
      }

      const responses = generateQuestionnaireResponses(
        user.age!,
        gender,
        orientation,
        genderPreference
      );

      await prisma.questionnaireResponse.create({
        data: {
          userId: user.id,
          responses: encryptJSON(responses),
          isSubmitted: true,
          submittedAt: new Date(),
        },
      });

      userIds.push(user.id);
    }

    console.log(`  Batch ${batch + 1}/${remainingUsers / batchSize} complete`);
  }

  console.log(
    `✅ Created ${userIds.length} test users (20 perfect pairs + ${remainingUsers} random) with questionnaire responses`
  );
  return userIds;
}

async function createTestCupids(hashedPassword: string): Promise<string[]> {
  console.log(`🏹 Creating ${NUM_CUPIDS} test cupids...`);

  const cupidIds: string[] = [];
  const batchSize = 50;

  for (let batch = 0; batch < NUM_CUPIDS / batchSize; batch++) {
    const cupidsToCreate = [];

    for (let i = 0; i < batchSize; i++) {
      const index = batch * batchSize + i + 1000; // Offset from regular users
      const isMale = Math.random() > 0.5;
      const firstName = isMale
        ? randomElement(FIRST_NAMES_MALE)
        : randomElement(FIRST_NAMES_FEMALE);
      const lastName = randomElement(LAST_NAMES);

      cupidsToCreate.push({
        email: generateEmail(firstName, lastName, index),
        password: hashedPassword,
        firstName,
        lastName,
        age: generateAge(),
        emailVerified: new Date(),
        acceptedTerms: new Date(),
        isCupid: true,
        isBeingMatched: false, // Cupids typically not being matched themselves
        displayName: firstName,
        cupidDisplayName: `Cupid ${firstName}`,
        major: randomElement(MAJORS),
        interests: generateInterests(),
      });
    }

    const createdCupids = await prisma.user.createManyAndReturn({
      data: cupidsToCreate,
      select: { id: true },
    });

    // Create approved CupidProfile for each
    for (const cupid of createdCupids) {
      await prisma.cupidProfile.create({
        data: {
          userId: cupid.id,
          approved: true,
          matchesCreated: 0,
        },
      });

      cupidIds.push(cupid.id);
    }

    console.log(`  Batch ${batch + 1}/${NUM_CUPIDS / batchSize} complete`);
  }

  console.log(
    `✅ Created ${cupidIds.length} test cupids with approved profiles`
  );
  return cupidIds;
}

async function printStats(): Promise<void> {
  console.log("\n📊 Database Statistics:");

  const totalUsers = await prisma.user.count();
  const usersBeingMatched = await prisma.user.count({
    where: { isBeingMatched: true },
  });
  const cupids = await prisma.user.count({
    where: { isCupid: true },
  });
  const approvedCupids = await prisma.cupidProfile.count({
    where: { approved: true },
  });
  const questionnaireResponses = await prisma.questionnaireResponse.count();
  const submittedResponses = await prisma.questionnaireResponse.count({
    where: { isSubmitted: true },
  });

  // Gender distribution tracked via V2 responses (encrypted)

  console.log(`  Total Users: ${totalUsers}`);
  console.log(`  Users Being Matched: ${usersBeingMatched}`);
  console.log(`  Cupids: ${cupids}`);
  console.log(`  Approved Cupids: ${approvedCupids}`);
  console.log(`  Questionnaire Responses: ${questionnaireResponses}`);
  console.log(`  Submitted Responses: ${submittedResponses}`);
  console.log("");
}

// ============================================
// Main Execution
// ============================================

async function main(): Promise<void> {
  console.log("🚀 Starting database seeding...\n");

  try {
    // Hash the default password once
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Clear existing test data
    await clearExistingTestData();

    // Create test users
    await createTestUsers(hashedPassword);

    // Create test cupids
    await createTestCupids(hashedPassword);

    // Print stats
    await printStats();

    console.log("✅ Database seeding complete!\n");
    console.log("📋 Test Credentials:");
    console.log(`   Email format: firstname.lastnameN@student.ubc.ca`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log("");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
