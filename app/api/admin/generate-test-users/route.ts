import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import questionnaireConfig from "@/src/data/questionnaire-config.json";

/**
 * Helper function to generate random responses for questionnaire
 */
function generateRandomResponses(): {
  responses: Record<string, string | string[] | { min: number; max: number }>;
  importance: Record<string, number>;
} {
  const responses: Record<
    string,
    string | string[] | { min: number; max: number }
  > = {};
  const importance: Record<string, number> = {};

  // Gender options for matching logic
  const genderOptions = ["man", "woman", "non-binary"];
  const selectedGender =
    genderOptions[Math.floor(Math.random() * genderOptions.length)];
  responses["q1"] = selectedGender;

  // Orientation
  const orientationOptions = [
    "heterosexual",
    "gay-lesbian",
    "bisexual",
    "pansexual",
  ];
  responses["q2"] =
    orientationOptions[Math.floor(Math.random() * orientationOptions.length)];

  // Match preferences - generate compatible preferences
  const matchPreferenceOptions = ["men", "women", "non-binary", "anyone"];
  const numPreferences = Math.floor(Math.random() * 3) + 1; // 1-3 preferences
  const selectedPreferences: string[] = [];
  for (let i = 0; i < numPreferences; i++) {
    const pref =
      matchPreferenceOptions[
        Math.floor(Math.random() * matchPreferenceOptions.length)
      ];
    if (!selectedPreferences.includes(pref) && pref !== "anyone") {
      selectedPreferences.push(pref);
    }
  }
  if (selectedPreferences.length === 0 || Math.random() > 0.7) {
    selectedPreferences.push("anyone");
  }
  responses["q3"] = selectedPreferences;

  // Process all sections
  for (const section of questionnaireConfig.sections) {
    for (const question of section.questions) {
      // Skip if already answered (q1, q2, q3)
      if (responses[question.id]) continue;

      switch (question.type) {
        case "single-choice":
          if (
            "options" in question &&
            question.options &&
            question.options.length > 0
          ) {
            const option =
              question.options[
                Math.floor(Math.random() * question.options.length)
              ];
            responses[question.id] = option.value;

            // If option has text input, add some random text
            if (
              "hasTextInput" in option &&
              option.hasTextInput &&
              Math.random() > 0.5
            ) {
              responses[`${question.id}_text`] = "Something unique about me";
            }
          }
          break;

        case "multi-choice":
          if (
            "options" in question &&
            question.options &&
            question.options.length > 0
          ) {
            const numSelections =
              Math.floor(Math.random() * Math.min(3, question.options.length)) +
              1;
            const selected: string[] = [];
            const availableOptions = [...question.options];
            for (let i = 0; i < numSelections; i++) {
              const idx = Math.floor(Math.random() * availableOptions.length);
              selected.push(availableOptions[idx].value);
              availableOptions.splice(idx, 1);
            }
            responses[question.id] = selected;
          }
          break;

        case "ranking":
          if (
            "options" in question &&
            question.options &&
            question.options.length > 0
          ) {
            // Select 3 random options for ranking
            const availableOptions = [...question.options];
            const ranked: string[] = [];
            for (let i = 0; i < Math.min(3, availableOptions.length); i++) {
              const idx = Math.floor(Math.random() * availableOptions.length);
              ranked.push(availableOptions[idx].value);
              availableOptions.splice(idx, 1);
            }
            responses[question.id] = ranked;
          }
          break;

        case "age-range":
          // Generate realistic age range (18-30 typically)
          const minAge = 18 + Math.floor(Math.random() * 5); // 18-22
          const maxAge = minAge + Math.floor(Math.random() * 8) + 2; // +2 to +10 years
          responses[question.id] = { min: minAge, max: Math.min(maxAge, 30) };
          break;

        case "textarea":
          // Generate some sample text responses
          const sampleTexts = [
            "I'm really passionate about this and think it's important.",
            "This is something I care deeply about and want to share.",
            "I believe in being genuine and authentic in relationships.",
            "Communication and honesty are really important to me.",
            "I love exploring new experiences and meeting new people.",
          ];
          responses[question.id] =
            sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
          break;

        default:
          // For any other types, provide a default response
          if (
            "options" in question &&
            question.options &&
            question.options.length > 0
          ) {
            responses[question.id] = question.options[0].value;
          }
      }

      // Add importance rating for questions that have it
      if ("hasImportance" in question && question.hasImportance) {
        importance[question.id] = Math.floor(Math.random() * 5) + 1; // 1-5
      }
    }
  }

  return { responses, importance };
}

/**
 * Generate Test Users
 * POST /api/admin/generate-test-users
 *
 * Creates test users for development/testing
 * Body: { count: number, userType: "match" | "cupid" }
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const count = body.count || 125;
    const userType = body.userType || "match"; // "match" or "cupid"

    const hashedPassword = await hashPassword("TestPassword123!");

    // Get current test user count to ensure unique emails
    const existingTestUsers = await prisma.user.count({
      where: { isTestUser: true },
    });

    const usersToCreate = [];

    for (let i = 0; i < count; i++) {
      const userIndex = existingTestUsers + i;
      const firstName =
        userType === "cupid" ? `Cupid${userIndex}` : `Match${userIndex}`;
      const lastName = `Test`;
      const email = `test${userIndex}@student.ubc.ca`;
      const isCupid = userType === "cupid";

      usersToCreate.push({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        cupidDisplayName: `${firstName} ${lastName}`,
        age: 18 + (i % 10), // Ages 18-27
        emailVerified: new Date(), // Already verified
        acceptedTerms: new Date(),
        isCupid,
        isBeingMatched: !isCupid, // Cupids don't get matched by default
        isTestUser: true, // Mark as test user for easy cleanup
      });
    }

    // Create users in batches to avoid overwhelming the database
    const BATCH_SIZE = 50;
    let created = 0;

    for (let i = 0; i < usersToCreate.length; i += BATCH_SIZE) {
      const batch = usersToCreate.slice(i, i + BATCH_SIZE);
      await prisma.user.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += batch.length;
    }

    // If creating cupids, also create CupidProfile records
    if (userType === "cupid") {
      const createdUsers = await prisma.user.findMany({
        where: {
          email: { in: usersToCreate.map((u) => u.email) },
        },
        select: { id: true },
      });

      const cupidProfiles = createdUsers.map((u) => ({
        userId: u.id,
        approved: true,
      }));

      await prisma.cupidProfile.createMany({
        data: cupidProfiles,
        skipDuplicates: true,
      });
    }

    // If creating match users, also create completed questionnaire responses
    if (userType === "match") {
      const createdUsers = await prisma.user.findMany({
        where: {
          email: { in: usersToCreate.map((u) => u.email) },
        },
        select: { id: true },
      });

      const questionnaireResponses = [];

      for (const user of createdUsers) {
        const { responses, importance } = generateRandomResponses();

        // Encrypt the responses and importance data
        const encryptedResponses = encrypt(JSON.stringify(responses));
        const encryptedImportance = encrypt(JSON.stringify(importance));

        questionnaireResponses.push({
          userId: user.id,
          responses: encryptedResponses,
          importance: encryptedImportance,
          isSubmitted: true,
          submittedAt: new Date(),
        });
      }

      // Create questionnaire responses in batches
      for (let i = 0; i < questionnaireResponses.length; i += BATCH_SIZE) {
        const batch = questionnaireResponses.slice(i, i + BATCH_SIZE);
        await prisma.questionnaireResponse.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      message: `Generated ${created} test ${userType} users${userType === "match" ? " with completed questionnaires" : ""}`,
      created,
      userType,
    });
  } catch (error) {
    console.error("Error generating test users:", error);
    return NextResponse.json(
      { error: "Failed to generate test users" },
      { status: 500 }
    );
  }
}
