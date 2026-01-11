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

// Question option values from questionnaire-config.json
const QUESTION_OPTIONS: Record<string, string[] | string> = {
  q1: ["man", "woman", "non-binary"],
  q2: [
    "heterosexual",
    "gay-lesbian",
    "bisexual",
    "pansexual",
    "asexual",
    "questioning",
  ],
  q3: ["men", "women", "non-binary", "anyone"], // Multi-choice
  q4: ["sleep-noon", "early-active", "friends", "productive"],
  q5: ["talk-out", "alone", "physical", "escapism"],
  q6: ["confident", "warm-up", "corner", "leave-early", "wouldnt-go"],
  q7: ["organizer", "flow", "suggests", "shows-up", "terrible"],
  q8: ["quick", "few-hours", "slow-thoughtful", "terrible"],
  q9: ["going-out", "treat", "sleep", "stress-next", "no-celebrate"],
  q10: [
    "clever-wordplay",
    "absurd-random",
    "dark-edgy",
    "wholesome-goofy",
    "sarcastic-dry",
    "self-deprecating",
  ],
  q11: ["dj", "navigator", "entertainer", "sleeper", "driver"],
  q12: ["thrive", "occasionally", "advance-notice", "stresses"],
  q13: [
    "rejected",
    "never",
    "once-twice",
    "multiple",
    "experienced",
    "very-experienced",
  ],
  q14: ["high", "moderate", "low-key"],
  q15: ["career-focused", "balanced", "life-first"],
  q16: ["talk-immediately", "space-first", "distract", "bottle-up"],
  q17: ["central", "important", "occasional", "not-priority", "unsure"],
  q18: ["infinite", "high", "moderate", "low", "hermit"],
  q19: ["spotless", "clean-enough", "organized-chaos", "mess"],
  q20: ["save-aggressively", "save-regularly", "save-when-can", "live-moment"],
  q21: ["early-morning", "mid-day", "late-night", "varies"],
  q22: ["huge-part", "few-times", "inconsistent", "not-thing", "walking"],
  q23: [
    "direct",
    "time-then-talk",
    "process-internally",
    "emotional-need-space",
  ],
  q24: ["healthy", "bit-normal", "insecurity", "not-jealous", "not-sure"],
  q25: ["direct", "thoughtful", "casual", "indirect"],
  q26: [
    "social",
    "occasional",
    "rarely",
    "dont-drink",
    "prefer-partner-doesnt",
  ],
  q27: ["always-down", "open", "cautious", "resistant"],
  q28: ["stability", "growth", "freedom", "connection", "achievement"],
  q29: ["very", "somewhat", "not-very", "not-important", "non-religious"],
  q30: ["physical-touch", "words", "quality-time", "acts-service", "gifts"], // Ranking - top 3
  q31: ["open-quickly", "time-trust", "private", "struggle"],
  q32: ["solve", "listen", "space", "distract", "struggle"],
  q33: ["high", "moderate", "low-key", "similar", "doesnt-matter"],
  q34: "age-range", // Special handling
  q35: ["outgoing", "somewhat-social", "introverted", "doesnt-matter"],
  q36: [
    "highly-driven",
    "balanced",
    "relationships-first",
    "doesnt-matter",
    "similar",
  ],
  q37: [
    "help-solve",
    "listen-support",
    "give-space",
    "distract-cheer",
    "match-style",
  ],
  q38: [
    "absolutely-not",
    "probably-not",
    "could-deal",
    "dont-care",
    "im-messy",
  ],
  q39: ["makes-laugh", "can-joke", "genuine", "challenges"],
  q40: ["immediate", "space-discuss", "resolve", "similar"],
  q41: ["physical-touch", "words", "quality-time", "acts-service", "gifts"], // Ranking - top 3
  q42: ["very-open", "somewhat-open", "reserved", "meet-where"],
  q43: ["active-outdoorsy", "some-activity", "low-key-indoor", "common-ground"],
  q44: ["organized", "spontaneous", "mix", "doesnt-matter"],
  q45: ["exact-views", "same-direction", "respectful-disagree", "not-factor"],
  q46: ["similar", "doesnt-matter", "less", "more"],
  q47: [
    "never-dated",
    "once-twice",
    "few-times",
    "experienced",
    "no-preference",
  ],
  q48: [
    "serious-long-term",
    "dating-potential",
    "casual-fun",
    "friendship-first",
    "exploring",
  ],
  q49: ["constant", "regular", "casual", "independent"],
  q50: [
    "comfortable-excited",
    "excited-anxious",
    "enjoy-distance",
    "want-scared",
    "none-fit",
  ],
  q51: ["activities", "same-space", "deep-conversations", "figuring-out"],
  q52: [
    "equally-focused",
    "values-not-intense",
    "accept-as-is",
    "challenges-me",
  ],
  q53: ["healthy", "rare", "uncomfortable", "incompatibility"],
  q54: ["lot-independence", "balance", "most-time", "figuring-out"],
  q55: [
    "exclusivity",
    "showing-up",
    "planning-future",
    "prioritizing",
    "honest-vulnerable",
    "figuring-out",
  ],
  q56: ["very", "somewhat", "not-very", "not-important"],
  q57: [
    "trust-honesty",
    "communication",
    "fun-laughter",
    "intimacy",
    "shared-values",
    "support",
    "loyalty",
  ],
  q58: ["slowly", "naturally", "early-physical", "not-sure"],
  q59: ["same-campus", "same-city", "long-distance", "doesnt-matter"],
  // Open-ended questions (q60-q63)
  q60: "textarea",
  q61: "textarea",
  q62: "textarea",
  q63: "textarea",
};

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

const MATCH_MESSAGES = [
  "I take a while to open up, but once I do, I'm incredibly loyal and always there for my partner. I value deep connections over surface-level interactions.",
  "I'm a planner who loves spontaneous adventures. Seems contradictory but I think structure enables freedom. Looking for someone who gets that.",
  "I'm ambitious about my career but never at the expense of relationships. Family and friendships are my priority, work is just work.",
  "I communicate directly and appreciate the same in return. No games, no guessing - just honest conversations about feelings.",
  "I'm an introvert who loves social situations in small doses. Quality time with one person means more to me than big group hangs.",
  "I'm working on being more vulnerable - it doesn't come naturally but I recognize it's essential for real connection.",
  "I have strong opinions but I'm always open to changing my mind with good arguments. Debate is fun for me, not personal.",
  "I show love through actions more than words. If I make you coffee every morning, that's my 'I love you.'",
  "I need alone time to recharge but that doesn't mean I'm not thinking about you. Space makes the heart grow fonder for me.",
  "I'm genuinely curious about everything. First dates with me involve a lot of questions - I want to know what makes people tick.",
];

const MATCH_QUESTIONS = [
  "What's a belief you held strongly 5 years ago that you've completely changed your mind about?",
  "If you could have dinner with anyone, living or dead, who would it be and why?",
  "What's something small that makes you unreasonably happy?",
  "What's the most valuable lesson a past relationship taught you?",
  "If money wasn't a factor, how would you spend your Tuesdays?",
  "What's a book/movie/show that fundamentally changed how you see the world?",
  "What would your best friend say is your most annoying habit?",
  "What's something you're proud of that has nothing to do with work or school?",
  "If you had to eat one cuisine for the rest of your life, what would it be?",
  "What's the kindest thing a stranger has ever done for you?",
];

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

function generateImportance(): number {
  // 1-5 scale with most being 3-4
  const weights = [5, 15, 40, 30, 10];
  const values = [1, 2, 3, 4, 5];
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return values[i];
  }
  return 3;
}

function generateAgeRange(userAge: number): { minAge: number; maxAge: number } {
  // Generate reasonable age ranges based on user's age
  const minOffset = Math.floor(Math.random() * 3) + 1; // 1-3 years younger
  const maxOffset = Math.floor(Math.random() * 4) + 1; // 1-4 years older
  return {
    minAge: Math.max(18, userAge - minOffset),
    maxAge: Math.min(35, userAge + maxOffset),
  };
}

function generateGenderPreferences(
  gender: string,
  orientation: string
): string[] {
  // Generate realistic matching preferences based on gender and orientation
  if (orientation === "heterosexual") {
    if (gender === "man") return ["women"];
    if (gender === "woman") return ["men"];
    return ["men", "women"];
  }
  if (orientation === "gay-lesbian") {
    if (gender === "man") return ["men"];
    if (gender === "woman") return ["women"];
    return [gender === "man" ? "men" : "women"];
  }
  if (orientation === "bisexual" || orientation === "pansexual") {
    return Math.random() > 0.7 ? ["anyone"] : ["men", "women"];
  }
  // For asexual, questioning, etc.
  return Math.random() > 0.5 ? ["anyone"] : ["men", "women", "non-binary"];
}

function generateQuestionnaireResponses(userAge: number): {
  responses: Record<string, unknown>;
  importance: Record<string, number>;
} {
  const responses: Record<string, unknown> = {};
  const importance: Record<string, number> = {};

  // Generate gender and orientation first (affects q3)
  const gender = randomElement(QUESTION_OPTIONS.q1 as string[]);
  const orientation = randomElement(QUESTION_OPTIONS.q2 as string[]);

  responses.q1 = gender;
  responses.q2 = orientation;
  responses.q3 = generateGenderPreferences(gender, orientation);

  // Generate answers for all other questions
  for (const [questionId, optionsOrType] of Object.entries(QUESTION_OPTIONS)) {
    if (["q1", "q2", "q3"].includes(questionId)) continue;

    if (typeof optionsOrType === "string" && optionsOrType === "age-range") {
      // q34 - age range
      responses[questionId] = generateAgeRange(userAge);
    } else if (
      typeof optionsOrType === "string" &&
      optionsOrType === "textarea"
    ) {
      // Open-ended questions
      switch (questionId) {
        case "q60":
          responses[questionId] = randomElement(DEALBREAKERS);
          break;
        case "q61":
          responses[questionId] = randomElement(PASSIONS);
          break;
        case "q62":
          responses[questionId] = randomElement(MATCH_MESSAGES);
          break;
        case "q63":
          responses[questionId] = randomElement(MATCH_QUESTIONS);
          break;
      }
    } else if (Array.isArray(optionsOrType)) {
      if (["q30", "q41"].includes(questionId)) {
        // Ranking questions - select top 3
        responses[questionId] = randomElements(optionsOrType, 3);
        importance[questionId] = generateImportance();
      } else {
        // Single-choice questions
        responses[questionId] = randomElement(optionsOrType);
        // Add importance for questions that have it (skip section 0 and section 5)
        if (
          !["q1", "q2", "q3", "q60", "q61", "q62", "q63"].includes(questionId)
        ) {
          importance[questionId] = generateImportance();
        }
      }
    }
  }

  return { responses, importance };
}

// ============================================
// Perfect Match User Generation
// ============================================

/**
 * Create a pair of users designed to match well with each other
 * Returns their questionnaire data
 */
function createPerfectMatchPair(baseAge: number): {
  user1: {
    responses: Record<string, unknown>;
    importance: Record<string, number>;
  };
  user2: {
    responses: Record<string, unknown>;
    importance: Record<string, number>;
  };
} {
  // Shared preferences for high compatibility
  const sharedResponses = {
    // Section 1: Icebreakers - Very similar
    q4: "early-active",
    q5: "talk-out",
    q6: "confident",
    q7: "organizer",
    q8: "slow-thoughtful",
    q9: "going-out",
    q10: "clever-wordplay",
    q11: "navigator",
    q12: "thrive",
    q13: "once-twice",

    // Section 2: What I'm Like - Highly compatible
    q14: "moderate",
    q15: "balanced",
    q16: "talk-immediately",
    q17: "important",
    q18: "moderate",
    q19: "clean-enough",
    q20: "save-regularly",
    q21: "mid-day",
    q22: "few-times",
    q23: "direct",
    q24: "healthy",
    q25: "direct",
    q26: "occasional",
    q27: "open",
    q28: "connection",
    q29: "somewhat",
    q30: ["quality-time", "words", "physical-touch"], // Ranking
    q31: "time-trust",
    q32: "listen",
  };

  // User 1: Woman looking for men
  const user1Responses: Record<string, unknown> = {
    ...sharedResponses,
    q1: "woman",
    q2: "heterosexual",
    q3: ["men"],
    q34: { minAge: baseAge - 2, maxAge: baseAge + 3 }, // Accepts baseAge

    // Section 3: Preferences that match User 2's characteristics
    q33: "moderate", // Wants moderate energy
    q35: "somewhat-social", // Wants somewhat social
    q36: "balanced", // Wants balanced ambition
    q37: "listen-support", // Wants emotional support
    q38: "could-deal", // Flexible on messiness
    q39: "can-joke", // Wants humor but not constant
    q40: "space-discuss", // Wants to take space then discuss
    q41: ["quality-time", "words", "acts-service"], // Ranking
    q42: "somewhat-open", // Wants somewhat vulnerable
    q43: "some-activity", // Wants some activity
    q44: "mix", // Wants mix of organized/spontaneous
    q45: "same-direction", // Similar values
    q46: "similar", // Similar experience
    q47: "few-times", // Some dating experience
    q48: "dating-potential", // Looking for serious potential
    q49: "regular", // Regular communication
    q50: "comfortable-excited", // Comfortable with intimacy
    q51: "deep-conversations", // Quality time through conversations
    q52: "equally-focused", // Balanced personal growth
    q53: "healthy", // Healthy conflict is normal
    q54: "balance", // Balance independence and togetherness
    q55: "showing-up", // Commitment means showing up
    q56: "very", // Physical attraction very important
    q57: ["communication", "trust-honesty", "fun-laughter"], // Ranking
    q58: "naturally", // Let physical intimacy develop
    q59: "same-campus", // Wants someone on campus

    // Open-ended
    q60: "Honesty and trust - I can't be with someone who lies.",
    q61: "I'm secretly really into astrophotography. I spend weekends driving to dark sky sites to capture the Milky Way.",
    q62: "I take a while to open up, but once I do, I'm incredibly loyal and always there for my partner.",
    q63: "What's a belief you held strongly 5 years ago that you've completely changed your mind about?",
  };

  // User 2: Man looking for women - designed to match User 1's preferences
  const user2Responses: Record<string, unknown> = {
    ...sharedResponses,
    q1: "man",
    q2: "heterosexual",
    q3: ["women"],
    q34: { minAge: baseAge - 3, maxAge: baseAge + 2 }, // Accepts baseAge

    // Section 3: Matches what User 1 is looking for
    q33: "moderate", // Has moderate energy (matches q33)
    q35: "somewhat-social", // Is somewhat social (matches q35)
    q36: "balanced", // Has balanced ambition (matches q36)
    q37: "listen-support", // Gives emotional support (matches q37)
    q38: "could-deal", // Flexible on messiness
    q39: "can-joke", // Has good humor balance
    q40: "space-discuss", // Handles conflict similarly
    q41: ["quality-time", "words", "acts-service"], // Ranking
    q42: "somewhat-open", // Is somewhat vulnerable
    q43: "some-activity", // Likes some activity
    q44: "mix", // Mix of organized/spontaneous
    q45: "same-direction", // Similar values
    q46: "similar", // Similar experience
    q47: "few-times", // Some dating experience
    q48: "dating-potential", // Looking for serious potential
    q49: "regular", // Regular communication
    q50: "comfortable-excited", // Comfortable with intimacy
    q51: "deep-conversations", // Quality time through conversations
    q52: "equally-focused", // Balanced personal growth
    q53: "healthy", // Healthy conflict is normal
    q54: "balance", // Balance independence and togetherness
    q55: "showing-up", // Commitment means showing up
    q56: "very", // Physical attraction very important
    q57: ["communication", "trust-honesty", "fun-laughter"], // Ranking
    q58: "naturally", // Let physical intimacy develop
    q59: "same-campus", // Wants someone on campus

    // Open-ended
    q60: "Communication is essential. I need someone who talks through issues.",
    q61: "I volunteer at a local animal shelter every weekend. I'm working on my foster license to help more animals find homes.",
    q62: "I communicate directly and appreciate the same in return. No games, no guessing - just honest conversations about feelings.",
    q63: "What's the most valuable lesson a past relationship taught you?",
  };

  // Generate importance ratings - high importance on compatibility factors
  const importance: Record<string, number> = {};
  for (const key of Object.keys(sharedResponses)) {
    if (!["q1", "q2", "q3", "q60", "q61", "q62", "q63"].includes(key)) {
      // High importance (4 or 5) for most questions
      importance[key] = Math.random() > 0.3 ? 4 : 5;
    }
  }

  return {
    user1: { responses: user1Responses, importance },
    user2: { responses: user2Responses, importance },
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
        responses: encryptJSON(matchData.user1.responses),
        importance: encryptJSON(matchData.user1.importance),
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
        responses: encryptJSON(matchData.user2.responses),
        importance: encryptJSON(matchData.user2.importance),
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
      select: { id: true, age: true },
    });

    // Create questionnaire responses for each user
    for (const user of createdUsers) {
      const { responses, importance } = generateQuestionnaireResponses(
        user.age!
      );

      await prisma.questionnaireResponse.create({
        data: {
          userId: user.id,
          responses: encryptJSON(responses),
          importance: encryptJSON(importance),
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

  // Gender distribution
  const genderSample = await prisma.questionnaireResponse.findMany({
    take: 50,
    select: { responses: true },
  });

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
