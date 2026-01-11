import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encryptJSON } from "@/lib/encryption";

/**
 * Seed Test Users API Route - V2 Format
 * POST /api/admin/seed-test-users-v2
 *
 * Generates test users with V2 questionnaire responses (nested QuestionResponse objects)
 * Body: { type: "match" | "cupid" | "both", count?: number }
 */

// Sample data arrays (same as seed-test-data.ts)
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
  "Steven",
  "Andrew",
  "Paul",
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
  "Ashley",
  "Emily",
  "Melissa",
  "Amanda",
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
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
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
];
const DEALBREAKERS = [
  "Honesty and trust - I can't be with someone who lies.",
  "Respect for my time and commitments. I need reliability.",
  "Communication is essential. I need someone who talks through issues.",
];
const PASSIONS = [
  "I'm secretly really into astrophotography. I spend weekends driving to dark sky sites to capture the Milky Way.",
  "I've been learning Korean for 3 years now. Started because of K-dramas but now I genuinely love the language structure and culture.",
  "Urban farming is my thing - I maintain a rooftop garden and supply vegetables to a local restaurant.",
];

const DEFAULT_PASSWORD = "TestPassword123!";

// Helper functions
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
  timestamp: number
): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}@student.ubc.ca`;
}

function generateAge(): number {
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

/**
 * Generate V2 questionnaire responses
 */
function generateQuestionnaireResponsesV2(
  userAge: number,
  gender: string,
  orientation: string,
  genderPreference: string[]
): Record<string, unknown> {
  const responses: Record<string, unknown> = {};

  const randImportance = () => {
    const weights = [10, 25, 40, 25];
    const values = [1, 2, 3, 4];
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) return values[i];
    }
    return 3;
  };

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

  // Hard filters
  responses.q1 = createResponse(
    gender,
    "specific_values",
    genderPreference,
    4,
    false
  );
  responses.q2 = createResponse(genderPreference, "same", undefined, 4, false);
  responses.q3 = createResponse(
    orientation,
    Math.random() > 0.6 ? "same" : "doesntMatter",
    undefined,
    randImportance()
  );

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

  // Lifestyle (Q5-Q20) - Simplified for API generation
  const cultures = ["east-asian", "south-asian", "white", "mixed"];
  responses.q5 = createResponse(
    randomElements(cultures, 1),
    Math.random() > 0.5 ? "doesntMatter" : "similar",
    undefined,
    randImportance()
  );

  const religions = [
    "not-religious",
    "spiritual-not-religious",
    "christian",
    "muslim",
  ];
  responses.q6 = createResponse(
    randomElement(religions),
    Math.random() > 0.6 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  responses.q7 = createResponse(
    Math.floor(Math.random() * 5) + 1,
    Math.random() > 0.5 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  const alcoholOptions = ["never", "rarely", "socially", "frequently"];
  responses.q8 = createResponse(
    randomElement(alcoholOptions),
    Math.random() > 0.6 ? "similar" : "doesntMatter",
    undefined,
    randImportance()
  );

  const drugOptions = ["none", "cannabis"];
  responses.q9 = createResponse(
    [randomElement(drugOptions)],
    "similar",
    undefined,
    randImportance()
  );

  responses.q10 = createResponse(
    Math.floor(Math.random() * 5) + 1,
    "similar",
    undefined,
    randImportance()
  );

  const dietOptions = ["omnivore", "vegetarian", "vegan"];
  responses.q11 = createResponse(
    randomElement(dietOptions),
    "doesntMatter",
    undefined,
    randImportance()
  );

  responses.q12 = createResponse(
    "never",
    "similar",
    undefined,
    randImportance()
  );
  responses.q13 = createResponse(
    randomElement(["before-11pm", "11pm-1am", "1am-3am"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q14 = createResponse(
    randomElement(["early-bird", "moderate", "night-owl"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q15 = createResponse(
    Math.floor(Math.random() * 5) + 1,
    "similar",
    undefined,
    randImportance()
  );
  responses.q16 = createResponse(
    randomElement(["very-clean", "clean", "organized-chaos"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q17 = createResponse(
    randomElement(["saver", "balanced", "spender"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q18 = createResponse(
    randomElement(["frequently", "occasionally", "rarely"]),
    "doesntMatter",
    undefined,
    randImportance()
  );
  responses.q19 = createResponse(
    randomElement(["have-love", "dont-have-love", "allergic"]),
    "compatible",
    undefined,
    randImportance()
  );
  responses.q20 = createResponse(
    randomElement(["career-focused", "family-focused", "balanced"]),
    "similar",
    undefined,
    randImportance()
  );

  // Personality (Q21-Q36) - Simplified
  const loveLanguages = [
    "physical-touch",
    "words-of-affirmation",
    "quality-time",
    "acts-of-service",
    "gifts",
  ];
  responses.q21 = createResponse(
    {
      show: randomElements(loveLanguages, 2),
      receive: randomElements(loveLanguages, 2),
    },
    "compatible",
    undefined,
    randImportance()
  );

  responses.q22 = createResponse(
    randomElement(["direct", "thoughtful", "emotional"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q23 = createResponse(
    randomElement(["discuss-immediately", "need-space-first", "compromise"]),
    "compatible",
    undefined,
    randImportance()
  );
  responses.q24 = createResponse(
    randomElement(["very-open", "moderately-open", "private"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q25 = createResponse(
    randomElement([
      "healthy-disagreement",
      "occasional-only",
      "avoid-conflict",
    ]),
    "compatible",
    undefined,
    randImportance()
  );
  responses.q26 = createResponse(
    randomElement(["spontaneous", "mix", "planner"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q27 = createResponse(
    randomElement(["sarcastic", "playful", "silly"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q28 = createResponse(
    Math.floor(Math.random() * 5) + 1,
    "similar",
    undefined,
    randImportance()
  );
  responses.q29 = createResponse(
    randomElement(["early-morning", "mid-day", "late-night", "flexible"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q30 = createResponse(
    randomElement(["quick-decisive", "thoughtful-slow", "collaborative"]),
    "compatible",
    undefined,
    randImportance()
  );
  responses.q31 = createResponse(
    randomElement(["not-jealous", "healthy-amount", "working-on-it"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q32 = createResponse(
    randomElement(["very-active", "moderate", "minimal"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q33 = createResponse(
    randomElement(["need-daily", "few-times-week", "occasionally"]),
    "compatible",
    undefined,
    randImportance()
  );
  responses.q34 = createResponse(
    randomElement(["very-ambitious", "moderately-ambitious", "laid-back"]),
    "similar",
    undefined,
    randImportance()
  );
  responses.q35 = createResponse(
    randomElement(["very-comfortable", "some-okay", "prefer-private"]),
    "similar",
    undefined,
    randImportance()
  );

  const values = [
    "honesty",
    "loyalty",
    "adventure",
    "stability",
    "growth",
    "connection",
  ];
  responses.q36 = createResponse(
    randomElements(values, 3),
    "similar",
    undefined,
    randImportance()
  );

  // Free response (Q37-Q38)
  responses.q37 = createResponse(
    randomElement(DEALBREAKERS),
    "doesntMatter",
    undefined,
    1,
    false
  );
  responses.q38 = createResponse(
    randomElement(PASSIONS),
    "doesntMatter",
    undefined,
    1,
    false
  );

  return responses;
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type = "both", count = 125 } = body;

    if (!["match", "cupid", "both"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'match', 'cupid', or 'both'" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    const timestamp = Date.now();
    let matchUsersCreated = 0;
    let cupidsCreated = 0;

    // Generate match users
    if (type === "match" || type === "both") {
      const matchCount = type === "both" ? Math.floor(count / 2) : count;

      for (let i = 0; i < matchCount; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale
          ? randomElement(FIRST_NAMES_MALE)
          : randomElement(FIRST_NAMES_FEMALE);
        const lastName = randomElement(LAST_NAMES);
        const age = generateAge();

        const gender = isMale ? "man" : "woman";
        const orientation = randomElement([
          "heterosexual",
          "bisexual",
          "pansexual",
        ]);
        const genderPreference = gender === "man" ? ["women"] : ["men"];

        const user = await prisma.user.create({
          data: {
            email: generateEmail(firstName, lastName, timestamp + i),
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
          },
        });

        const responses = generateQuestionnaireResponsesV2(
          age,
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

        matchUsersCreated++;
      }
    }

    // Generate cupid users
    if (type === "cupid" || type === "both") {
      const cupidCount = type === "both" ? Math.floor(count / 2) : count;

      for (let i = 0; i < cupidCount; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale
          ? randomElement(FIRST_NAMES_MALE)
          : randomElement(FIRST_NAMES_FEMALE);
        const lastName = randomElement(LAST_NAMES);
        const age = generateAge();

        const user = await prisma.user.create({
          data: {
            email: generateEmail(
              firstName,
              lastName,
              timestamp + matchUsersCreated + i
            ),
            password: hashedPassword,
            firstName,
            lastName,
            age,
            emailVerified: new Date(),
            acceptedTerms: new Date(),
            isCupid: true,
            isBeingMatched: false,
            displayName: firstName,
            cupidDisplayName: `Cupid ${firstName}`,
            major: randomElement(MAJORS),
            interests: generateInterests(),
          },
        });

        await prisma.cupidProfile.create({
          data: {
            userId: user.id,
            approved: true,
            matchesCreated: 0,
          },
        });

        cupidsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${matchUsersCreated} match users and ${cupidsCreated} cupids (V2 format)`,
      matchUsersCreated,
      cupidsCreated,
    });
  } catch (error) {
    console.error("Error generating test users:", error);
    return NextResponse.json(
      { error: "Failed to generate test users" },
      { status: 500 }
    );
  }
}
